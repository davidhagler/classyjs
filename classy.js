/* Taken from prototype.js - and made more "agnostic" */
(function() {
  Function.prototype.argumentNames = function() {
	  var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
	    .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
	    .replace(/\s+/g, '').split(',');
	  return names.length == 1 && !names[0] ? [] : names;
  }

  Function.prototype.simpleBind = function(context) {
	  if (arguments.length < 2 && (typeof arguments[0] === "undefined"))
		  return this;
		
	  var __method = this;
	  var args = Array.prototype.slice.call(arguments, 1);
	
	  return function() {
		  var a = simpleMerge(args, arguments);
		  return __method.apply(context, a);
	  }
  }

  Function.prototype.wrap = function(wrapper) {
	  var __method = this;
	  return function() {
		  var a = Array.prototype.slice.call(arguments);
		  a.unshift(__method.simpleBind(this));
		  return wrapper.apply(this, a);
	  }
  }
  
  function simpleMerge(/*destination, ... */) {
	  var sources = Array.prototype.slice.call(arguments);
	  var destination = sources.shift();
	  for (var src in sources)
		  for (var property in sources[src])
			  destination[property] = sources[src][property];
			
	  return destination;
  }

  
  function isFunction(arg) {
	  return Object.prototype.toString.call(arg) === '[object Function]';
  }

  function isArray(arg) {
	  return Object.prototype.toString.call(arg) === '[object Array]';
  }

  function _addMethods(source) {
	  var ancestor = this.superclass && this.superclass.prototype;
	
	  for (var property in source) {
		  var value = source[property];
		
		  if (ancestor && isFunction(value) && value.argumentNames()[0] == "$super") {
			  var method = value;
			  value = (function(m) {
				  return function() {
					  return ancestor[m].apply(this, arguments);
				  };
			  })(property).wrap(method);

			  value.valueOf = method.valueOf.simpleBind(method);
			  value.toString = method.toString.simpleBind(method);
		  }
		
		  this.prototype[property] = value;
	  }
	
	  return this;
  }

  var Class = function() {
	  var parent = null;
	  var properties = Array.prototype.slice.call(arguments);

	  // Am I Inheriting from something?
	  if (isFunction(properties[0]))
		  parent = properties.shift();
	    
	  function klass() {
		  if ( !(this instanceof arguments.callee) ) 
			  throw new Error("Constructor called as a function");

		  this.init.apply(this, arguments);
		  if (klass.prototype._ClassName) {
			  this._ClassName = klass.prototype._ClassName;
		  }
	  }

	  simpleMerge(klass, {addMethods: _addMethods});
	  klass.superclass = parent;
	  klass.subclasses = [];

	  if (parent) {
		  var subclass = function() {};
		  subclass.prototype = parent.prototype;
		  klass.prototype = new subclass;
		  parent.subclasses.push(klass);
	  }

	  for (var i = 0, length = properties.length; i < length; i++)
		  klass.addMethods(properties[i]);

	  if (!klass.prototype.init)
	    klass.prototype.init = function(){};

	  klass.prototype.constructor = klass;
	  return klass;
  }

  if (typeof exports !== 'undefined') {
	  exports.Class = Class;
  }
  
  if (typeof window !== 'undefined') {
    window.Class = Class;
  }
})()
