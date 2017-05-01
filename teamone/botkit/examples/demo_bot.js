/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
               _     ____  ____   __   _  _        __   __ _  ____
              ( )   (_  _)(  __) / _\ ( \/ ) ___  /  \ (  ( \(  __)
             (_ _)    )(   ) _) /    \/ \/ \(___)(  O )/    / ) _)
              (_)    (__) (____)\_/\_/\_)(_/      \__/ \_)__)(____)

This is a sample Team-One bot built with Botkit.

The contents of this file are a very slight variation of the [`demo-bot.js`
file](https://github.com/howdyai/botkit/blob/master/examples/demo_bot.js)
found in the [Botkit repository](https://github.com/howdyai/botkit).

The only changes made relative to the original file
([rev 6f3179f](https://github.com/howdyai/botkit/commit/6f3179ff40b308ba3d9516e8faf74a6e16146c76) to be exact)
are in this comment and in the two lines used to load and create the Team-One
connector (rather than the Slack connector used in the origanl file.)

This bot demonstrates many of the core features of Botkit:

* Connect to Team-One using the real time API
* Receive messages based on "spoken" patterns
* Send a message with attachments
* Send a message via direct message (instead of in a public channel)

# RUN THE BOT:

  Get an API token for your bot from Team-One

    -> https://app.intellinote.net/rest/account/api-tokens

  Run your bot from the command line:

    token=<MY TOKEN> node demo_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "Attach"

  The bot will send a message with an attachment.

  Send: "dm me"

  The bot will reply with a direct message.

  Make sure to invite your bot into other channels!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// The next three (non-comment) lines are slightly different than what you'll
// find in the original file, since we want to create a `teamonebot` instance
// rather than a `slackbot` instance.  Otherwise the contents of this file are
// unchanged from the original at
// <https://github.com/howdyai/botkit/blob/master/examples/demo_bot.js>.
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// There are a couple of ways to load Botkit with Team-One support:
//
// (1) Require 'botkit-team-one' INSTEAD of 'botkit', like this:
//       var Botkit = require('botkit-team-one').Botkit;
//     instead of
//       var Botkit = require('botkit');
//
// (2) Require 'botkit-team-one' IN ADDITION to 'botkit', like this:
//       var Botkit = require('botkit');
//       require('botkit-teamone');
//

// Here we'll use the second technique, and since this file is _within_ the
// botkit-team-one repo, we'll load the module by referncing the local file.
var Botkit = require('botkit');
require("../lib/index.js");  // You'll typically use `require("botkit-teamone")`

// Now we can invoke "Botkit.teamonebot" in the same way you use other
// Botkit connectors:

var controller = Botkit.teamonebot({ debug: false });

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// From this point down, the code in this file has not been changed from that
// found in the original at
// <https://github.com/howdyai/botkit/blob/master/examples/demo_bot.js>.
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

if (!process.env.token) {
  console.log('Error: Specify token in environment');
  process.exit(1);
}

controller.spawn({
  token: process.env.token
}).startRTM(function(err) {
  if (err) {
    throw new Error(err);
  }
});


controller.hears(['hello','hi'],['direct_message','direct_mention','mention'],function(bot,message) {
    bot.reply(message,"Hello.");
});

controller.hears(['attach'],['direct_message','direct_mention'],function(bot,message) {

  var attachments = [];
  var attachment = {
    title: 'This is an attachment',
    color: '#FFCC99',
    fields: [],
  };

  attachment.fields.push({
    label: 'Field',
    value: 'A longish value',
    short: false,
  });

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  });

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  });

  attachments.push(attachment);

  bot.reply(message,{
    text: 'See below...',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
});

controller.hears(['dm me'],['direct_message','direct_mention'],function(bot,message) {
  bot.startConversation(message,function(err,convo) {
    convo.say('Heard ya');
  });

  bot.startPrivateConversation(message,function(err,dm) {
    dm.say('Private reply!');
  });

});
