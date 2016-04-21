var asap = require("pdenodeify");
var resolve = asap(require("resolve"));
var path = require("path");
var isNpm = require("steal/ext/npm-utils").moduleName.isNpm;

module.exports = nodeLocate;

function nodeLocate(loader){
	addExtension(loader);

	// Add a place to store parent addresses
	loader._parentAddresses = {};

	var normalize = loader.normalize;
	loader.normalize = function(name, parentName, parentAddress){
		var promise = normalize.apply(this, arguments);
		if(!parentAddress) return promise;

		return promise.then(function(name){
			var addresses = loader._parentAddresses[name] =
				loader._parentAddresses[name] || [];
			addresses.push(
				path.dirname(absolutePath(parentAddress))
			);

			return name;
		});
	};

	var locate = loader.locate;
	loader.locate = function(load){
		var name = denpm(load.name);

		var baseLocate = locate.bind(this, load);
		var base = parentBase.call(this, load.name);
		return resolve(name, { basedir: base }).then(null, baseLocate);
	};

	var fetch = loader.fetch;
	loader.fetch = function(load){
		if(isBuiltInModule(load.address)){
			load.metadata.builtIn = true;
			return "";
		}

		return fetch.apply(this, arguments);
	};

	var instantiate = loader.instantiate;
	loader.instantiate = function(load){
		var loader = this;

		if(load.metadata.builtIn) {
			load.metadata.format = "node-builtin";

			load.metadata.execute = function(){
				return require(load.name);
			};
		}

		return instantiate.apply(this, arguments);
	};

	function parentBase(name){
		var addresses = this._parentAddresses[name];
		return (addresses && addresses.length && addresses[0]) ||
			absolutePath(this.baseURL);
	}

}

function isBuiltInModule(pth){
	return !isFileProtocol(pth) &&
		!startsWithSlash(pth) &&
		!startsWithDotSlash(pth);
}

function startsWithDotSlash(pth){
	return pth.substr(0,2) === "./";
}

function startsWithSlash(pth){
	return pth[0] === "/";
}

function isFileProtocol(pth){
	return pth.substr(0, 5) === "file:";
}

function denpm(name){
	if(!isNpm(name)) return name;
	var atIndex = name.indexOf("@");
	var hashIndex = name.indexOf("#");
	var modulePackage = name.substr(0, atIndex);
	var modulePath = name.substr(hashIndex+1);
	var newName = modulePackage + "/" + modulePath;
	return newName;
}

function absolutePath(address){
	return (address || "").replace("file:", "");
}

function addExtension(loader){
	if(!loader._extensions) {
		loader._extensions = [];
	}
	loader._extensions.push(nodeLocate);
}
