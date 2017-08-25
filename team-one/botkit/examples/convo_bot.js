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

The contents of this file are a very slight variation of the [`convo-bot.js`
file](https://github.com/howdyai/botkit/blob/master/examples/convo_bot.js)
found in the [Botkit repository](https://github.com/howdyai/botkit).

The only changes made relative to the original file
([rev 2325e9b]https://github.com/howdyai/botkit/commit/2325e9b138346b4435a0f850617c53bb700b9f7a) to be exact)
are in this comment and in the two lines used to load and create the Team-One
connector (rather than the Slack connector used in the origanl file.)

This bot demonstrates a multi-stage conversation

# RUN THE BOT:

  Get an API token for your bot from Team-One

    https://app.intellinote.net/rest/account/api-tokens

  Run your bot from the command line:

    token=<MY TOKEN> node demo_bot.js

# USE THE BOT:

  Find your bot inside Team-One

  Say: "pizzatime"

  The bot will reply "What flavor of pizza do you want?"

  Say what flavor you want.

  The bot will reply "Awesome" "What size do you want?"

  Say what size you want.

  The bot will reply "Ok." "So where do you want it delivered?"

  Say where you want it delivered.

  The bot will reply "Ok! Goodbye."

  ...and will refrain from billing your card because this is just a demo :P

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
// <https://github.com/howdyai/botkit/blob/master/examples/convo_bot.js>.
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
// <https://github.com/howdyai/botkit/blob/master/examples/convo_bot.js>.
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

controller.hears(['pizzatime'],['ambient'],function(bot,message) {
  bot.startConversation(message, askFlavor);
});

askFlavor = function(response, convo) {
  convo.ask("What flavor of pizza do you want?", function(response, convo) {
    convo.say("Awesome.");
    askSize(response, convo);
    convo.next();
  });
}
askSize = function(response, convo) {
  convo.ask("What size do you want?", function(response, convo) {
    convo.say("Ok.")
    askWhereDeliver(response, convo);
    convo.next();
  });
}
askWhereDeliver = function(response, convo) {
  convo.ask("So where do you want it delivered?", function(response, convo) {
    convo.say("Ok! Goodbye.");
    convo.next();
  });
}
