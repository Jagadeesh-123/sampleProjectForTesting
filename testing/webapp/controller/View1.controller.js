sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function(Controller, JSONModel) {
	"use strict";

	return Controller.extend("testingtesting.controller.View1", {
		onInit: function() {
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.loadData("localService/mockdata/Customers.json");
			sap.ui.getCore().setModel(oModel);
			var oView = this.getView();
			oView.setModel(oModel);
		}
	});
});