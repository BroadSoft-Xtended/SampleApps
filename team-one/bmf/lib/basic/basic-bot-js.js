#!/usr/bin/env node

// A simple JavaScript-based example of using the bot management framework.
var path        = require('path'),
    HOMEDIR     = path.join(__dirname,'..','..'),
    LIB_DIR     = path.join(HOMEDIR,'lib'),
    BaseBot     = require(path.join(LIB_DIR,"base-bot")).BaseBot;

var config = { name: "BasicBotJS" }
var basicBot = new BaseBot(config);

var api_key = process.argv[2] || process.env["api_key"] || process.env["API_KEY"];
if (!api_key) {
  console.error("ERROR: API Key is missing.");
  console.error("  use: [debug=true] node basic-bot-js.js <API-KEY>");
  console.error("   or: [debug=true] api_key=<API-KEY> node basic-bot-js.js");
  process.exit(1);
}

basicBot.on("rtm/message", function(payload) {
  this.reply(payload, "This bot is just an example. It doesn't actually do anything.");
})

basicBot.launch_bot(api_key,"at_me=true");
