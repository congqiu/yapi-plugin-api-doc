const baseController = require('controllers/base.js');
const projectModel = require('models/project.js');
const groupModel = require('models/group.js');
const settingModel = require('../models/document');
const docGroupModel = require('../models/group');
const yapi = require('yapi.js');
const homeTheme = require('../theme/home/home.js');

class homeController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.projectModel = yapi.getInst(projectModel);
    this.groupModel = yapi.getInst(groupModel);
    this.settingModel = yapi.getInst(settingModel);
    this.docGroupModel = yapi.getInst(docGroupModel);
  }

  async index(ctx) {
		// 来自 client/constants/variable.js
		const PROJECT_COLOR = {
			blue: '#2395f1',
			green: '#00a854',
			yellow: '#ffbf00',
			red: '#f56a00',
			pink: '#f5317f',
			cyan: '#00a2ae',
			gray: '#bfbfbf',
			purple: '#7265e6'
		};
		try {
			let datas = await this.getAllProjects();
			
			let htmlBody = "";
			for (let i = 0; i < datas.length; i++) {
				const data = datas[i];
				htmlBody += `
					<div class="section card-panel card-panel-s">
						<div class="group">
							<h2>${data.group_name}</h2>
							<div style="display: ${data.group_desc ? "" : "none"}">(${data.group_desc})</div>
						</div>
						<div class="ant-row">`;
				for (let j = 0; j < data.projects.length; j++) {
					const project = data.projects[j];
					htmlBody += `<div class="ant-col-xs-6 ant-col-lg-5 ant-col-xxl-3">
						<a class="card-container" href="/api/public/plugin/doc?pid=${project._id}">
							<div class="ant-card m-card">
								<div class="ant-card-body">
									<i class="anticon anticon-${project.icon} ui-logo" style="background-color: ${PROJECT_COLOR[project.color] || PROJECT_COLOR.blue};"></i>
									<h4 class="ui-title">${project.name}</h4>
								</div>
							</div>
						</a>
					</div>`;
				}
				htmlBody += `</div></div>`;
			}
			let html = `<!DOCTYPE html>
				<html>
				<head>
					<title>在线文档</title>
					<meta charset="utf-8" />
					<script src="/prd/assets.js?v=${Math.random()}"></script>
					<script>
						document.write('<link rel="stylesheet"  href="/prd/' + window.WEBPACK_ASSETS['index.js'].css + '" />');
					</script>
					${homeTheme}
				</head>
				<body class="fine-api-doc">
					${htmlBody}
				</body>
				</html>
			`;
			ctx.set('Content-Type', 'text/html');
			ctx.body = html;
		} catch (error) {
      ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错，请联系管理员');
		}
	}

	async get(ctx) {
		try {
			ctx.body = yapi.commons.resReturn(await this.getAllProjects());
		} catch (error) {
			ctx.body = yapi.commons.resReturn(null, 502, '获取项目出错');
		}
	}

	async getAllProjects() {
		try {
			let groups = await this.groupModel.list();
			let docGroups = await this.docGroupModel.listAll() || [];
			let groupIndexs = {};
			for (let i = 0; i < docGroups.length; i++) {
				let docGroup = docGroups[i];
				groupIndexs[docGroup.group_id] = docGroup;
			}
			let datas = [];
			for (let j = 0; j < groups.length; j++) {
				const group = groups[j];
				let docGroup = groupIndexs[group._id] || {};
				if (docGroup.is_public === false) {
					continue;
				}
				
				let data = {
					_id: group._id,
					group_name: group.group_name,
					group_desc: group.group_desc,
					index: docGroup.index || 0,
					projects: []
				};
				let projects = await this.projectModel.list(group._id);
				for (let i = 0; i < projects.length; i++) {
					const project = projects[i];
					let docSetting = await this.settingModel.findByProject(project._id);
					if(docSetting && docSetting.is_public) {
						data.projects.push({
							_id: project._id,
							name: project.name,
							desc: project.desc,
							icon: project.icon,
							color: project.color,
							index: docSetting.index
						});
					}
				}
				if (data.projects.length > 0) {
					data.projects.sort((a, b) => a.index - b.index);
					datas.push(data)
				}
			}
			datas.sort((a, b) => a.index - b.index);
			return datas;
		} catch (error) {
			yapi.commons.log(error.message);
      return [];
		}
	}
}

module.exports = homeController;
