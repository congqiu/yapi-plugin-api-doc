const baseController = require('controllers/base.js');
const settingModel = require('../models/document');
const yapi = require('yapi.js');

class settingController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.settingModel = yapi.getInst(settingModel);
  }

  /**
   * 获取
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
   * 保存/更新
   * @param {*} ctx 
   */
  async saveSetting(ctx) {
    let params = ctx.request.body;

    try {
      let data = {
        project_id: params.project_id,
        is_public: params.is_public,
        uid: this.getUid()
      }
      let res = await this.settingModel.findOneAndUpdate(params.project_id, data);
      ctx.body = yapi.commons.resReturn(res);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }

  async upIndex(ctx) {
    try {
      let params = ctx.request.body;
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

module.exports = settingController;