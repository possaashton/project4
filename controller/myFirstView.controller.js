sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/m/MessageToast" 
], (Controller) => {
    "use strict";

    return Controller.extend("project4.controller.myFirstView", {

        onInit() {
			this.byId("ipUserCode").setValue('ashton');
			this.byId("ipUserName").setValue('possa');
			//const oMCB = this.byId("mcbDBSelector").addSelectedKeys([1]);


        },
        onUpdateUser: async function () {
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
		
					// 3. Update user in this DB
					await this._updateUser(sessionId, userData, dbName);
		
					//MessageToast.show(`User updated in ${dbName}`);
				}
			} catch (err) {
				console.error(err);
				//MessageToast.show("Error: " + err.message);
			}
			
			
			
		},

        _frmValidation: function () {
            if (this.byId("ipUserCode").getValue() === '' ||
                this.byId("ipUserName").getValue() === '') {
                MessageToast.show("UserCode/UserName cannot be blank");
                return false;
            }

            if (this.byId("mcbDBSelector").getSelectedKeys().length === 0) {
                //MessageToast.show("Please select at least one Database");
                return false;
            }

            return true;
        },

        _login: async function (payload) {
			try {
				// 1️⃣ Get the base URL from manifest.json
				const oComponent = this.getOwnerComponent();
				const oDataSource = oComponent.getMetadata().getManifestEntry("sap.app").dataSources.mainService;
				const sBaseUrl = oDataSource.uri.replace(/\/$/, ""); // remove trailing slash
			
				// 2️⃣ Call the Service Layer login
				const res = await fetch(`${sBaseUrl}/Login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});
			
				// 3️⃣ Parse JSON
				const data = await res.json().catch(() => null);
			
				// 4️⃣ Check for errors
				if (!res.ok || !data || data.error) {
					if (sap.m && sap.m.MessageToast) {
						sap.m.MessageToast.show(`Login failed for ${payload.CompanyDB}`);
					} else {
						console.warn(`Login failed for ${payload.CompanyDB}`);
					}
					return null;
				}
			
				// 5️⃣ Return session ID
				return data.SessionId;
			
			} catch (err) {
				console.error("Login error:", err);
				if (sap.m && sap.m.MessageToast) {
					sap.m.MessageToast.show(`Login error for ${payload.CompanyDB}: ${err.message}`);
				}
				return null;
			}
	
        },

		_getUser: async function (sessionId, dbName) {
			const userCode = this.byId("ipUserCode").getValue();
			
			const oComponent = this.getOwnerComponent();
			const oDataSource = oComponent.getMetadata().getManifestEntry("sap.app").dataSources.mainService;
			const sBaseUrl = oDataSource.uri.replace(/\/$/, "");
			
			const res = await fetch(`${sBaseUrl}/Users?$filter=UserCode eq '${userCode}'`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"B1S-Session": sessionId					
				}
			});
			
			if (!res.ok) {
				//MessageToast.show(`User lookup failed in ${dbName}`);
				return null;
			}
			
			const data = await res.json();
			if (!data.value || data.value.length === 0) {
				//MessageToast.show(`User '${userCode}' not found in ${dbName}`);
				return null;
			}
			
			return { ...data.value[0], DbName: dbName }; // return DB name along with user
			
		},
		
		_updateUser: async function (sessionId, userData, dbName) {
			const internalKey = userData.InternalKey;
			const newUserName = this.byId("ipUserName").getValue();
			
			const oComponent = this.getOwnerComponent();
			const oDataSource = oComponent.getMetadata().getManifestEntry("sap.app").dataSources.mainService;
			const sBaseUrl = oDataSource.uri.replace(/\/$/, "");
			
			const res = await fetch(`${sBaseUrl}/Users(${internalKey})`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					"B1S-Session": sessionId
				},
				body: JSON.stringify({ UserName: newUserName })
			});
			
			if (!res.ok) {
				throw new Error(`User update failed in DB ${dbName}`);
			}
		},
        frmValidation: async function(){
            if(this.byId("ipUserCode").getValue() == ''
                || this.byId("ipUserName").getValue() == ''){
                console.log("UserCode/UserName Cannot be blank");
                MessageToast.show("UserCode/UserName Cannot be blank");
                return false;
            }
            var aSelectedKeys =  this.byId("mcbDBSelector").getSelectedKeys();
            if(aSelectedKeys.length == 0){
                console.log("Databases/User Authorizations Cannot be blank");
                MessageToast.show("Databases/User Authorizations Cannot be blank");
                return false;
            }   
            return true;                             
        },

        testMultiDBUserFetch: async function () {
			const sUserName = "manager";
			const sPassword = "B1Admin";
			const userCode = "manager"; // user to fetch
			const dbList = ["SBODemoUS", "SBODemoGB"];
			
			// Map DB → BAS Destination
			const destinationMap = {
				"SBODemoUS": "B1S_US",
				"SBODemoGB": "B1S_GB"
			};
			
			for (const dbName of dbList) {
				const dest = destinationMap[dbName];
				if (!dest) {
					console.warn(`No destination configured for ${dbName}`);
					continue;
				}
			
				try {
					// 1️⃣ Login to this DB
					const loginRes = await fetch(`/destinations/${dest}/b1s/v1/Login`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							CompanyDB: dbName,
							UserName: sUserName,
							Password: sPassword
						})
					});
			
					const loginData = await loginRes.json();
					if (!loginRes.ok || loginData.error || !loginData.SessionId) {
						console.error(`Login failed for ${dbName}`, loginData);
						continue;
					}
			
					const sessionId = loginData.SessionId;
					console.log(`Logged into ${dbName}, SessionId: ${sessionId}`);
			
					// 2️⃣ Fetch user
					const userRes = await fetch(`/destinations/${dest}/b1s/v1/Users?$filter=UserCode eq '${userCode}'`, {
						method: "GET",
						headers: {
							"Content-Type": "application/json",
							"B1S-Session": sessionId
						}
					});
			
					const userData = await userRes.json();
					if (!userData.value || userData.value.length === 0) {
						console.warn(`User '${userCode}' not found in ${dbName}`);
					} else {
						console.log(`User in ${dbName}:`, userData.value[0]);
					}
			
					// Optional: logout after test
					await fetch(`/destinations/${dest}/b1s/v1/Logout`, {
						method: "POST",
						headers: {
							"B1S-Session": sessionId
						}
					});
			
				} catch (err) {
					console.error(`Error processing DB ${dbName}:`, err);
				}
			}
		}
    });
});