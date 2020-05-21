const shell = require ('shelljs');
const packageJson = require ('./package.json');

const version = "v" + packageJson.version;

if(!version){
  console.error('version 不能为空')
  process.exit(1)
}
shell.exec ('git pull origin master');
shell.exec ('git tag ' + version);
shell.exec ('git push origin ' + version);

console.log('git push success', version)

console.log('正在执行npm发布')
shell.exec('npm publish')
