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

  }


}
  
module.exports = mySQL;