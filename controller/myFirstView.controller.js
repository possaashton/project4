sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/m/MessageToast" 
], (Controller) => {
    "use strict";

    return Controller.extend("project4.controller.myFirstView", {

        onInit() {
			/**For testing**/
			this.byId("ipUserCode").setValue('ashton');
			this.byId("ipUserName").setValue('possa');
			var codebox = this.byId("mcbDBSelector");
				codebox.setSelectedKeys("SBODemoGB");
			var codebox1 = this.byId("mcbAuthorization");
				codebox1.setSelectedKeys(["Finance User","Accounts Payable"]);	
				
			
			sap.m.MessageToast.show('Welcome to SAP UI5');
        },
		
        _onUpdateUser: async function () {
			
			const bValid = this._frmValidation();
			if (!bValid) return;		
			
			try {
				const sUserName = "manager";
				const sPassword = "B1Admin";
				const aSelectedDBs = this.byId("mcbDBSelector").getSelectedKeys();
						
				for (const dbName of aSelectedDBs) {
					const loginPayload = {
						CompanyDB: dbName,
						UserName: sUserName,
						Password: sPassword
					};
		
					// 1. Login & get session for this DB
					const sessionId = await this._login(loginPayload);
					if (!sessionId) continue;
		
					// 2. Validate user exists in this DB
					const userData = await this._getUser(sessionId, dbName);
					if (!userData) continue;
		
					// 3. Get user Groups from this DB
					let aSAPUserGroups = await this._getUserGroups(dbName);
					
					// 4. Update user in this DB
					await this._updateUser(sessionId, userData, dbName, aSAPUserGroups);
					
					if(this.byId("chkBoyumLicense").getSelected()) {
						await this._assignBoyumLicense(sessionId, userData, dbName);
					}
					
					sap.m.MessageToast.show(`User updated in ${dbName}`);
										
					
					// Logout from the current DB session
					await this._logout();
					
				}
			} catch (err) {
				console.error(err);
				sap.m.MessageToast.show("Error: " + err.message);
			}		
			
		},
		
		_assignBoyumLicense: async function(ipSessionId	, ipUserData, ipDbName){
			
			try{
				const userCode = this.byId("ipUserCode").getValue();
				let aUrlData = this._getUrlData();
				const oComponent  = aUrlData[0],
					  oDataSource = aUrlData[1],
					  sBaseUrl    = aUrlData[2];
					  
				const res = await fetch(`${sBaseUrl}/U_BOY_SBO_LICASSN`, {
					method: "PATCH",
					credentials: "include",
					headers:{"Content-Type" : "application/json"},
					body: JSON.stingigy({Code: "FromUI5"  , U_BOY_ID: "BOY_USABILITY", U_BOY_USR: userCode})
				});
				
			}
			catch(err){
				
			}
			
		},
		
		_getUserGroups: async function(dbName){
			
			let aUrlData = this._getUrlData();
				const oComponent  = aUrlData[0],
					  oDataSource = aUrlData[1],
					  sBaseUrl    = aUrlData[2];
					  
			const res = await fetch(`${sBaseUrl}/UserGroups`, {
				method: "GET",
				credentials: "include",
				headers: {"Content-Type": "application/json"}
			});
			
			if (!res.ok){
				sap.m.MessageToast.show(`UserGroup Lookup failed in ${dbName}`);
				return null;
			}
			
			const oData = await res.json();
			if(!oData.value || oData.value.length === 0){
				sap.m.MessageToast.show(`Authorization Groups not found in &{dbName}`);
				return null;
			}
			
			return  oData.value;
			
		},

        _frmValidation: function () {
			
            if (this.byId("ipUserCode").getValue() === '' ||
                this.byId("ipUserName").getValue() === '') {
                MessageToast.show("UserCode/UserName cannot be blank");
                return false;
            }

            if (this.byId("mcbDBSelector").getSelectedKeys().length === 0) {
                sap.m.MessageToast.show("Please select at least one Database");
                return false;
            }

            return true;
        },
		
		_getUrlData: function(){
			
			// 1️ Get the base URL from manifest.json
			 const oComponent  = this.getOwnerComponent();
			 const oDataSource = oComponent.getMetadata().getManifestEntry("sap.app").dataSources.mainService;
			 const sBaseUrl    = oDataSource.uri.replace(/\/$/, ""); //remove trailing slash 
			 return[oComponent, oDataSource, sBaseUrl];
			 
		},

        _login: async function (payload) {
			
			try {
				

				let aUrlData = this._getUrlData();				
				const oComponent  = aUrlData[0],
					  oDataSource = aUrlData[1],
					  sBaseUrl    = aUrlData[2]; 
			
				// 2️ Call the Service Layer login
				const res = await fetch(`${sBaseUrl}/Login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
					credentials: "include"
				});
			
				// 3️ Parse JSON
				const data = await res.json().catch(() => null);
			
				// 4️ Check for errors
				if (!res.ok || !data || data.error) {
					if (sap.m && sap.m.MessageToast) {
						sap.m.MessageToast.show(`Login failed for ${payload.CompanyDB}`);
					} else {
						console.warn(`Login failed for ${payload.CompanyDB}`);
					}
					return null;
				}
			
				// 5️ Return session ID
				return data.SessionId;
			
			} catch (err) {
				console.error("Login error:", err);
				if (sap.m && sap.m.MessageToast) {
					sap.m.MessageToast.show(`Login error for ${payload.CompanyDB}: ${err.message}`);
				}
				return null;
			}
	
        },
		
		_logout: async function (){
			
			try{
				let aUrlData = this._getUrlData();				
				const oComponent  = aUrlData[0],
					  oDataSource = aUrlData[1],
					  sBaseUrl    = aUrlData[2];
					  
				const res = await fetch(`${sBaseUrl}/Logout`);
			}
			catch(err){
				console.error("Login error:", err);
				if (sap.m && sap.m.MessageToast) {
					sap.m.MessageToast.show(`Logout error for ${err.message}`);
				}
				return null;
			}
		},

		_getUser: async function (sessionId, dbName) {
			
			const userCode = this.byId("ipUserCode").getValue();
			
			let aUrlData = this._getUrlData();				
				const oComponent  = aUrlData[0],
					  oDataSource = aUrlData[1],
					  sBaseUrl    = aUrlData[2];
			
			const res = await fetch(`${sBaseUrl}/Users?$filter=UserCode eq '${userCode}'`, {
				method: "GET",
				credentials: "include", // allows cookies
				headers: { "Content-Type": "application/json" }
			});
			
			if (!res.ok) {
				sap.m.MessageToast.show(`User lookup failed in ${dbName}`);
				return null;
			}
			
			const data = await res.json();
			if (!data.value || data.value.length === 0) {
				sap.m.MessageToast.show(`User '${userCode}' not found in ${dbName}`);
				return null;
			}
			
			return { ...data.value[0], DbName: dbName }; // return DB name along with user
			
		},
		
		_updateUser: async function (sessionId, userData, dbName, aSAPUserGroups) {
			
			const internalKey = userData.InternalKey;
			const newUserName = this.byId("ipUserName").getValue();
			
			let aUrlData = this._getUrlData();				
			const oComponent  = aUrlData[0],
				  oDataSource = aUrlData[1],
				  sBaseUrl    = aUrlData[2];
			
			/** This was a working code
			const res = await fetch(`${sBaseUrl}/Users(${internalKey})`, {
				method: "PATCH",
				credentials: "include", // allows cookies
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ UserName: newUserName })
			});
			**/	
			
			const aMcbAuthorization = this.byId("mcbAuthorization").getSelectedKeys();
			 
			const userGroupArray = [
				{ USERId: internalKey, GroupId: 1 },
				{ USERId: internalKey, GroupId: 2 }
			];
			const aAssignedUsergroupArray = [];
			
			for(const aToAssignUserGroup of aMcbAuthorization){
				for(const key of aSAPUserGroups){
					
					
					if(aToAssignUserGroup === 'Finance User'){
						var sUserGroupName = key.UserGroupName;
						if(sUserGroupName.search(/finance/i) >= 0)
						{
							aAssignedUsergroupArray.push({
								USERId: internalKey,
								GroupId: key.UserGroupId 
							});
						}
					}
					else if(aToAssignUserGroup === 'Accounts Payable'){
						var sUserGroupName = key.UserGroupName;
						if(sUserGroupName.search(/payable/i) >= 0)
						{
							aAssignedUsergroupArray.push({
								USERId: internalKey,
								GroupId: key.UserGroupId 
							});
						}
					}
					else if(aToAssignUserGroup === 'Financial Reporting with Period Access'){
						var sUserGroupName = key.UserGroupName;
						if(sUserGroupName.search(/finanacial report/i) >= 0)
						{
							aAssignedUsergroupArray.push({
								USERId: internalKey,
								GroupId: key.UserGroupId 
							});
						}
					}
					else if(aToAssignUserGroup === 'Commercial User'){
						var sUserGroupName = key.UserGroupName;
						if(sUserGroupName.search(/commercial/i) >= 0)
						{
							aAssignedUsergroupArray.push({
								USERId: internalKey,
								GroupId: key.UserGroupId 
							});
						}
					}
					else if(aToAssignUserGroup === 'Procurement User'){
						var sUserGroupName = key.UserGroupName;
						if(sUserGroupName.search(/procurement/i) >= 0)
						{
							aAssignedUsergroupArray.push({
								USERId: internalKey,
								GroupId: key.UserGroupId 
							});
						}
					}
					else if(aToAssignUserGroup === 'Asset Management User'){
						var sUserGroupName = key.UserGroupName;
						if(sUserGroupName.search(/asset/i) >= 0)
						{
							aAssignedUsergroupArray.push({
								USERId: internalKey,
								GroupId: key.UserGroupId 
							});
						}
					}
				}				
			}		
			
			const res = await fetch(`${sBaseUrl}/Users(${internalKey})`, {
				method: "PATCH",
				credentials: "include", // allows cookies
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ UserName: newUserName, UserGroupByUser: aAssignedUsergroupArray })
			});
			
			if (!res.ok) {
				throw new Error(`User update failed in DB ${dbName}`);
			}
		}
    });
});