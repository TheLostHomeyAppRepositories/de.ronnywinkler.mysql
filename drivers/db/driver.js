"use strict";
const Homey = require('homey');
const mysqlApi = require('../../mysqlApi');

class dbDriver extends Homey.Driver {
    onPair(session) {
        this.log("onPair()");
        this.settingsData = { 
            "host": "",
            "port": "3306",
            "user": "",
            "pw": ""
        };

        session.setHandler("list_devices", async () => {
            return await this.onPairListDevices(session);
        });
      
        session.setHandler("check", async (data) => {
            return await this.onCheck(data);
        });

        session.setHandler("settingsChanged", async (data) => {
            return await this.onSettingsChanged(data);
        });

        session.setHandler("getSettings", async () => {
            this.log("getSettings: ");
            this.log(this.settingsData);
            return this.settingsData;
        });

    } // end onPair

    async onCheck(data){
        this.log("Event Check: ");
        this.log(data);
        this.settingsData = data;

        try{
            if (await mysqlApi.checkConnection(data))
                return this.homey.__("pair.db.connection_ok");
            else return this.homey.__("pair.db.connection_error");
        }
        catch (error){
            return this.homey.__("pair.db.connection_error") + ': ' + error.message;
        }
    }

    async onSettingsChanged(data){
        this.log("Event settingsChanged: ");
        this.log(data);
        this.settingsData = data;
        return true;
    }

    async onPairListDevices(session) {
        this.log("onPairListDevices()" );
        let devices = [];
        let databases = await mysqlApi.getDatabases(this.settingsData);
        if (databases && databases.length>0){
            for (let i=0; i<databases[0].length; i++){
                devices.push(
                    {
                        name: databases[0][i].Database,
                        data: {
                          id: this.getUIID()
                        },
                        store: {
                            host: this.settingsData.host,
                            port: this.settingsData.port,
                            user: this.settingsData.user,
                            pw: this.settingsData.pw,
                            db: databases[0][i].Database
                        }
                    }
                );
            }
        }
        this.log("Found devices:");
        this.log(devices);
        return devices;
    }

    getUIID() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
    }

}
module.exports = dbDriver;