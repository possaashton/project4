/*global QUnit*/

sap.ui.define([
	"project4/controller/myFirstView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("myFirstView Controller");

	QUnit.test("I should test the myFirstView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
