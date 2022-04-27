'use strict';

const Homey = require('homey');
const mysqlApi = require('../../mysqlApi');

class db extends Homey.Device {

    async onInit() {
        this.log('MySQL-DB init: '+this.getName()+' ID: '+this.getData().id);

        await this.updateCapabilities();

        // Register Flow-Trigger
        this._flowTriggerQueryResult = this.homey.flow.getDeviceTriggerCard("query_result");
        this._flowTriggerQueryResult.registerRunListener(async (args, state) => {
            return ( !args.id || args.id === state.id);
        });
        this._flowTriggerPostResult = this.homey.flow.getDeviceTriggerCard("post_result");
        this._flowTriggerPostResult.registerRunListener(async (args, state) => {
            return ( !args.id || args.id === state.id);
        });
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
            let parsedQuery = this.parseQuery(query);
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
            this.homey.notifications.createNotification({excerpt: message }).catch(error => {this.error('Error sending notification: '+error.message)});
        }
    }

    parseQuery(query){
        // Format all dates from DD-MM-YYYY to YYYY-MM-DD
        let parsedQuery = query.replace(/(\d{2})\-(\d{2})\-(\d{4})/g, "$3-$2-$1");

        // do date calculations
        let regex = /\[date[+-]\d+[dmy]\]/gi
        let result, indices = [];
        while ( (result = regex.exec(parsedQuery)) ) {
            indices.push(result);
        }
        // this.log(indices);

        if (indices.length > 0){
            for (let i=0; i<indices.length; i++){
                let date = this.getTargetDate(indices[i][0]);
                parsedQuery = parsedQuery.replace( indices[i][0], date );
            }
        }

        return parsedQuery;
    }

    getTargetDate(string){
        let tz  = this.homey.clock.getTimezone();
        let now = new Date().toLocaleString('en-US', 
        { 
            hour12: false, 
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        let result;
        let regex;

        regex = /[+-][0123456789]+[dmy]/;
        result = regex.exec(string);
        string = result[0];

        regex = /\d+/;
        result = regex.exec(string);
        let nr = parseInt(result[0]);

        regex = /[+-]/;
        result = regex.exec(string);
        let sign = result[0];

        regex = /[dmy]/;
        result = regex.exec(string);
        let type = result[0];

        if (sign == '-'){
            nr = nr * -1;
        }
        let newDate;
        if (type == 'd'){
            newDate = this.addDays(now, nr);
        }
        if (type == 'm'){
            newDate = this.addMonths(now, nr);
        }
        if (type == 'y'){
            newDate = this.addYears(now, nr);
        }
        let newDateStr = newDate.toLocaleString('en-US', 
        { 
            hour12: false, 
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
        let date = newDateStr.split(", ")[0];
        date = date.split("/")[2] + "-" + date.split("/")[0] + "-" + date.split("/")[1]; 
        return date;
    }

    addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    addMonths(date, months) {
        let result = new Date(date);
        let d = result.getDate();
        result.setMonth(result.getMonth() + months);
        if (result.getDate() != d) {
          result.setDate(0);
        }
        return result;
    }

    addYears(date, years){
        let result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        return result;
    }

    async triggerQueryResult(queryId, result){
        let value_text = '';
        let value_number = 0;

        try{
            let table = result[0];

            if (table.length == undefined) {
                // Insert/Update-Result
                let success = false;
                if (table.affectedRows > 0){
                    success = true;
                }
                let tokens = {
                    id: queryId,
                    result_text:  JSON.stringify(table),
                    affected_rows: table.affectedRows,
                    insert_id: table.insertId,
                    field_count: table.fieldCount,
                    info: table.info,
                    success: success
                };
                let state = {
                    id: queryId
                };
                this._flowTriggerPostResult.trigger(this, tokens, state)
                    .catch(this.error);
            }
            else {
                // SELECT-Result
                let line = table[0];
                let value;
                let success;
                if (line){
                    success = true;
                    value = Object.values(line)[0];
                }
                else{
                    success = false;
                    value = '';
                }
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
                    value_number: value_number,
                    success: success
                };
                let state = {
                    id: queryId
                };
                this._flowTriggerQueryResult.trigger(this, tokens, state)
                    .catch(this.error);
            }
        }
        catch (error){
            this.error(error.message);
        }
    }
}
module.exports = db;