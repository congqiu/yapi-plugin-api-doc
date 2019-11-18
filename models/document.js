const yapi = require('yapi.js');
const baseModel = require('models/base.js');

class documentModel extends baseModel {
  getName() {
    return 'fine_api_document';
  }

  getSchema() {
    return {
      uid: Number,
      // 项目id
      project_id: {
        type: Number,
        required: true
      },

      // 排序
      index: {
        type: Number,
        required: false,
        default: 0
      },

      //是否公开访问
      is_public: {
        type: Boolean,
        default: false
      },

      up_time: Number
    };
  }

  save(data) {
    data.up_time = yapi.commons.time();
    let doc = new this.model(data);
    return doc.save();
  }

  listAll() {
    return this.model
      .find()
      .sort({ _id: -1 })
      .exec();
  }

  find(id) {
    return this.model.findOne({ _id: id });
  }

  findByProject(id) {
    return this.model
      .findOne({
        project_id: id
      });
  }

  update(id, data) {
    data.up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      data
    );
  }

  /**
   * 找到就更新，没找到就新增
   * @param {*} project_id 
   * @param {*} data 
   */
  findOneAndUpdate(project_id, data) {
    data.up_time = yapi.commons.time();
    return this.model.findOneAndUpdate(
      {
        project_id: project_id
      },
      data,
      {
        upsert: true
      }
    );
  }

  del(id) {
    return this.model.remove({
      _id: id
    });
  }
}

module.exports = documentModel;