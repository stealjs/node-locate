var steal = require("steal");
var nodeLocate = require("../locate");
var assert = require("assert");

describe("node-locate", function(){

	describe("without a config", function(){
		beforeEach(function(){
			this.steal = steal.clone();
			this.steal.System.config({
				configMain: "@empty",
				main: "main",
				baseURL: __dirname + "/basics"
			});
			nodeLocate(this.steal.System);
		});

		it("can find node modules", function(done){
			this.steal.import(this.steal.System.main).then(function(val){
				assert.equal(val.name, "basics", "Got the basics module");
				assert.equal(val.one.name, "one", "Got the dependency");
				assert.equal(val.one.two.name, "two", "Got the dependency's dependency");
			}).then(done, done);
		});
	});

	describe("with npm", function(){
		beforeEach(function(done){
			this.steal = steal.clone();
			this.steal.System.config({
				config: __dirname + "/basics/package.json!npm"
			});
			nodeLocate(this.steal.System);

			this.steal.startup().then(function(results){
				this.mod = results[0];
				done();
			}.bind(this));
		});

		it("basics work", function(){
			var mod = this.mod;
			assert.equal(mod.name, "basics", "Got the basics module");
			assert.equal(mod.one.name, "one", "Got the dependency");
			assert.equal(mod.one.two.name, "two",
						 "Got the dependency's dependency");
		});

		it("can load a node builtin", function(){
			var fs = this.mod.one.two.fs;
			assert.equal(typeof fs.readFile, "function", "got the fs module");
		});

		it("doesn't override paths config", function(){
			var three = this.mod.three;
			assert.equal(three, "fake", "got the one set by paths");
		});
	});

});
