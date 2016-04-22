var asap = require("pdenodeify");
var resolve = asap(require("resolve"));
var path = require("path");
var npmUtils = require("steal/ext/npm-utils");
var isNpm = npmUtils.moduleName.isNpm;
var joinURIs = npmUtils.path.joinURIs;

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

		var loader = this;
		return Promise.resolve(locate.apply(loader, arguments))
			.then(function(proposedAddress){
				// If anything abnormal happened there might be a paths config
				if(!isExpectedLocateResult.call(loader, load, proposedAddress)) {
					return proposedAddress;
				}

				var base = parentBase.call(loader, load.name);
				return resolve(name, { basedir: base }).then(null, function(){
					return proposedAddress;
				});
			});
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
			load.metadata.format = "defined";

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

function isExpectedLocateResult(load, address){
	var expectedAddress = joinURIs(this.baseURL, load.name);

	// If locate didn't do the expected thing then we're going
	// to guess that there was some paths config or something and bail out.
	if(address !== expectedAddress + ".js" &&
	  address !== expectedAddress) {
		return false;
	}
	return true;
}

function addExtension(loader){
	if(!loader._extensions) {
		loader._extensions = [];
	}
	loader._extensions.push(nodeLocate);
}
