sap.ui.define([
	"zprs/finalbill/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("zprs.finalbill.controller.App", {
		onInit: function() {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}
	});
});