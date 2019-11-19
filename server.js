const controller = require('./controllers/doc');
const settingController = require('./controllers/setting');
const docController = require('./controllers/home');
const docGroupController = require('./controllers/group');

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
      controller: settingController,
      method: 'post',
      path: 'fine/document/up_index',
      action: 'upIndex'
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
    addRouter({
      // 获取home
      controller: docController,
      method: 'get',
      path: 'documents',
      action: 'index'
    });
    addRouter({
      controller: docController,
      method: 'get',
      path: 'fine/document',
      action: 'get'
    });

    addRouter({
      controller: docGroupController,
      method: 'post',
      path: 'fine/document/group/up_index',
      action: 'upIndex'
    });
  });
};
