const projectDocController = require('./controllers/project');
const groupDocController = require('./controllers/group');

module.exports = function() {
  this.bindHook('add_router', function(addRouter) {
    // 项目接口文档设置
    addRouter({
      controller: projectDocController,
      method: 'get',
      path: 'fine/document/setting',
      action: 'getSetting'
    });
    addRouter({
      controller: projectDocController,
      method: 'post',
      path: 'fine/document/setting/save',
      action: 'saveSetting'
    });
    // 更新排序
    addRouter({
      controller: projectDocController,
      method: 'post',
      path: 'fine/document/up_index',
      action: 'upIndex'
    });

    // 获取项目接口文档
    addRouter({
      controller: projectDocController,
      method: 'get',
      path: 'doc',
      action: 'getDoc'
    });

    // 获取开放项目接口文档
    addRouter({
      controller: projectDocController,
      prefix: "/public",
      method: 'get',
      path: 'doc',
      action: 'getOpenDoc'
    });

    

    // 获取开放项目接口文档，同documents
    addRouter({
      controller: groupDocController,
      prefix: "/public",
      method: 'get',
      path: 'document',
      action: 'index'
    });
    
    // 获取开放项目接口文档
    addRouter({
      controller: groupDocController,
      prefix: "/public",
      method: 'get',
      path: 'documents',
      action: 'index'
    });
    
    // 获取开放项目接口文档
    addRouter({
      controller: groupDocController,
      method: 'get',
      path: 'documents',
      action: 'index'
    });
    
    // 全局接口文档目录树
    addRouter({
      controller: groupDocController,
      method: 'get',
      path: 'fine/document',
      action: 'get'
    });

    // 目录树排序
    addRouter({
      controller: groupDocController,
      method: 'post',
      path: 'fine/document/group/up_index',
      action: 'upIndex'
    });
  });
};
