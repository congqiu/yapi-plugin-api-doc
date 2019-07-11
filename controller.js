const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const projectModel = require('models/project.js');
const groupModel = require('models/group.js');
const interfaceCatModel = require('models/interfaceCat.js');
const yapi = require('yapi.js');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItTableOfContents = require('markdown-it-table-of-contents');
const defaultTheme = require('./defaultTheme.js');
const md = require('./markdown');

class exportController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.catModel = yapi.getInst(interfaceCatModel);
    this.interModel = yapi.getInst(interfaceModel);
    this.projectModel = yapi.getInst(projectModel);
    this.groupModel = yapi.getInst(groupModel);
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
   * @param {*} ctx 
   */
  async getDocument(ctx) {
    let group_id = ctx.params.group;

    let groupData = await this.groupModel.get(group_id);
    let tp = '';
    try {
      let htmlBody = '';

      if (!groupData) {
        htmlBody = '404 找不到对应的文档'
        return renderHtml(htmlBody);
      }
      
      let result = await this.projectModel.list(group_id);
      let projects = [];
      for (let i = 0, item, list; i < result.length; i++) {
        item = result[i].toObject();
        list = await this.handleListClass(item._id);
        if (list.length > 0) {
          projects.push({
            item,
            list
          });
        }
      }

      tp = await createHtml.bind(this)(projects);
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
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/3.20.1/antd.min.css">
          ${defaultTheme}
        </head>
        <body>
          ${htmlBody}
        </body>
        </html>
        `;
      return (ctx.body = html);
    }

    async function createHtml(projects) {
      let md = await createMarkdown.bind(this)(projects, true);
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
          ${left}
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

    function createMarkdown(projects, isToc) {
      //拼接markdown
      //模板
      let mdTemplate = ``;
      try {
        // 项目名称信息
        mdTemplate += md.createGroupMarkdown(groupData);
        for (let index = 0; index < projects.length; index++) {
          const project = projects[index];
          mdTemplate += md.createProjectMarkdown(project.item);
          // 分类信息
          mdTemplate += md.createClassMarkdown(groupData, project.list, isToc);
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
    await this.getDoc(ctx, 'open');
  }

  /**
   * 获取项目的文档
   * @param {请求} ctx 
   * @param {接口类型} status 
   */
  async getDoc(ctx, status) {
    let pid = ctx.request.query.pid;
    let isWiki = ctx.request.query.isWiki;

    status = status || ctx.request.query.status;

    if (!pid) {
      ctx.body = yapi.commons.resReturn(null, 200, 'pid 不为空');
    }
    let curProject, wikiData;
    let tp = '';
    try {
      curProject = await this.projectModel.get(pid);
      if (isWiki === 'true') {
        const wikiModel = require('../yapi-plugin-wiki/wikiModel.js');
        wikiData = await yapi.getInst(wikiModel).get(pid);
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

module.exports = exportController;
