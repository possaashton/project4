/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["project4/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
