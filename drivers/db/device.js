'use strict';

const Homey = require('homey');
const mysqlApi = require('../../mysqlApi');

class db extends Homey.Device {

    async onInit() {
        this.log('MySQL-DB init: '+this.getName()+' ID: '+this.getData().id);

        await this.updateCapabilities();

        // Register Flow-Trigger
        this._flowTriggerQueryResult = this.homey.flow.getDeviceTriggerCard("query_result");

    } // end onInit

    async updateCapabilities(){
        // add new capabilities

    }

    onAdded() {
        let id = this.getData().id;
        this.log('device added: ', id);

    } // end onAdded

    onDeleted() {
        let id = this.getData().id;
        this.log('device deleted:', id);
    } // end onDeleted

    async postQuery(args){
        this.log("Action post_query started.");
        this.log("SQL query: " + args.query);
        let settings = {
            host: this.getStoreValue('host'),
            port: this.getStoreValue('port'),
            user: this.getStoreValue('user'),
            pw: this.getStoreValue('pw'),
            db: this.getStoreValue('db')
        };
        try{
            let query = args.query;
            let parsedQuery = query.replace(/(\d{2})\-(\d{2})\-(\d{4})/g, "$3-$2-$1");
            this.log("Modified Query: " + parsedQuery)
            let result = await mysqlApi.query(settings, parsedQuery);
            this.log("Result: ");
            this.log(result[0]);
            this.triggerQueryResult(args.id, result);
        }
        catch (error){
            this.log("Error: "+error.message);
            let message =   this.homey.__('query.db') +
                            ' "' + settings.db + '"';
            if (args.id){
                message = message + ' Query-ID "' + args.id + '"';
            }
            message = message +
                            ': ' +
                            this.homey.__('query.error') + 
                            ': '+ error.message;
            this.homey.notifications.createNotification({excerpt: message });
        }
    }

    async triggerQueryResult(queryId, result){
        let value_text = '';
        let value_number = 0;

        try{
            let table = result[0];
            let line = table[0];
            let value = Object.values(line)[0];

            if (typeof value === 'number'){
                value_number = value;
                value_text = value.toString();
            }
            if (typeof value === 'string'){
                value_text = value;
                
                value_number = parseFloat(value);
                if (isNaN(value_number)){
                    value_number = 0;
                }
            }

            let tokens = {
                id: queryId,
                result_text:  JSON.stringify(table),
                value_text: value_text,
                value_number: value_number 
            }
            this._flowTriggerQueryResult.trigger(this, tokens)
                .catch(this.error);
        }
        catch (error){
            this.error(error.message);
        }
    }
}
module.exports = db;