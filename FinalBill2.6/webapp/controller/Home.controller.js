sap.ui.define([
	"zprs/finalbill/controller/BaseController",
	"zprs/finalbill/Services/MatterServices",
	"sap/m/Token",
	"sap/ui/model/Sorter",
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/Label',
	'sap/m/Text',
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, MatterServices, Token, Sorter, Button, Dialog, Label, Text, JSONModel, MessageToast, Filter) {
	"use strict";

	return BaseController.extend("zprs.finalbill.controller.Home", {

		onInit: function() {
			var oView = this.getView();
			var that = this;
			this.MatterModel = new JSONModel({
				"title": "FinalBill",
				"settings": {
					"selectedTable": "HeaderEditTable",
					"selectedTab": "tab1",
					"header": true,
					"headerline": true,
					"tableHeadResults": 0,
					"tableLineResults": 0,
					"headerRowSelected": false,
					"fromdate": "",
					"todate": "",
					"isCodeUpdate": false,
					"isTabControlPanel": true
				},
				"MatterDetails": {},
				"selectedRow": {},
				"Lineitems": {},
				"tempMatterDetails": {},
				"tempLineitems": {},
				"filterIndices": [],
				"constants": {},
				"formatterData": {},
				"TotalLable": {},
				"billSumarryRow": [],
				"saveMsg": {
					"title": "",
					"text": "",
					"ok": "Ok",
					"confirm": false
				}
			});
			
			this.aItems = [{
				Sort1: "Hello",
				Land1: "World",
				Pstlz: "500072",
				Mcod3: "Hyd",
				Mcod1: "Seshu",
				Kunnr: "Baker"
			}];
			
			sap.ui.core.BusyIndicator.show(0);
			/*Set Matter Model To current view*/
			oView.setModel(this.MatterModel, "MatterModel");
			this.TabBarCustomFunctionality();
			var columnModel = new JSONModel();
			columnModel.loadData((jQuery.sap.getModulePath("zprs.finalbill", "/Config/Columns.json")));
			sap.ui.getCore().setModel(columnModel, "columnModel");

			var inputsModel = new JSONModel();
			inputsModel.loadData((jQuery.sap.getModulePath("zprs.finalbill", "/Config/Selection.json")));
			sap.ui.getCore().setModel(inputsModel, "inputsModel");

			var selModel = new JSONModel();
			selModel.loadData((jQuery.sap.getModulePath("zprs.finalbill", "/Config/Constants.json")));
			selModel.attachRequestSent(function() {});
			selModel.attachRequestCompleted(function() {
				// sap.ui.getCore().setModel(selModel, selModel.getData());
				that.MatterModel.setProperty("/constants", selModel.getData());
				that.setupInitialData();
			});
		},
		onBeforeRendering: function() {
			this.openMasterDialog();
		},
		onAfterRendering: function() {
			var oToDatePicker = sap.ui.getCore().byId("toDateInput");

			oToDatePicker.setDateValue(new Date());
			oToDatePicker.setDisplayFormat("dd.MM.yyyy");
		},

		openMasterDialog: function() {
			var oView = this.getView();
			var oDialog = this._getMasterFilterDialog();
			oView.addDependent(oDialog);
			oDialog.open();
		},
		_getMasterFilterDialog: function() {
			// create dialog lazily
			if (!this._oDialog) {
				// create dialog via fragment factory myCompany.myApp
				this._oDialog = sap.ui.xmlfragment("zprs.finalbill.view.MasterFilter", this.getView().getController());
			}
			return this._oDialog;
		},
		closeMaterFilterDialog: function() {
			this._getMasterFilterDialog().close();
		},
		onSubmit: function(oControlEvent) {
			var inputField = oControlEvent.getSource();
			var tokens = inputField.getTokens();
			var isDuplicateTokenFound = false;
			var oButton = sap.ui.getCore().byId("okBtn");

			if (tokens.length !== 0 && inputField.getValue() !== "") {
				$.each(tokens, function(i, token) {
					if (token.data().range.value1 === inputField.getValue()) {
						isDuplicateTokenFound = true;
					}
				});
			}

			if (inputField.getValue() !== "" && !isDuplicateTokenFound) {
				var oToken = new Token({
					key: oControlEvent.getSource().data("key"),
					text: inputField.getValue()
				}).data("range", {
					"exclude": false,
					"operation": "EQ",
					"keyField": inputField.data("key"),
					"value1": inputField.getValue(),
					"value2": ""
				});
				oToken.attachDelete(this.onTokenDelete);
				inputField.addToken(oToken);
			}
			oButton.setEnabled(true);
			inputField.setValue("");
		},

		onTokenDelete: function() {
			var oInputs = [];
			var oButton = sap.ui.getCore().byId("okBtn");
			var availableTokensCount = 0;

			oInputs = sap.ui.getCore().getModel("inputsModel").oData[0].inputs.valueHelpInputs;

			$.each(oInputs, function(i, input) {
				var selInput = sap.ui.getCore().byId(input);
				var tokens = selInput.getTokens();
				if (tokens.length > 0) {
					availableTokensCount++;
				}

				if (oInputs.length === i) {
					availableTokensCount = 0;
				}
			});
			if (availableTokensCount - 1 === 0) {
				oButton.setEnabled(false);
			}
		},

		buildTokens: function() {
			var filters = [];
			var oInputs = [];
			oInputs = sap.ui.getCore().getModel("inputsModel").oData[0].inputs.valueHelpInputs;

			jQuery.each(oInputs, function(i, inputs) {
				var input = sap.ui.getCore().byId(inputs);
				var tokens = input.getTokens();

				$.each(tokens, function(k, token) {
					var val0 = "";
					var val1 = "";
					var operation = "";
					if (token.data().range === undefined) {
						val0 = token.getText();
						val1 = "";
						operation = sap.ui.model.FilterOperator.EQ;
					} else {
						if (token.data().range.exclude === true) {
							operation = sap.ui.model.FilterOperator.NE;
						} else {

							switch (token.data().range.operation.toString()) {
								case 'BT':
									operation = sap.ui.model.FilterOperator.BT;
									break;
								case 'Contains':
									operation = sap.ui.model.FilterOperator.Contains;
									break;
								case 'EndsWith':
									operation = sap.ui.model.FilterOperator.EndsWith;
									break;
								case 'EQ':
									operation = sap.ui.model.FilterOperator.EQ;
									break;
								case 'GE':
									operation = sap.ui.model.FilterOperator.GE;
									break;
								case 'GT':
									operation = sap.ui.model.FilterOperator.GT;
									break;
								case 'LE':
									operation = sap.ui.model.FilterOperator.LE;
									break;
								case 'LT':
									operation = sap.ui.model.FilterOperator.LT;
									break;
								case 'NE':
									operation = sap.ui.model.FilterOperator.NE;
									break;
								case 'StartsWith':
									operation = sap.ui.model.FilterOperator.StartsWith;
									break;
								default:
									operation = sap.ui.model.FilterOperator.EQ;
							}

						}

						//	operation = "sap.ui.model.filterOperator." + token.data().range.operation.toString();
						val0 = token.data().range.value1.toString();
						val1 = token.data().range.value2.toString();
					}
					filters.push(
						new sap.ui.model.Filter({
							path: input.data("key"),
							operator: operation,
							value1: val0,
							value2: val1 //OR token.getKey(), depending on whjat do you store in key/value
						}));
				});
			});

			return filters;
		},

		onConfirmDialog: function() {
			var filters = this.buildTokens();
			var service = this.MatterModel.getProperty("/constants");
			var that = this;
			$.when(MatterServices.getInstance().getMattersListsService(service, filters))
				.done(function(matterlist) {
					if (matterlist.results.length) {

						_.forOwn(matterlist.results, function(item) {
							item.Fkdat = sap.ui.core.format.DateFormat.getDateInstance({
								source: {
									pattern: "timestamp"
								},
								pattern: "dd.MM.yyyy"
							}).format(item.Fkdat);
							item.Erdat = sap.ui.core.format.DateFormat.getDateInstance({
								source: {
									pattern: "timestamp"
								},
								pattern: "dd.MM.yyyy"
							}).format(item.Erdat);

						});
						that.MatterModel.setProperty("/MatterDetails", matterlist);
						that.MatterModel.setProperty("/tempMatterDetails", matterlist);

					}
					sap.ui.core.BusyIndicator.hide(0);

				});

			this.closeMaterFilterDialog();

		},

		openValueHelpDailog: function(oControlEvent) {
			var that = this;
			var input = oControlEvent.getSource();

			var oValueHelpDialog1 = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				basicSearchText: input.getValue(),
				title: input.getName(),
				supportRanges: true,
				supportRangesOnly: true,
				key: input.getId(),
				descriptionKey: input.getName(),
				stretch: sap.ui.Device.system.phone,

				ok: function(oControlEvent) {
					that.aTokens = oControlEvent.getParameter("tokens");
					input.setTokens(that.aTokens);

					oValueHelpDialog1.close();
				},

				cancel: function(oControlEvent) {
					oValueHelpDialog1.close();
				},

				afterClose: function() {
					oValueHelpDialog1.destroy();
				}
			});

			oValueHelpDialog1.setRangeKeyFields([{
				label: oControlEvent.getSource().getName(),
				key: oControlEvent.getSource().getId()
			}]);
			//	oValueHelpDialog1.setTokens(this.theTokenInput.getTokens());

			if (input.$().closest(".sapUiSizeCompact").length > 0) { // check if the Token field runs in Compact mode
				oValueHelpDialog1.addStyleClass("sapUiSizeCompact");
			} else {
				oValueHelpDialog1.addStyleClass("sapUiSizeCozy");
			}

			oValueHelpDialog1.open();
		},

		handleValueHelpRequest: function(oControlEvent) {
			var that = this;
			var input = oControlEvent.getSource();

			var oValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				title: oControlEvent.getSource().data("desc"),
				basicSearchText: input.getValue(),
				supportMultiselect: true,
				supportRanges: false,
				supportRangesOnly: false,
				key: oControlEvent.getSource().data("key"),				
				descriptionKey: oControlEvent.getSource().data("descKey"),
				stretch: sap.ui.Device.system.phone,

				ok: function(oControlEvent) {
					that.aTokens = oControlEvent.getParameter("tokens");
					input.setTokens(that.aTokens);
					oValueHelpDialog.close();
				},

				cancel: function(oControlEvent) {
					oValueHelpDialog.close();
				},

				afterClose: function() {
					oValueHelpDialog.destroy();
				}
			});

			oValueHelpDialog.setTokens(input.getTokens());

			var getFilterGroupItems = [];
			var getColumnDefs = [];

			switch (oControlEvent.getSource().data("desc")) {
				case 'Client':
					getColumnDefs = [{
						label: "Search Term",
						template: "Sort1"
					}, {
						label: "Country",
						template: "Land1"
					}, {
						label: "Postal Code",
						template: "Pstlz"
					}, {
						label: "City",
						template: "Mcod3"
					}, {
						label: "Client Name",
						template: "Mcod1"
					}, {
						label: "Client",
						template: "Kunnr"
					}];
					getFilterGroupItems = [new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n1",
							label: "Search Term",
							control: new sap.m.MultiInput("Sort1", {
								name: "Search Term",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n2",
							label: "Country",
							control: new sap.m.MultiInput("Land1", {
								name: "Country",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n3",
							label: "Postal Code",
							control: new sap.m.MultiInput("Pstlz", {
								name: "Postal Code",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n4",
							label: "City",
							control: new sap.m.MultiInput("Mcod3", {
								name: "City",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n5",
							label: "Client name",
							control: new sap.m.MultiInput("Mcod1", {
								name: "Client name",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n6",
							label: "Client",
							control: new sap.m.MultiInput("Kunnr", {
								name: "Client",
								valueHelpRequest: this.openValueHelpDailog
							})
						})
					];
					break;
				case 'Billing Office':
					getColumnDefs = [{
						label: "Billing Office",
						template: "Werks"
					}, {
						label: "Description",
						template: "Name1"
					}];
					getFilterGroupItems = [new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n1",
							label: "Billing Office",
							control: new sap.m.MultiInput("Werks", {
								name: "Billing Office",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n2",
							label: "Description",
							control: new sap.m.MultiInput("Name1", {
								name: "Description",
								valueHelpRequest: this.openValueHelpDailog
							})
						})
					];
					break;
				case 'Partner Number':
					getColumnDefs = [{
						label: "Partner Number",
						template: "Pernr"
					}, {
						label: "First Name",
						template: "Vorna"
					}, {
						label: "Last Name",
						template: "Nachn"
					}];
					getFilterGroupItems = [new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n1",
							label: "Partner Number",
							control: new sap.m.MultiInput("Pernr", {
								name: "Partner Number",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n2",
							label: "Last Name",
							control: new sap.m.MultiInput("Nachn", {
								name: "Last Name",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n3",
							label: "First Name",
							control: new sap.m.MultiInput("Vorna", {
								name: "First Name",
								valueHelpRequest: this.openValueHelpDailog
							})
						})
					];
					break;
				case 'Matter':
					getColumnDefs = [{
						label: "Matter Number",
						template: "Pspid"
					}, {
						label: "Description",
						template: "Post1"
					}];
					getFilterGroupItems = [new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n1",
							label: "Matter Number",
							control: new sap.m.MultiInput("Pspid", {
								name: "Matter Number",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n2",
							label: "Description",
							control: new sap.m.MultiInput("Post1", {
								name: "Description",
								valueHelpRequest: this.openValueHelpDailog
							})
						})
					];
					break;
				case 'Matter Reporting Group':
					getColumnDefs = [{
						label: "Matter Reporting Group",
						template: "Rptgroup"
					}, {
						label: "Description",
						template: "Post1"
					}];
					getFilterGroupItems = [new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n1",
							label: "Matter Reporting Group",
							control: new sap.m.MultiInput("Rptgroup", {
								name: "Matter Reporting Group",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n2",
							label: "Description",
							control: new sap.m.MultiInput("Post1", {
								name: "Description",
								valueHelpRequest: this.openValueHelpDailog
							})
						})
					];
					break;
				case 'Group Bill ID':
					getColumnDefs = [{
						label: "Group Bill ID",
						template: "Zzgrpbill"
					}, {
						label: "Description",
						template: "Post1"
					}];
					getFilterGroupItems = [new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n1",
							label: "Group Bill ID",
							control: new sap.m.MultiInput("Zzgrpbill", {
								name: "Group Bill ID",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n2",
							label: "Description",
							control: new sap.m.MultiInput("Post1", {
								name: "Description",
								valueHelpRequest: this.openValueHelpDailog
							})
						})
					];
					break;
				case 'Sales Org':
					getColumnDefs = [{
						label: "Sales Org",
						template: "Bukrs"
					}, {
						label: "Description",
						template: "Butxt"
					}];
					getFilterGroupItems = [new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n1",
							label: "Sales Org",
							control: new sap.m.MultiInput("Bukrs", {
								name: "Sales Org",
								valueHelpRequest: this.openValueHelpDailog
							})
						}),
						new sap.ui.comp.filterbar.FilterGroupItem({
							groupTitle: "foo",
							groupName: "gn1",
							name: "n2",
							label: "Description",
							control: new sap.m.MultiInput("Butxt", {
								name: "Description",
								valueHelpRequest: this.openValueHelpDailog
							})
						})
					];
					break;
			}

			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols: getColumnDefs
			});
			oValueHelpDialog.getTable().setModel(oColModel, "columns");

			var oRowsModel = new sap.ui.model.json.JSONModel();
			oRowsModel.setData(this.aItems);
			oValueHelpDialog.getTable().setModel(oRowsModel);
			if (oValueHelpDialog.getTable().bindRows) {
				oValueHelpDialog.getTable().bindRows("/");
			}
			if (oValueHelpDialog.getTable().bindItems) {
				var oTable = oValueHelpDialog.getTable();

				oTable.bindAggregation("items", "/", function(sId, oContext) {
					var aCols = oTable.getModel("columns").getData().cols;
					
					return new sap.m.ColumnListItem({
						cells: aCols.map(function(column) {
							var colname = column.template;
							return new sap.m.Label({
								text: "{" + colname + "}"
							});
						})
					});
				});
			}

			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				showGoOnFB: !sap.ui.Device.system.phone,
				filterBarExpanded: false,
				filterGroupItems: getFilterGroupItems,
				search: function() {
					//sap.m.MessageToast.show("Search pressed '"+arguments[0].mParameters.selectionSet[0].getValue()+"''");
				}
			});

			if (oFilterBar.setBasicSearch) {
				oFilterBar.setBasicSearch(new sap.m.SearchField({
					showSearchButton: sap.ui.Device.system.phone,
					placeholder: "Search",
					search: function(event) {
						oValueHelpDialog.getFilterBar().search();
					}
				}));
			}
			
			oValueHelpDialog.setFilterBar(oFilterBar);

			oValueHelpDialog.setRangeKeyFields([{
				label: oControlEvent.getSource().data("desc"),
				key: oControlEvent.getSource().data("key")
			}]);

			oValueHelpDialog.addStyleClass("sapUiSizeCozy");
			if (input.$().closest(".sapUiSizeCompact").length > 0) { // check if the Token field runs in Compact mode
				oValueHelpDialog.addStyleClass("sapUiSizeCompact");
			} else {
				oValueHelpDialog.addStyleClass("sapUiSizeCozy");			
			}

			oValueHelpDialog.open();
			oValueHelpDialog.update();
		},

		setupInitialData: function() {
			var service = this.MatterModel.getProperty("/constants");
			var filter = [new sap.ui.model.Filter({
				path: 'Finalbill',
				operator: sap.ui.model.FilterOperator.EQ,
				value1: '9020016524'
			}), new sap.ui.model.Filter({
				path: 'Finalbill',
				operator: sap.ui.model.FilterOperator.EQ,
				value1: '9000020532'
			}), new sap.ui.model.Filter({
				path: 'Finalbill',
				operator: sap.ui.model.FilterOperator.EQ,
				value1: '9000020533'
			}), new sap.ui.model.Filter({
				path: 'Finalbill',
				operator: sap.ui.model.FilterOperator.EQ,
				value1: '9000020534'
			}), new sap.ui.model.Filter({
				path: 'Finalbill',
				operator: sap.ui.model.FilterOperator.EQ,
				value1: '9000020535'
			}), new sap.ui.model.Filter({
				path: 'Finalbill',
				operator: sap.ui.model.FilterOperator.EQ,
				value1: '9000020537'
			})];
			var that = this;
			$.when(MatterServices.getInstance().getUserSettingsDataService(service), MatterServices.getInstance().getMattersListsService(
					service, filter))
				.done(function(userData, matterlist) {
					that.MatterModel.setProperty("/formatterData", userData);
					if (matterlist.results.length) {

						_.forOwn(matterlist.results, function(item) {
							item.Fkdat = sap.ui.core.format.DateFormat.getDateInstance({
								source: {
									pattern: "timestamp"
								},
								pattern: "dd.MM.yyyy"
							}).format(item.Fkdat);
							item.Erdat = sap.ui.core.format.DateFormat.getDateInstance({
								source: {
									pattern: "timestamp"
								},
								pattern: "dd.MM.yyyy"
							}).format(item.Erdat);

						});
						that.MatterModel.setProperty("/MatterDetails", matterlist);
					}
					sap.ui.core.BusyIndicator.hide(0);

				});
		},
		TabBarCustomFunctionality: function() {
			//	var oView = this.getView();

			zprs.finalbill.control.IconTabHeader.prototype.validateTab = $.proxy(function(nextTabKey) {
				console.log(nextTabKey);
				console.log(this.getView().byId("idIconTabBar").getSelectedKey());
				this.SelecctedData(nextTabKey);

				//	if(){
				return true;
				//	}

			}, this);

		},
		SelecctedData: function(tab) {
			var service = this.MatterModel.getProperty("/constants");
			var that = this;
			var oView = this.getView();
			if (tab === "tab1") {
				var filter = [new sap.ui.model.Filter({
					path: 'Finalbill',
					operator: sap.ui.model.FilterOperator.EQ,
					value1: '9020016524'
				}), new sap.ui.model.Filter({
					path: 'Finalbill',
					operator: sap.ui.model.FilterOperator.EQ,
					value1: '9000020532'
				}), new sap.ui.model.Filter({
					path: 'Finalbill',
					operator: sap.ui.model.FilterOperator.EQ,
					value1: '9000020533'
				}), new sap.ui.model.Filter({
					path: 'Finalbill',
					operator: sap.ui.model.FilterOperator.EQ,
					value1: '9000020534'
				}), new sap.ui.model.Filter({
					path: 'Finalbill',
					operator: sap.ui.model.FilterOperator.EQ,
					value1: '9000020535'
				}), new sap.ui.model.Filter({
					path: 'Finalbill',
					operator: sap.ui.model.FilterOperator.EQ,
					value1: '9000020537'
				})];

				sap.ui.core.BusyIndicator.show(0);
				$.when(MatterServices.getInstance().getMattersListsService(service, filter))
					.done(function(matterlist) {

						if (matterlist.results.length) {

							_.forOwn(matterlist.results, function(item) {
								item.Fkdat = sap.ui.core.format.DateFormat.getDateInstance({
									source: {
										pattern: "timestamp"
									},
									pattern: "dd.MM.yyyy"
								}).format(item.Fkdat);
								item.Erdat = sap.ui.core.format.DateFormat.getDateInstance({
									source: {
										pattern: "timestamp"
									},
									pattern: "dd.MM.yyyy"
								}).format(item.Erdat);

							});
							that.MatterModel.setProperty("/MatterDetails", matterlist);
							that.MatterModel.setProperty("/tempMatterDetails", matterlist);

						}
						sap.ui.core.BusyIndicator.hide(0);

					});
				this.MatterModel.setProperty("/settings/header", true);
				this.MatterModel.setProperty("/settings/headerline", true);
				this.MatterModel.setProperty("/settings/selectedTable", "HeaderEditTable");

			}
			if (tab === "tab2") {
				var billno = this.MatterModel.getProperty("/selectedRow").Draftbill;

				sap.ui.core.BusyIndicator.show(0);
				$.when(MatterServices.getInstance().getDraftBillService(service, billno))
					.done(function(Lineitems) {

						if (Lineitems.results.length) {

							_.forOwn(Lineitems.results, function(item) {
								item.Budat = sap.ui.core.format.DateFormat.getDateInstance({
									source: {
										pattern: "timestamp"
									},
									pattern: "dd.MM.yyyy"
								}).format(item.Budat);

							});
							that.MatterModel.setProperty("/Lineitems", Lineitems);
							that.MatterModel.setProperty("/tempLineitems", Lineitems);

						}
						sap.ui.core.BusyIndicator.hide(0);

					});
				this.MatterModel.setProperty("/settings/header", false);
				this.MatterModel.setProperty("/settings/headerline", true);
				this.MatterModel.setProperty("/settings/selectedTable", "lineTable");

			}
			if (tab === "tab3") {
				sap.ui.core.BusyIndicator.show(0);
				this.onBillSumaryService('PriceInfoByMatnrSet', 'matterSummaryList');
				this.onBillSumaryService('BillGroupInfoSet', 'matterEditSummaryList');
				this.MatterModel.setProperty("/settings/header", false);
				this.MatterModel.setProperty("/settings/headerline", false);
				this.MatterModel.setProperty("/settings/selectedTable", "HeaderEditTable_billSummary");

			}
			oView.byId(this.MatterModel.getProperty("/settings/selectedTable")).clearSelection();
		},
		onBillSumaryService: function(serviceMode, modelNames) {
			var modelName = "/" + modelNames;

			var service = this.MatterModel.getProperty("/constants");
			var that = this;
			var filter = this.MatterModel.getProperty("/selectedRow").Draftbill;

			$.when(MatterServices.getInstance().getBillSummaryService(service, filter, serviceMode))
				.done(function(billSummarySet) {

					if (billSummarySet.results.length) {

						_.forOwn(billSummarySet.results, function(item) {
							item.Budat = sap.ui.core.format.DateFormat.getDateInstance({
								source: {
									pattern: "timestamp"
								},
								pattern: "dd.MM.yyyy"
							}).format(item.Budat);

						});
						that.MatterModel.setProperty(modelName, billSummarySet);
					}

					if (modelNames === 'matterSummaryList') {
						var selectedRowData = that.MatterModel.getProperty("/selectedRow");

						var billSumaryArr = that.MatterModel.getProperty("/billSumarryRow");
						billSumaryArr[0] = selectedRowData;

						var netTotal = that.MatterModel.getProperty("/matterSummaryList");

						//	listMater.results[0].billsummarytotalduesum = 100;
						//	listMater.names = 'Trust Amount';
						var k = netTotal.results[0].NetTotal;
						//	var billsummarytotalsum = that.MatterModel['matterSummaryList'][0].NetTotal;
						var trustAmt = parseFloat(selectedRowData.Zztrustamt);
						var fundAmt = parseFloat(selectedRowData.Zzfundsamt);
						var creditAmt = parseFloat(selectedRowData.Zzcreditamt);

						//	this.MatterModel.MatterDetails.billsummarytotalduesum = parseFloat(billsummarytotalsum) - (trustAmt) + (fundAmt) + (creditAmt);
						this.total = parseFloat(k) - (trustAmt) + (fundAmt) + (creditAmt);
						//	this.total = 9000;

						var tempObj = [{
							'key': 'Trust Amount',
							'val': parseFloat(selectedRowData.Zztrustamt)
						}, {
							'key': 'Unallocated Funds',
							'val': parseFloat(selectedRowData.Zzfundsamt)
						}, {
							'key': 'Credited Amount',
							'val': parseFloat(selectedRowData.Zzcreditamt)
						}, {
							'key': 'Credited Tax Amount',
							'val': parseFloat(selectedRowData.ZzcreditTax)
						}, {
							'key': 'Total Duet',
							'val': parseFloat(this.total)
						}];

						that.MatterModel.setProperty('/billSumarryRow', billSumaryArr);
						that.MatterModel.setProperty('/totalLable', this.total);
						that.MatterModel.setProperty('/billSummaryTotalTable', tempObj);

						//	that.MatterModel.MatterDetails.billsummarytotalduesum = "adsf";

					}
					sap.ui.core.BusyIndicator.hide(0);

				});

		},
		filterMethod: function(filterString) {
			var filterColumns = [];
			var header = true;
			if (this.MatterModel.getProperty("/settings/selectedTable") === "HeaderEditTable") {
				filterColumns = ["Finalbill", "Draftbill", "Zzfiscalinv", "Fkart", "Client", "ClientName", "Kunrg", "Pspid", "Post1", "Vkorg",
					"Werks",
					"Rptgroup", "Mgbill", "Fkdat", "Erdat", "Ernam", "Waerk", "NetFees", "NetCost", "Tax", "DiscAmount", "NetAmount"
				];
			} else {
				filterColumns = ["Abgru", "Zzreview", "Vbeln", "Posnr", "Zzprtoninv", "Zztranstyp", "Taxm1", "Phase", "Belnr", "Buzei", "Zzwerks",
					"Werks", "Budat", "Pernr", "Timekeeper", "Ptext", "Awtyp", "Lstar", "LstarDesc", "Meinh", "Waers", "BaseRate", "ActualRate",
					"BaseValue",
					"ActualValue", "BaseQty", "ActualQty", "ZwriteoffAmt", "ZwriteoffQty", "Kzwi6", "Kzwi5", "Kzwi4", "NetBillValue", "Tax", "Werks"
				];
				header = false;
			}
			var Filters = [];

			jQuery.each(filterColumns, function(i, column) {
				Filters.push(new sap.ui.model.Filter(column, sap.ui.model.FilterOperator.Contains, filterString));
			});

			var oList = this.getView().byId(this.MatterModel.getProperty("/settings/selectedTable"));
			var oBinding = oList.getBinding("rows");
			oBinding.filter(new sap.ui.model.Filter(
					Filters), sap.ui.model
				.FilterType.Application);
			oBinding.refresh(true);

			// 	if (filterString.length > 0) {
			// 		this.MatterModel.setProperty("/filterIndices/", oBinding.aIndices);
			// 		var indices = [];
			// 		var that = this;
			// 		if(header){
			// 	 jQuery.each(oBinding.aIndices, function(i, indi) {
			// indices.push(that.MatterModel.getProperty("/MatterDetails/results/" + oBinding.aIndices[i]));
			// 		});
			// 		this.MatterModel.setProperty("/MatterDetails/results/", indices);
			// 		}
			// 		else{
			//            jQuery.each(oBinding.aIndices, function(i, indi) {
			// 		indices.push(that.MatterModel.getProperty("/Lineitems/results/" + oBinding.aIndices[i]));
			// 		});
			// 		this.MatterModel.setProperty("/Lineitems/results/", indices);
			//   		}
			// 	} else {
			// 		if(header){
			// 		this.MatterModel.setProperty("/MatterDetails/results/", this.MatterModel.getProperty("/tempMatterDetails/results/"));	
			// 		}
			// 		else{
			// 		this.MatterModel.setProperty("/Lineitems/results/", this.MatterModel.getProperty("/tempLineitems/results/"));	
			// 		}
			// 	}
			//	this.MatterModel.setProperty("/settings/tableHeadResults", this.MatterModel.getProperty("/MatterDetails/results/").length);
			//	this.MatterModel.setProperty("/settings/tableLineResults", this.MatterModel.getProperty("/Lineitems/results/").length);
		},
		filterGlobally: function(oEvent) {
			var filterValue = oEvent.getSource().getValue();
			this.filterMethod(filterValue);
		},
		HeaderUpdate: function(oEvent) {
			var currentTableId = this.MatterModel.getProperty("/settings/selectedTable");
			var myTable = this.getView().byId(currentTableId);
			var selectedIndeices = myTable.getSelectedIndices();
			if (selectedIndeices.length === 1) {
				this.MatterModel.setProperty("/settings/headerRowSelected", true);
				var thisRow = oEvent.getParameters();
				var selectedRow = this.MatterModel.getProperty(thisRow.rowContext.sPath);
				this.MatterModel.setProperty("/settings/headerRowSelected", true);
				this.MatterModel.setProperty("/selectedRow", selectedRow);
			} else {
				this.MatterModel.setProperty("/settings/headerRowSelected", false);
			}

		},
		datenum: function(v, date1904) {
			if (date1904) {
				v += 1462;
			}
			var epoch = Date.parse(v);
			return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
		},

		sheet_from_array_of_arrays: function(data) {
			var ws = {};
			var range = {
				s: {
					c: 10000000,
					r: 10000000
				},
				e: {
					c: 0,
					r: 0
				}
			};
			for (var R = 0; R !== data.length; ++R) {
				for (var C = 0; C !== data[R].length; ++C) {
					if (range.s.r > R) {
						range.s.r = R;
					}
					if (range.s.c > C) {
						range.s.c = C;
					}
					if (range.e.r < R) {
						range.e.r = R;
					}
					if (range.e.c < C) {
						range.e.c = C;
					}
					var cell = {
						v: data[R][C]
					};
					if (cell.v == null) {
						continue;
					}
					var cell_ref = XLSX.utils.encode_cell({
						c: C,
						r: R
					});

					if (typeof cell.v === 'number') {
						cell.t = 'n';
					} else if (typeof cell.v === 'boolean') {
						cell.t = 'b';
					} else if (cell.v instanceof Date) {
						cell.t = 'n';
						cell.z = XLSX.SSF._table[14];
						cell.v = this.datenum(cell.v);
					} else {
						cell.t = 's';
					}

					ws[cell_ref] = cell;
				}
			}
			if (range.s.c < 10000000) {
				ws['!ref'] = XLSX.utils.encode_range(range);
			}
			return ws;
		},
		s2ab: function(s) {
			var buf = new ArrayBuffer(s.length);
			var view = new Uint8Array(buf);
			for (var i = 0; i !== s.length; ++i) {
				view[i] = s.charCodeAt(i) & 0xFF;
			}
			return buf;
		},

		downloadfile: function() {
			var columns = [];
			var mainData = [];

			var selected = this.MatterModel.getProperty("/settings/selectedTab");
			if (selected === "tab1") {
				columns = sap.ui.getCore().getModel("columnModel").oData.exportHeaderEdits;
				mainData = this.MatterModel.getProperty("/MatterDetails/results");
			} else {
				columns = sap.ui.getCore().getModel("columnModel").oData.exportLine;
				mainData = this.MatterModel.getProperty("/Lineitems/results");
			}

			this.JSONToXLSX(columns, mainData, this.MatterModel.getProperty("/formatterData/Bname") + new Date().toDateString()); //username_currentdate
		},

		JSONToXLSX: function(columnsData, JSONData, ReportTitle) {
			var aData = typeof JSONData !== "object" ? JSON.parse(JSONData) : JSONData;
			if (aData.length) {
				var FinalData,
					HeaderData,
					HeaderText;

				// Array variable to store header data in XLSX file
				HeaderData = [];
				HeaderText = [];
				FinalData = [];

				_.each(columnsData, function(item) {
					HeaderData.push(item.field);
					HeaderText.push(item.text);
				});

				// Adding column header data in final XLSX data
				FinalData.push(HeaderText);

				_.each(JSONData, function(item) {
					var dataarrays = [];
					_.each(HeaderData, function(itemcols) {
						var value = item[itemcols];
						value = returnblank(value);

						function returnblank(item) {
							if (item == null) {
								return '';
							} else {
								return item;
							}
						}
						dataarrays.push(item[itemcols]);
					});
					FinalData.push(dataarrays);
				});

				// Adding content data in final XLSX data
				var Workbook = function Workbook() {
					if (!(this instanceof Workbook)) {
						return new Workbook();
					}
					this.SheetNames = [];
					this.Sheets = {};
				};
				var wb = Workbook();
				wb.SheetNames.push(ReportTitle);
				var ws = this.sheet_from_array_of_arrays(FinalData);
				// Setting up Excel column width
				ws['!cols'] = [{
					wch: 14
				}, {
					wch: 12
				}];
				wb.Sheets[ReportTitle] = ws;
				var wbout = XLSX.write(wb, {
					bookType: 'xlsx',
					bookSST: true,
					type: 'binary'
				});

				saveAs(new Blob([this.s2ab(wbout)], {
					type: "application/octet-stream"
				}), ReportTitle + ".xlsx");

			} else {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageToast.show("No data..!", {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				});

			}
		}

	});
});