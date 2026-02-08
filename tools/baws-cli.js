#!/usr/bin/env node

const { program } = require('commander');
const path = require('node:path');
const fs = require('node:fs');

const packageJson = require('../package.json');
const CLIUtils = require('./lib/cli-utils');

// Load all command modules
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

const commands = {};
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands[command.command] = command;
}

program
  .version(packageJson.version)
  .description('BAWS - Business Analysis Workspace CLI');

// Register commands
for (const [name, cmd] of Object.entries(commands)) {
  const command = program.command(name).description(cmd.description);
  for (const option of cmd.options || []) {
    command.option(...option);
  }
  command.action(cmd.action);
}

// Default action when no command: show welcome
program.action(() => {
  CLIUtils.displayWelcome();
  process.exit(0);
});

program.parse(process.argv);
