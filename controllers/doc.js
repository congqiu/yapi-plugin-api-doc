const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const projectModel = require('models/project.js');
const groupModel = require('models/group.js');
const interfaceCatModel = require('models/interfaceCat.js');
const settingModel = require('../models/document');
const yapi = require('yapi.js');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItTableOfContents = require('markdown-it-table-of-contents');
const defaultTheme = require('../theme/default/defaultTheme.js');
const md = require('./markdown');

class fineDocController extends baseController {
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

  handleExistId(data) {
    function delArrId(arr, fn) {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        delete item._id;
        delete item.__v;
        delete item.uid;
        delete item.edit_uid;
        delete item.catid;
        delete item.project_id;

        if (typeof fn === 'function') fn(item);
      });
    }

    delArrId(data, function(item) {
      delArrId(item.list, function(api) {
        delArrId(api.req_body_form);
        delArrId(api.req_params);
        delArrId(api.req_query);
        delArrId(api.req_headers);
        if (api.query_path && typeof api.query_path === 'object') {
          delArrId(api.query_path.params);
        }
      });
    });

    return data;
  }

  /**
   * 获取开放文档列表
   * 数据量太大，暂停使用
   * @param {*} ctx 
   */
  async getDocument(ctx) {
    let group_id = ctx.params.group;

    let groupData = await this.groupModel.get(group_id);
    let tp = '', wikInst = null;
    try {
      let htmlBody = '';

      if (!groupData) {
        htmlBody = '404 找不到对应的文档'
        return renderHtml(htmlBody);
      }

      try {
        const wikiModel = require('../../yapi-plugin-wiki/wikiModel.js');
        wikInst = await yapi.getInst(wikiModel);
      } catch (error) {
      }
      
      let result = await this.projectModel.list(group_id);
      let projects = [], wikiDatas = [];
      
      for (let i = 0, item, list; i < result.length; i++) {
        item = result[i].toObject();
        let docSetting = await this.settingModel.findByProject(item._id);
        if (docSetting && docSetting.is_public) {
          list = await this.handleListClass(item._id, "open");
          if (list.length > 0) {
            if (wikInst) {
              wikiDatas.push(await wikInst.get(item._id));
            }
            projects.push({
              item,
              list
            });
          }
        }
      }

      tp = await createHtml.bind(this)(projects, wikiDatas);
      return (ctx.body = tp);
    } catch (error) {
      ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错');
    }

    function renderHtml (htmlBody) {
      ctx.set('Content-Type', 'text/html');
      let html = `<!DOCTYPE html>
        <html>
        <head>
          <title>在线文档</title>
          <meta charset="utf-8" />
          ${defaultTheme}
        </head>
        <body>
          ${htmlBody}
        </body>
        </html>
        `;
      return (ctx.body = html);
    }

    async function createHtml(projects, wikiDatas) {
      let md = await createMarkdown.bind(this)(projects, wikiDatas);
      let markdown = markdownIt({ html: true, breaks: true });
      markdown.use(markdownItAnchor); // Optional, but makes sense as you really want to link to something
      markdown.use(markdownItTableOfContents, {
        markerPattern: /^\[toc\]/im,
        includeLevel: [1, 2, 3]
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
      <title>在线接口文档</title>
      <meta charset="utf-8" />
      ${defaultTheme}
      </head>
      <body>
        <div class="g-doc">
          <div id="left">
          ${left}
          </div>
          <div id="right" class="content-right">
          ${tp}
          </div>
        </div>
      </body>
      <script src="https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js"></script>
      <script>
        $(".table-of-contents .inter-title").parent("li").find("a").click(function (e) {
          document.location.hash && $("[href='" + document.location.hash + "']").removeClass("active");
          $(this).addClass("active");
        })
        $(".table-of-contents > ul > li > ul > li > a").click(function (e) {
          $(this).parent("li").toggleClass("open");
          return false;
        })
      </script>
      </html>
      `;
      return html;
    }

    function createMarkdown(projects, wikiDatas) {
      //拼接markdown
      //模板
      let mdTemplate = ``;
      try {
        // 项目名称信息
        mdTemplate += md.createGroupMarkdown(groupData);
        for (let index = 0; index < projects.length; index++) {
          const project = projects[index];
          mdTemplate += md.createProjectMarkdown(project.item, wikiDatas[index]);
          // 分类信息
          mdTemplate += md.createClassMarkdown(project.item, project.list, true);
        }
        return mdTemplate;
      } catch (e) {
        yapi.commons.log(e, 'error');
        ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错');
      }
    }
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
        const wikiModel = require('../../yapi-plugin-wiki/wikiModel.js');
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
}

module.exports = fineDocController;
