/*
 * @Author: qiucong
 * @Date: 2020-05-19 10:02:27
 * @LastEditors: qiucong
 * @LastEditTime: 2020-05-20 17:28:09
 */ 
const baseController = require('controllers/base.js');
const interfaceModel = require('models/interface.js');
const interfaceCatModel = require('models/interfaceCat.js');
const settingModel = require('../models/project');
const yapi = require('yapi.js');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItTableOfContents = require('markdown-it-table-of-contents');
const defaultTheme = require('../theme/default/defaultTheme.js');
const md = require('../utils/markdown');

class interfaceDocController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.catModel = yapi.getInst(interfaceCatModel);
    this.interModel = yapi.getInst(interfaceModel);
    this.settingModel = yapi.getInst(settingModel);
  }

  /**
   * 搜索接口
   * @param {*} ctx 
   */
  async search(ctx) {
    let params = ctx.request.body;

    let tp = '', keyword = params.keyword;
    if (keyword.trim() === '') {
      ctx.set('Content-Type', 'text/html');
      return (ctx.body = createHtml5("", "", false));
    }
    try {
      let projects = await this.settingModel.listByStatus(true);
      let projectIds = projects.map(v => v.project_id);

      let list = await this.interModel.search(keyword);
      list = list.filter((v) => {
        return v.api_opened === true && projectIds.includes(v.project_id);
      })
      ctx.set('Content-Type', 'text/html');

      tp = await createHtml.bind(this)(list);
      return (ctx.body = tp);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
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

      return createHtml5(left || '', content, list.length > 0);
    }

    function createHtml5(left, tp, hasInter) {
      let info = '';
      if (!hasInter) {
        info = `
          <script src="/prd/assets.js?v=${Math.random()}"></script>
          <script>
            document.write('<link rel="stylesheet"  href="/prd/' + window.WEBPACK_ASSETS['index.js'].css + '" />');
          </script>
        `
      }
      //html5模板
      let html = `<!DOCTYPE html>
      <html>
      <head>
      <title>接口搜索</title>
      <meta charset="utf-8" />
      ${info}
      ${defaultTheme}
      </head>
      <body class="fine-api-doc">
        <div class="header-box">
          <div class="breadcrumb">
            <span><a href="/api/public/plugin/documents">首页</a>/</span><span>关键字：${keyword}</span>
          </div>
        </div>
        <div class="g-doc">
          ${left}
          <div id="right" class="content-right">
          ${hasInter ? tp : getEmpty()}
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
        // 分类信息
        mdTemplate += md.createListMarkdown(list, isToc);
        return mdTemplate;
      } catch (e) {
        yapi.commons.log(e, 'error');
        ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错');
      }
    }

    function getEmpty() {
      return `
        <div class="ant-empty">
          <div class="err-msg">
            <i class="anticon anticon-frown-o icon"></i>
            <p class="title">没有找到相关接口</p>
            <p><a href="/api/public/plugin/documents">返回首页</a></p>
          </div>
        </div>
      `
    }
  }
}

module.exports = interfaceDocController;
