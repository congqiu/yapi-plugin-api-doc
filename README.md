# yapi-plugin-api-doc 

根据内置导出数据插件，在分组的某个项目导航栏中加入*接口文档*标签，点击可以直接查看接口文档。

## 安装

第一步：在config.json这层目录下运行 `yapi plugin --name yapi-plugin-api-doc` 安装插件  

第二步： 重启服务器

注：如果是第一次安装插件会安装依赖，由于node-sass安装极易失败可能导致插件安装失败，可以手动进入vendors手动安装`npm i node-sass --sass_binary_site=https://npm.taobao.org/mirrors/node-sass/`后再执行上述步骤重新安装插件。

### 更新

通过yapi-cli更新插件还是比较麻烦的，直接再执行一次命令并不会更新。因为yapi-cli安装插件实际上就是在vendors目录下执行`npm install --registry https://registry.npm.taobao.org yapi-plugin-api-doc`，所以最后会在package.json文件中记录下开始安装的版本号，再次执行安装的还是同一个版本。

执行如下操作可以进行更新：
1. 进入`vendors`目录中，需要先清除ykit的缓存，删除`node_modules/.ykit_cache`文件夹
2. 修改package.json里面`yapi-plugin-api-doc`的版本或者直接`npm i yapi-plugin-api-doc@version`
3. 执行命令`NODE_ENV=production ykit pack -m`
4. 在config.json这层目录下执行命令`yapi plugin --name yapi-plugin-api-doc`后再重启服务器就完成安装指定版本的插件

## 特性

### 项目接口文档

点击项目导航栏的*接口文档*，可以设置查看当前分组所有接口的文档。页面顶部有一个开关，用来设置当前分组的开放接口文档是否公开可见，打开开关之后可以看到公开访问地址。

每个接口编辑页面都可以设置当前接口是否为开放接口，如果是开放接口可以通过这边的设置来觉得是否开放为无需登录即可访问的接口。

### 全局接口文档

对于一个工程中有很多分组，一个分组又会有很多项目，这些分组和项目之间对外提供文档是需要一定顺序的。
点击右上角的头像会出现下拉选项，点击*接口文档*即可进入全局文档的设置界面。
当前支持在目录树上进行拖拽排序操作，轻松搞定文档的顺序。通过右侧给出的文档地址可以轻松访问。

### 公开访问

目前的YAPI不支持用户不登录进行访问操作，需要支持public接口的版本才能免登录公开访问

