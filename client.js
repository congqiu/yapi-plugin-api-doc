import DocPage from './page';

module.exports = function() {
  this.bindHook('sub_nav', function(app) {
    app.doc = {
      name: '接口文档',
      path: '/project/:id/doc',
      component: DocPage
    };
  });
};
