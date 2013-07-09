var fs = require('fs');

function log() {console.log.apply(console, arguments)}

var Modular = function() {}

Modular.option = {
  compress: false,
  file: 'application.js',
  extensions: ['js', 'coffee'],
  root: './'
}

Modular.client = __dirname + '/client.js';
Modular.modules = [];
Modular.cache = '';

Modular.set = function(name, value) {
  if (Modular.set[name]) {
    return Modular.set[name](value);
  }
  Modular.option[name] = value;
  return Modular;
}

Modular.set.file = function(name) {
  log( 'Modular.set.file', name);
  name = name.split('.');
  name.pop();
  name = name.join('.');
  Modular.option.file = name + '.js';
  return Modular;
}

/* bundle modules */
Modular.build = function() {
  Modular.cleanBuild();
  Modular.listModules(Modular.option.root);
  Modular.loadClient(Modular.client);
  Modular.loadModules(Modular.modules);
  Modular.writePackage(Modular.option.file, Modular.cache);
}

/* remove build package before list modules */
Modular.cleanBuild = function() {
  if (fs.existsSync(Modular.option.file)) {
    fs.unlinkSync(Modular.option.file);
  }
}

/* load client library into cache */
Modular.loadClient = function(client) {
  Modular.cache += fs.readFileSync(client, 'utf8');
}

/* load modules into cache */
Modular.loadModules = function(modules) {
  for (var i in modules) {
    var path = modules[i];
    var code = fs.readFileSync(path, 'utf8');
    Modular.cache += Modular.wrapModule(path, code);    
  }
}

/* write everything into the package file */
Modular.writePackage = function(name, content) {
  fs.writeFile(name, content, function(err) {
    if (err) throw err;
    log('create package ' + name);
  })
}

/* wrap the code of a module */
Modular.wrapModule = function(path, code) {
  // make relative into absolute path
  path = path.replace(/^\./, '');
  // pop extension
  path = path.split('.');
  path.pop();
  path = path.join('.');
  var wrap = "\n";
  wrap += "define('" + path + "'";
  wrap += ', function(exports, require, module) {' + "\n" + code + '});';
  wrap += "\n";
  return wrap;
}

/* list out modules from a directory */
Modular.listModules = function(directory) {
  directory = directory.replace(/\/$/, '');
  var files = fs.readdirSync(directory);
  var modules = Modular.selectModules(files);
  modules.forEach(function(module) {
    Modular.modules.push(directory + '/' + module);
  })
  Modular.detectDirectory(directory, files);
}

/* recursively read directories */
Modular.detectDirectory = function(directory, files) {
  files.forEach(function(file) {
    var path = directory + '/' + file;
    var stat = fs.statSync(path);
    if (stat.isDirectory()) Modular.listModules(path);
  })
}

/* pick out modules from files */
Modular.selectModules = function(files) {
  var modules = [];
  for (var i in files) {
    var file = files[i];
    var ext = file.split('.').pop();
    if (~Modular.option.extensions.indexOf(ext)) modules.push(file);
  }
  return modules;
}

module.exports = Modular