const express = require('express');
const chalk = require('chalk');
const path = require('path');
const app = express();

app.use(browser_sync_middleware('./bs-config.js'));
app.use("/", express.static(path.join(__dirname, '/')));

if (require.main === module) {
    app.listen(3030, function() {
        console.log(chalk.green("OK"), "express", 3030);
    });
}

function browser_sync_middleware(config_file) {
    const browser_sync = require('browser-sync');
    const connect_browser_sync = require('connect-browser-sync');
    
    const config = require(config_file);    
    var synchronize = browser_sync(config);
    var middleware = connect_browser_sync(synchronize);
    return middleware;
}
