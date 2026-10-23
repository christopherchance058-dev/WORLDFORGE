const { defineConfig } = require('@playwright/test');
const fs = require('node:fs');
module.exports = defineConfig({
 testDir:'./tests', workers:1, use:{baseURL:'http://127.0.0.1:3000',headless:true,launchOptions:fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{}},

});
