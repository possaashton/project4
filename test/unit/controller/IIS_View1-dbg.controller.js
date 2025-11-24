/*global QUnit*/

sap.ui.define([
	"project2/controller/IIS_View1.controller"
], function (Controller) {
	"use strict";

	QUnit.module("IIS_View1 Controller");

	QUnit.test("I should test the IIS_View1 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
