const baseController = require('controllers/base.js');
const projectModel = require('models/project.js');
const groupModel = require('models/group.js');
const settingModel = require('../models/project');
const groupDocModel = require('../models/group');
const yapi = require('yapi.js');
const homeTheme = require('../theme/home/home.js');

class homeController extends baseController {
	constructor(ctx) {
		super(ctx);
		this.projectModel = yapi.getInst(projectModel);
		this.groupModel = yapi.getInst(groupModel);
		this.settingModel = yapi.getInst(settingModel);
		this.groupDocModel = yapi.getInst(groupDocModel);
	}

	/**
	 * 获取html文档
	 * @param {*} ctx 
	 */
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
					<title>在线接口文档</title>
					<meta charset="utf-8" />
					<script src="/prd/assets.js?v=${Math.random()}"></script>
					<script>
						document.write('<link rel="stylesheet"  href="/prd/' + window.WEBPACK_ASSETS['index.js'].css + '" />');
					</script>
					${homeTheme}
				</head>
				<body class="fine-api-doc">
					<div class="header-box m-header ant-layout-header">
						<div class="content g-row">
							<div class="breadcrumb-container">
								<span class="ant-breadcrumb">在线接口文档</span>
							</div>
							<div class="user-toolbar">
								<div class="toolbar-li item-search">
									<form id="search-form" class="ant-form ant-form-horizontal" method="post" action="/api/public/plugin/fine/document/search">
										<span class="ant-input-search ant-input-affix-wrapper" style="width: 200px;">
											<input name="keyword" id="fine-api-search-input" placeholder="输入接口名称搜索" class="ant-input" type="text" value="" required>
											<span class="ant-input-suffix">
												<span role="img" id="fine-api-search-icon" aria-label="search" class="anticon anticon-search srch-icon">
												</span>
											</span>
										</span>
									</form>
								</div>
							</div>
						</div>
					</div>
					${htmlBody || "<h3 style='text-align:center; margin: 50px 0;'>你走错地方啦，这里什么都没有</h3>"}
					<script>
						document.getElementById("fine-api-search-icon").addEventListener('click', function(){
							if (document.getElementById("fine-api-search-input").value.trim() === "") {
								return false;
							}
							document.getElementById("search-form").submit();
						});
						document.getElementById("search-form").addEventListener('submit', function(event){
							if (document.getElementById("fine-api-search-input").value.trim() === "") {
								event.preventDefault();
								return false;
							}
						});
					</script>
				</body>
				</html>
			`;
			ctx.set('Content-Type', 'text/html');
			ctx.body = html;
		} catch (error) {
			ctx.body = yapi.commons.resReturn(null, 502, '获取文档出错，请联系管理员');
		}
	}

	/**
	 * 排序
	 * @param {*} ctx 
	 */
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
				this.groupDocModel.findOneAndUpdate(item.id, {index: item.index}).then(
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

	/**
	 * 获取目录树
	 * @param {*} ctx 
	 */
	async get(ctx) {
		try {
			if (this.getRole() != 'admin') {
				return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限'));
			}
			ctx.body = yapi.commons.resReturn(await this.getAllProjects());
		} catch (error) {
			ctx.body = yapi.commons.resReturn(null, 502, '获取项目出错');
		}
	}

	async getAllProjects() {
		try {
			let groups = await this.groupModel.list();
			let docGroups = await this.groupDocModel.listAll() || [];
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
					datas.push(data);
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
