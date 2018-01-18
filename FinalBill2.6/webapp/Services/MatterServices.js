sap.ui.define([
	"sap/ui/base/Object"
], function(Object) {
	"use strict";
	var instance;
	var services = Object.extend("zprs.finalbill.Services.MatterServices", {
		constructor: function() {

		},
		getUserSettingsDataService: function(service) {
			var deferred = $.Deferred();
			/*Initiate Service Request*/
			var userServiceUrl = service.serviceUrl + service.wsParms.ZPRS_VALUE_HELP_SRV;
			var oModelUserName = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: userServiceUrl
			}, true);
			var initialUserDataset = service.services.InitialuserDataset;
			var userDataServiceUrl = service.serviceUrl + service.wsParms.ZPRS_USER_DATA_SRV;
			var rowdata = "";

			//Call Service
			oModelUserName.read(initialUserDataset, {
				success: function(oData) {
					rowdata = oData;
					if (rowdata.Uname) {
						var oModelUserData = new sap.ui.model.odata.v2.ODataModel({
							serviceUrl: userDataServiceUrl
						}, true);

						var userDataDataSet = service.services.UpdateduserDataset + rowdata.Uname + "')";
						//odata read for user data
						oModelUserData.read(userDataDataSet, {
							success: function(oData1) {
								deferred.resolve(oData1);
							},
							error: function() {
								deferred.reject();
							}
						});
					} else {
						deferred.reject();
					}
				},
				error: function() {
					deferred.reject();
				}
			});
			return deferred.promise();
		},

		getMattersListsService: function(service, filter) {
			var deferred = $.Deferred();
			var HeaderServiceUrl = service.serviceUrl_FBill;
			var oModelUserName = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: HeaderServiceUrl
			}, true);

			var headerdataset = service.services.FbatchBillSummarySet;

			oModelUserName.read(headerdataset, {
				filters: filter,
				success: function(oData) {
					deferred.resolve(oData);

				}.bind(this),
				error: function() {
					deferred.reject();

				}
			});
			return deferred.promise();
		},
		getDraftBillService: function(service, billno) {

			var deferred = $.Deferred();
			var editServiceUrl = service.serviceUrl + service.wsParms.ZPRS_BILL_EDIT_SRV;
			var oModelUserName = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: editServiceUrl
			}, true);
		//	var billno = 70030121;
			var queryfilter = '(' + "'" + billno + "')";
			var editdataset = service.services.BillSummarySet + queryfilter + service.services.OrderItemSet;

			oModelUserName.read(editdataset, {
				success: function(oData) {
					deferred.resolve(oData);

				}.bind(this),
				error: function() {
					deferred.reject();

				}
			});
			return deferred.promise();
		},
		getBillSummaryService: function(service, billno, serviceMode) {
			var deferred = $.Deferred();
			var editServiceUrl = service.serviceUrl + service.wsParms.ZPRS_BILL_EDIT_SRV;
			var oModelUserName = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: editServiceUrl
			}, true);
		//	var billno = 70031632;
			var queryfilter = '(' + "'" + billno + "')";
			var editdataset;
			if (serviceMode === 'PriceInfoByMatnrSet') {
				editdataset = service.services.BillSummarySet + queryfilter + service.qParms.PriceByMatnr;
			} else if (serviceMode === 'BillGroupInfoSet') {
				editdataset = service.services.BillSummarySet + queryfilter + service.qParms.HeaderToGroupInfo;
			}

			oModelUserName.read(editdataset, {
				success: function(oData) {
					deferred.resolve(oData);

				}.bind(this),
				error: function() {
					deferred.reject();

				}
			});
			return deferred.promise();
		}

	});
	return {
		getInstance: function() {
			if (!instance) {
				instance = new services();
			}
			return instance;
		}
	};
});