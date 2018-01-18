sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/Label',
	'sap/m/Text',
	"zprs/finalbill/assets/xlsx",
	"zprs/finalbill/assets/jszip",
	"zprs/finalbill/assets/xlsxcore",
	"zprs/finalbill/assets/FileSaver",
	"zprs/finalbill/assets/Blob",
	"zprs/finalbill/assets/lodash",
	"zprs/finalbill/assets/datajs"
], function(Controller, Button, Dialog, Label, Text) {
	"use strict";

	return Controller.extend("zprs.finalbill.controller.BaseController", {
		/*Get Components from router*/
		getRouter: function() {
			return this.getOwnerComponent().getRouter();
		},
		/*Get and set Models*/
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		/*Get Resource bundle(i18n) data */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();

		},
		showAlert: function(title, message) {
			var dialog = new Dialog({
				title: title,
				type: 'Message',
				content: new Text({
					text: message
				}),
				beginButton: new Button({
					text: 'OK',
					press: function() {
						dialog.close();

					}
				}),

				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		},

		/*Get Navigation bar navigation History */
		onNavBack: function() {
			// var sPreviousHash = History.getInstance().getPreviousHash();

			// if (sPreviousHash !== undefined) {
			// 	history.go(-1);
			// } else {
			// 	this.getRouter().navTo("master", {}, true);
			// }
		}

	});

});