if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', true);
}

'use strict';

const Homey = require('homey');

class mySQL extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MySQL has been initialized');

    // Register Flow-Action-Listener
    this._flowActionPostQuery = this.homey.flow.getActionCard('post_query');
    this._flowActionPostQuery.registerRunListener(async (args, state) => {
            let result = await args.device.postQuery(args);
            return await this.getQueryResultToken(args.id, result);
    });

    // Register Flow-Condition-Listener
    this._flowConditionQueryResultNumberEqual = this.homey.flow.getConditionCard("is_query_result_number_equal")
    .registerRunListener(async (args, state) => {
      let result = await args.device.postQuery(args);
      let value = this.parseResult(result, 'number');
      return (value == args.value);
    })
    this._flowConditionQueryResultNumberGreater = this.homey.flow.getConditionCard("is_query_result_number_greater")
    .registerRunListener(async (args, state) => {
      let result = await args.device.postQuery(args);
      let value = this.parseResult(result, 'number');
      return (value > args.value);
    })
    this._flowConditionQueryResultStringEqual = this.homey.flow.getConditionCard("is_query_result_string_equal")
    .registerRunListener(async (args, state) => {
      let result = await args.device.postQuery(args);
      let value = this.parseResult(result, 'string');
      return (value == args.value);
    })
    this._flowConditionQueryResultSuccessful = this.homey.flow.getConditionCard("is_query_result_successful")
    .registerRunListener(async (args, state) => {
      let result = await args.device.postQuery(args);
      let value = this.parseResult(result, 'bool');
      return (value);
    })
    
  }

  /* result_type can be:
  * 'number'
  * 'string'
  * 'bool'
  */
  parseResult(result, result_type = 'number'){
    let value_text = '';
    let value_number = 0;

    try{
      let table = result[0];

      if (table.length == undefined) {
        // Insert/Update-Result
        // Condition can not be used with post result (true/false). Condition must result in a value
        let success = false;
        if (table.affectedRows > 0){
            success = true;
        }
        switch (result_type){
          case 'bool':
            return success;
          case 'number':
            return 0;
          case 'string':
            return '';
          default:
            return success;
        }        
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
          switch (result_type){
            case 'bool':
              return success;
            case 'number':
              return 0;
            case 'string':
              return '';
            default:
              return success;
          }        
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
        switch (result_type){
          case 'bool':
            return success;
          case 'number':
            return value_number;
          case 'string':
            return value_text;
          default:
            return success;
        }        
    }
    }
    catch(error){
      switch (result_type){
        case 'bool':
          return false;
        case 'number':
          return 0;
        case 'string':
          return '';
        default:
          return false;
      }        
    }
  }

  async getQueryResultToken(queryId, result){
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
                success: success,
                value_text: '',
                value_number: 0
            };
            return tokens;
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
                success: success,
                affected_rows: 0,
                insert_id: 0,
                field_count: 0,
                info: ''
            };
            return tokens;
        }
    }
    catch (error){
        this.error(error.message);
    }
  }
}
  
module.exports = mySQL;