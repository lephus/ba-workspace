const CLIUtils = require('../lib/cli-utils');

module.exports = {
  command: 'welcome',
  description: 'Display welcome message and BAWS branding',
  options: [],
  action: async () => {
    CLIUtils.displayWelcome();
    process.exit(0);
  },
};
