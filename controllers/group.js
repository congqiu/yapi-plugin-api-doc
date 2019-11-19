const baseController = require('controllers/base.js');
const settingModel = require('../models/group');
const yapi = require('yapi.js');

class docGroupController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.settingModel = yapi.getInst(settingModel);
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

module.exports = docGroupController;
