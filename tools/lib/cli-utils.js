const chalk = require('chalk');
const boxen = require('boxen');
const wrapAnsi = require('wrap-ansi');
const figlet = require('figlet');
const path = require('node:path');

const CLIUtils = {
  /**
   * Get version from package.json
   */
  getVersion() {
    try {
      const packageJson = require(path.join(__dirname, '..', '..', 'package.json'));
      return packageJson.version || 'Unknown';
    } catch {
      return 'Unknown';
    }
  },

  /**
   * Display BAWS welcome message and branding
   * Uses figlet for ASCII art, chalk for colors, boxen for the border
   */
  displayWelcome() {
    const version = this.getVersion();

    // Figlet ASCII art for "BAWS"
    const asciiArt = figlet.textSync('BAWS', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });

    const heading = chalk.cyan.bold('WELCOME TO BAWS!');
    const tagline = chalk.dim('Business Analysis Workspace — AI-powered document analysis');
    const versionLine = chalk.dim(`v${version}`);

    const content = [heading, '', chalk.cyan(asciiArt), '', tagline, versionLine].join('\n');

    const wrapped = wrapAnsi(content, 76, { hard: true, wordWrap: true });

    const boxOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    };

    console.log(boxen(wrapped, boxOptions));
  },
};

module.exports = CLIUtils;
