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
            return args.device.postQuery(args);
    });

    // Register Flow-Condition-Listener
    this._flowConditionQueryResultNumberEqual = this.homey.flow.getConditionCard("is_query_result_number_equal")
    .registerRunListener(async (args, state) => {
      let result = await args.device.postQuery(args);
      let value = this.parseResult(result, true);
      return (value == args.value);
    })
    this._flowConditionQueryResultNumberGreater = this.homey.flow.getConditionCard("is_query_result_number_greater")
    .registerRunListener(async (args, state) => {
      let result = await args.device.postQuery(args);
      let value = this.parseResult(result, true);
      return (value > args.value);
    })
    this._flowConditionQueryResultStringEqual = this.homey.flow.getConditionCard("is_query_result_string_equal")
    .registerRunListener(async (args, state) => {
      let result = await args.device.postQuery(args);
      let value = this.parseResult(result, false);
      return (value == args.value);
    })
    
  }

  parseResult(result, as_number = true){
    let value_text = '';
    let value_number = 0;

    try{
      let table = result[0];

      if (table.length == undefined) {
        // Insert/Update-Result
        // Condition can not be used with post result (true/false). Condition must result in a value
        if (as_number){
          return 0;
        }
        else{
          return '';
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
          if (as_number){
            return 0;
          }
          else{
            return '';
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
        if (as_number){
          return value_number;
        }
        else{
          return value_text;
        }
      }
    }
    catch(error){
      if (as_number){
        return 0;
      }
      else{
        return '';
      }
    }
  }

}
  
module.exports = mySQL;