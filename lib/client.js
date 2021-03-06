(function(exports) {

  _isEmpty = function(obj) {
    if (typeof obj === 'function') return false;
    if (obj == null || obj === undefined) return true;
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) return false;
    }
    return true;
  }

  _getFolder = function(path) {
    var split = path.split('/');
    split.pop();
    return split.join('/') + '/';
  }

  function Modular() {}

  Modular.extensions = ['js', 'coffee'];
  Modular.modules = {}

  Modular.define = function(path, module) {
    Modular.modules[path] = module;
  }

  Modular.initRequire = function(folder) {
    return function(path) {
      var absolute = /^\//;
      var current = /^\.\//;
      var parent = /^\.\.\//;
      path.replace(current, '');
      if (absolute.test(path)) {
        path = path;
      } else if (current.test(path)) {
        path = folder + path.replace(current, '');
      } else if (parent.test(path)) {
        path = Modular.lookUp(folder, path);
      } else {
        path = folder + path;
      }
      return Modular.require(path);
    }
  }

  Modular.lookUp = function(folder, path) {
    if (folder === '') throw 'break through root';
    var parent = /^\.\.\//;
    folder = folder.split('/');
    folder.pop();
    folder.pop();
    folder.push('');
    folder = folder.join('/');
    path = path.replace(parent, '');
    if (parent.test(path)) Modular.lookUp(folder, path);
    return folder + path;
  }

  Modular.require = function(path) {
    path = Modular.parsePath(path);
    var folder = _getFolder(path);
    var code = Modular.loadModule(path);
    var module = {};
    var exports = module.exports = {};
    var require = Modular.initRequire(folder);
    code.call({}, exports, require, module);
    if (_isEmpty(module.exports)) {
      module.exports = undefined;
    }
    return module.exports;
  }

  Modular.parsePath = function(path) {
    path = path.split('.');
    var ext = path.pop();
    if (Modular.extensions.indexOf(ext) === -1) path.push(ext);
    return path.join('.');
  }

  Modular.loadModule = function(path) {
    var module = Modular.modules[path];
    if ( module === undefined) {
      throw 'cannot find module ' + path;
    }
    return module;
  }

  exports.define = Modular.define;
  exports.require = Modular.initRequire('/');

})(this);
