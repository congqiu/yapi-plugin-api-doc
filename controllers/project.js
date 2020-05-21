const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const projectModel = require('models/project.js');
const groupModel = require('models/group.js');
const interfaceCatModel = require('models/interfaceCat.js');
const settingModel = require('../models/project');
const yapi = require('yapi.js');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItTableOfContents = require('markdown-it-table-of-contents');
const defaultTheme = require('../theme/default/defaultTheme.js');
const md = require('../utils/markdown');

class projectDocController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.catModel = yapi.getInst(interfaceCatModel);
    this.interModel = yapi.getInst(interfaceModel);
    this.projectModel = yapi.getInst(projectModel);
    this.groupModel = yapi.getInst(groupModel);
    this.settingModel = yapi.getInst(settingModel);
  }

  async handleListClass(pid, status) {
    let result = await this.catModel.list(pid),
      newResult = [];
    for (let i = 0, item, list; i < result.length; i++) {
      item = result[i].toObject();
      list = await this.interModel.listByInterStatus(item._id, status);
      list = list.sort((a, b) => {
        return a.index - b.index;
      });
      if (list.length > 0) {
        item.list = list;
        newResult.push(item);
      }
    }
    
    return newResult;
  }

  /**
   * 获取开放接口的文档
   * @param {*} ctx 
   */
  async getOpenDoc(ctx) {
    try {
      let pid = ctx.request.query.pid;
      if (!pid) {
        ctx.body = yapi.commons.resReturn(null, 200, 'pid 不为空');
      }
      let docSetting = await this.settingModel.findByProject(pid);
      if (docSetting && docSetting.is_public) {
        await this.getDoc(ctx, 'open');
      } else {
        ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错');
      }
    } catch (error) {
      ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错');
    }
  }

  /**
   * 获取项目的文档
   * @param {请求} ctx 
   * @param {接口类型} status 
   */
  async getDoc(ctx, status) {
    let pid = ctx.request.query.pid;

    status = status || ctx.request.query.status;

    if (!pid) {
      ctx.body = yapi.commons.resReturn(null, 200, 'pid 不为空');
    }
    let curProject, wikiData;
    let tp = '';
    try {
      curProject = await this.projectModel.get(pid);

      try {
        const wikiModel = require(yapi.path.join(yapi.WEBROOT, '/exts/yapi-plugin-wiki/wikiModel.js'));
        wikiData = await yapi.getInst(wikiModel).get(pid);
      } catch (error) {
      }

      ctx.set('Content-Type', 'text/html');
      const list = await this.handleListClass(pid, status);

      tp = await createHtml.bind(this)(list);
      return (ctx.body = tp);
    } catch (error) {
      yapi.commons.log(error, 'error');
      ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错');
    }

    async function createHtml(list) {
      let md = await createMarkdown.bind(this)(list, true);
      let markdown = markdownIt({ html: true, breaks: true });
      markdown.use(markdownItAnchor); // Optional, but makes sense as you really want to link to something
      markdown.use(markdownItTableOfContents, {
        markerPattern: /^\[toc\]/im,
        includeLevel: [2, 3]
      });

      let tp = unescape(markdown.render(md));
      let left;
      let content = tp.replace(
        /<div\s+?class="table-of-contents"\s*>[\s\S]*?<\/ul>\s*<\/div>/gi,
        function(match) {
          left = match;
          return '';
        }
      );

      return createHtml5(left || '', content);
    }

    function createHtml5(left, tp) {
      //html5模板
      let html = `<!DOCTYPE html>
      <html>
      <head>
      <title>${curProject.name}</title>
      <meta charset="utf-8" />
      ${defaultTheme}
      </head>
      <body>
        <div class="header-box" style="display: ${status === 'open' ? '' : 'none'}">
          <div class="breadcrumb">
            <span><a href="/api/public/plugin/documents">首页</a>/</span><span>${curProject.name}</span>
          </div>
        </div>
        <div class="g-doc">
          ${left}
          <div id="right" class="content-right">
          ${tp}
          </div>
        </div>
      </body>
      </html>
      `;
      return html;
    }

    function createMarkdown(list, isToc) {
      //拼接markdown
      //模板
      let mdTemplate = ``;
      try {
        // 项目名称信息
        mdTemplate += md.createProjectMarkdown(curProject, wikiData);
        // 分类信息
        mdTemplate += md.createClassMarkdown(curProject, list, isToc);
        return mdTemplate;
      } catch (e) {
        yapi.commons.log(e, 'error');
        ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错');
      }
    }
  }

  /**
   * 获取设置
   * @param {*} ctx 
   */
  async getSetting(ctx) {
    try {
      const projectId = ctx.params.project_id;
      let setting = await this.settingModel.findByProject(projectId);
      if (setting) {
        ctx.body = yapi.commons.resReturn(setting);
      } else {
        ctx.body = yapi.commons.resReturn({
            is_public: false,
            project_id: projectId
        });
      }
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }

  /**
   * 保存/更新设置
   * @param {*} ctx 
   */
  async saveSetting(ctx) {
    let params = ctx.request.body;

    try {
      let projectId = params.project_id, isPublic = params.is_public;
      if ((await this.checkAuth(projectId, 'project', 'edit')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
      }

      let username = this.getUsername(), uid = this.getUid();
      let data = {
        project_id: projectId,
        is_public: isPublic,
        uid: uid
      };
      yapi.commons.saveLog({
        content: `<a href="/user/profile/${uid}">${username}</a> 将接口文档设置为${isPublic ? "公开" : "不公开"}`,
        type: 'project',
        uid: uid,
        username: username,
        typeid: projectId
      });
      let res = await this.settingModel.findOneAndUpdate(projectId, data);
      ctx.body = yapi.commons.resReturn(res);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }

  async upIndex(ctx) {
    try {
      let params = ctx.request.body;

      if (this.getRole() != 'admin') {
        return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限'));
      }

      if (!params || !Array.isArray(params)) {
        ctx.body = yapi.commons.resReturn(null, 400, '请求参数必须是数组');
      }
      params.forEach(item => {
        if (item.id) {
          this.settingModel.findOneAndUpdate(item.id, {index: item.index}).then(
            res => {},
            err => {
              yapi.commons.log(err.message, 'error');
            }
          );
        }
      });
      return (ctx.body = yapi.commons.resReturn('成功！'));
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 400, e.message);
    }
  }
}

module.exports = projectDocController;
