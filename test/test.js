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
		beforeEach(function(){
			this.steal = steal.clone();
			this.steal.System.config({
				config: __dirname + "/basics/package.json!npm"
			});
			nodeLocate(this.steal.System);
		});

		it.only("basics work", function(done){
			this.steal.import(this.steal.System.main).then(function(val){
				assert.equal(val.name, "basics", "Got the basics module");
				assert.equal(val.one.name, "one", "Got the dependency");
				assert.equal(val.one.two.name, "two", "Got the dependency's dependency");
			}).then(done, done);
		});
	});

});
