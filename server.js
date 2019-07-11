const controller = require('./controller');

module.exports = function() {
  this.bindHook('add_router', function(addRouter) {
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
  });
};
