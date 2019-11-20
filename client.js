import FineDocPage from './page/Doc';
import FineDocSettingPage from './page/Setting';

module.exports = function() {
  this.bindHook('sub_nav', function(app) {
    app.fineDocPage = {
      name: '接口文档',
      path: '/project/:id/doc',
      component: FineDocPage
    };
  });

  this.bindHook('header_menu', function (menu) {
    menu.fineDocSettingPage = {
      path: '/document/api',
      name: '接口文档',
      icon: 'file-text',
      adminFlag: true
    }
  })
  this.bindHook('app_route', function (app) {
    app.fineDocSettingPage = {
      path: '/document/api',
      component: FineDocSettingPage
    }
  })
};
