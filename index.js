var fs = require('fs');


function serializeOption(value) {
  if (typeof value === 'function') {
    return value.toString();
  }
  return JSON.stringify(value);
}


var PhantomJSBrowser = function(baseBrowserDecorator, config, args, logger) {
  var log  = logger.create('phantomjsLauncher');
  baseBrowserDecorator(this);

  this.DEFAULT_CMD = config.cmd;

  var options = args && args.options || config && config.options || {};
  var flags = args && args.flags || config && config.flags || [];

  this._start = function(url) {
    // create the js file that will open karma
    var captureFile = this._tempDir + '/capture.js';
    var optionsCode = Object.keys(options).map(function (key) {
      if (key !== 'settings') { // settings cannot be overriden, it should be extended!
        return 'page.' + key + ' = ' + serializeOption(options[key]) + ';';
      }
    });

    if (options.settings) {
      optionsCode = optionsCode.concat(Object.keys(options.settings).map(function (key) {
        return 'page.settings.' + key + ' = ' + serializeOption(options.settings[key]) + ';';
      }));
    }

    var captureCode = 'var page = require("webpage").create();\n' +
        'page.onConsoleMessage = function() { console.log.apply(console, arguments); };' +
        optionsCode.join('\n') + '\npage.open("' + url + '");\n';
    fs.writeFileSync(captureFile, captureCode);

    // and start phantomjs
    this._execCommand(this._getCommand(), flags.concat(captureFile));

    this._process.stderr.on('data', function (data) {
      log.error('' + data);
    });

    this._process.stdout.on('data', function (data) {
      log.debug('' + data);
    });
  };
};

PhantomJSBrowser.prototype = {
  name: 'PhantomJS',

  ENV_CMD: 'PHANTOMJS_BIN'
};

PhantomJSBrowser.$inject = ['baseBrowserDecorator', 'config.phantomjsLauncher', 'args', 'logger'];


// PUBLISH DI MODULE
module.exports = {
  'launcher:PhantomJS': ['type', PhantomJSBrowser]
};
