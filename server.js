const controller = require('./controllers/doc');
const settingController = require('./controllers/setting');
const docController = require('./controllers/home');

module.exports = function() {
  this.bindHook('add_router', function(addRouter) {
    addRouter({
      controller: settingController,
      method: 'get',
      path: 'fine/document/setting',
      action: 'getSetting'
    });
    addRouter({
      controller: settingController,
      method: 'post',
      path: 'fine/document/setting/save',
      action: 'saveSetting'
    });
    addRouter({
      // 获取doc信息
      controller: controller,
      method: 'get',
      path: 'doc',
      action: 'getDoc'
    });
    addRouter({
      // 获取doc信息
      controller: controller,
      prefix: "/public",
      method: 'get',
      path: 'doc',
      action: 'getOpenDoc'
    });
    addRouter({
      // 获取doc信息
      controller: controller,
      prefix: "/public",
      method: 'get',
      path: 'document',
      action: 'getDocument'
    });
    addRouter({
      // 获取home
      controller: docController,
      prefix: "/public",
      method: 'get',
      path: 'documents',
      action: 'index'
    });
  });
};
