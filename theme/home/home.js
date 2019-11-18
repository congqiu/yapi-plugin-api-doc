const fs = require('fs');
const sysPath = require('path');
const css = fs.readFileSync(sysPath.join(__dirname, './home.css'));
module.exports = '<style>' + css + '</style>';