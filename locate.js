var asap = require("pdenodeify");
var resolve = asap(require("resolve"));
var path = require("path");
var npmUtils = require("system-npm/npm-utils");

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
		console.log("NPM?", load.name, npmUtils.moduleName.isNpm(load.name))

		var baseLocate = locate.bind(this, load);
		var base = parentBase.call(this, load.name);
		return resolve(load.name, { basedir: base }).then(null, baseLocate);
	};

	function parentBase(name){
		var addresses = this._parentAddresses[name];
		return (addresses && addresses.length && addresses[0]) ||
			absolutePath(this.baseURL);
	}

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
