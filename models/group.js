const yapi = require('yapi.js');
const baseModel = require('models/base.js');

class groupDocModel extends baseModel {
  getName() {
    return 'fine_api_document_group';
  }

  getSchema() {
    return {
      uid: Number,
      // 分组id
      group_id: {
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
        default: true
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
      .sort({ index: -1 })
      .exec();
  }

  find(id) {
    return this.model.findOne({ _id: id });
  }

  findByGroup(id) {
    return this.model
      .findOne({
        group_id: id
      });
  }

  /**
   * 找到就更新，没找到就新增
   * @param {*} group_id 
   * @param {*} data 
   */
  findOneAndUpdate(group_id, data) {
    data.up_time = yapi.commons.time();
    return this.model.findOneAndUpdate(
      {
        group_id: group_id
      },
      data,
      {
        upsert: true
      }
    );
  }
}

module.exports = groupDocModel;