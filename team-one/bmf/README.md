# Team-One Bot Management Framework

<!--TOC-->

This directory introduces a small framework that:

1. simplifies the creation of [Team-One](https://www.team-one.com/) bots, and
2. provides a configuration and process management infrastructure to support the operation of Team-One bots in production setting.

Team-One uses this same framework to build, deploy and manage several of its own bots.

The framework includes:

  * a standard `BaseBot` that simplifies the creation of Team-One bots in the common use-case.

  * some "best practices" that well-behaved bots should follow.

  * the complete source code for several Team-One bots that BroadSoft uses for demonstrations and testing.

  * a small framework for configuring, running and monitoring bots, suitable for managing bots "in production".

You may be interested in the ["quick start" documentation](#quick-start), more detail on [the bots included in this repository](#the-bots) or the tutorial on [creating your own bot](#creating-your-own-bot) using this framework.

## Quick Start

Assuming you already have [Node.js](https://nodejs.org/) installed:

1. Run `make all` to perform one-time setup.
2. Run `./bin/basic-bot-js API-KEY` to launch a simple bot.

See:

 * ["How to get an API Token"](#how-to-get-an-api-token) for details on how to do just that.

 * ["The Bots"](#the-bots) for more information about the bots found in this repository.

 * ["Set-up"](#set-up) and ["Running"](#running) for more detailed instruction on how to deploy and run these bots.

* ["Creating your own bot"](#creating-your-own-bot) for a tutorial about how to use this framework to create and operate custom bots.

### Non-`make` Alternative

If you cannot use `make` to manage the installation, you can use these alternative quick-start instructions:

1. Run `npm install`.
2. Run `node ./lib/basic/basic-bot-js.js API-KEY` to launch a simple bot.

You'll be missing scripts in `bin/` but you can use the pattern above to "manually" run the JavaScript files via the `node` interpreter.

## The Bots

Five examples are currently included with this framework, four of which are included in the production deployment of Team-One.

1. **Basic Bot**
    * A tiny but complete example of using this framework to create a Team-One bot.  It doesn't do much, but it does it in about 25 lines of code.
      * Note that there are JavaScript (`basic-bot-js.js`) and CoffeeScript (`basic-bot-coffee.coffee`) variations of this example.  The .js-file was _not_ generated from them the .coffee-file. They are independent (but essentially equivalent example)s.
    * Responds to @mentions and one-on-one chats.  
    * Demonstrates the basic use of this framework.

2. **Elizabot**
   * Runs messages through [a version of](https://github.com/tkafka/node-elizabot) Weizenbaum's [ELIZA](https://en.wikipedia.org/wiki/ELIZA) -- a simplistic but classic "AI" chatbot from the 1960s -- and posts the response to Team-One.  
   * Responds to @mentions and one-on-one chats.
   * Demonstrates:
      - the implementation of lightly-stateful, "conversational" bots.
      - use of emojiis and simple formatting in responses.
      - how to prevent a bot from replying to itself, triggering an endless loop.
      - (via [node-elizabot](https://github.com/tkafka/node-elizabot)) rudimentary natural language parsing through part-of-speech tagging.

2. **Cleverbot**
   * A slightly more advanced variation on Elizabot. Forwards messages to the public [Cleverbot](http://www.cleverbot.com/) chat-bot service and posts the response to Team-One.
   * Responds to @mentions and one-on-one chats.  
   * Demonstrates:
      - the implementation of lightly-stateful, "conversational" bots.
      - parsing chat messages for special "commands" to respond to.
      - personalizing responses with @mentions and calling users by name.
      - using the `hello` message to trigger one-time actions when the bot first connects.


4. **Coin-Flip Bot**
   * Listens for a "slash-command" like `/flip`, flips a virtual coin and posts the result to Team-One.  
   * Responds to the chat message `/flip` in any workspace or one-on-one chat it is a member&nbsp;of.
   * Demonstrates:
      - "nosy" bots that listen in on everything that happens in a workspace (rather than waiting for direct messages or @mentions)
      - the implementation of slash-commands through bots.
      - slightly more advanced Markdown formatting of chat messages.


5. **GMapsBot**
   * Parses chat messages such as

       ```
       directions [from <LOCATION>] to <OTHER-LOCATION>
       ```

     or

       ```
       map of <LOCATION>
       ```

        and posts a link to the equivalent Google Map.
    * Responds to @mentions and one-on-one chats.
    * Demonstrates:
       - prompting users with instructions and a very crude form of natural-language parsing to support more intuitive and discoverable commands.
       - personalizing responses with @mentions and calling users by name.       
       - Markdown-formatted links within chat messages.

See ["Set-up"](#set-up) and ["Running"](#running) for instructions on how to deploy and run these bots.

See ["Creating your own bot"](#creating-your-own-bot) for a tutorial about how to use this framework to create and operate custom bots.

## How to get an API Token

The Team-One "API token" or "API key" is an [OAuth2 access token](https://www.oauth.com/oauth2-servers/access-tokens/) through which you can make API requests on behalf of a specific bot or user.   For practical purposes, the API key determines whom the bot appears to be within the Team-One application.

There are a few ways to get one:

  * You can [create API tokens that access your personal account](https://app.us.team-one.com/rest/account/api-tokens).

  * You can use the [BroadSoft Developer's Portal](https://developer.broadsoftlabs.com/) to create a new bot account.  An API token will be generated for the bot.

  * You can contact apiteam@team-one.com to obtain an OAuth2 client_id/client_secret pair that can be used to generate or obtain access tokens by following the standard [OAuth2 protocol](https://oauth.net/2/).

Additional documentation on how to obtain access tokens can be found [here](https://developer.broadsoftlabs.com/#/app/documentation/TeamOne/Bots-AccessTokens.md) and  [here](https://developer.broadsoftlabs.com/#/app/documentation/TeamOne/ApiExamples.md) in the [BroadSoft Developer's Portal](https://developer.broadsoftlabs.com/).

## How to run these bots

### Prerequisites

To set-up and run these bots, you'll need:

  * **[Node.js](https://nodejs.org/)**
    * The latest [LTS release](https://github.com/nodejs/LTS#lts-schedule1) (currently ["Boron"](https://nodejs.org/download/release/latest-boron/)) is recommended.  Follow the instructions at https://nodejs.org/ to install.

    * We using recommend **[nvm](https://github.com/creationix/nvm)** to manage multiple node versions easily.  Simply [install nvm](https://github.com/creationix/nvm#install-script) then run `nvm install lts/boron` to fetch the latest LTS release.

  * One or more **[Team-One](https://app.us.team-one.com) API keys**.  

    * See ["How to get an API Token"](#how-to-get-an-api-token) for instruction on how to do that.

  * While not strictly required, **[make](https://www.gnu.org/software/make/)** will make installation and set-up easier.

    * `make` is already installed on most Linux systems, but if it isn't you can install it via `sudo apt-get install build-essential`, or `su - yum install make`, or the equivalent commands in your package manager of choice.

    * On OSX, if you have Xcode installed you can run `make` by pre-pending "xcrun", as in `xcrun make`.  Otherwise you can install `make` directly [as described here](http://stackoverflow.com/questions/11494522/installing-make-on-mac#answer-11494872).

    * On Windows, `make` is available in [MinGW](http://www.mingw.org/), [GNUWin](http://gnuwin32.sourceforge.net/packages/make.htm), as [a stand-alone executable](http://www.equation.com/servlet/equation.cmd?fa=make) and elsewhere

  * Note that to run the Cleverbot bot you'll also need an API key for the public [Cleverbot API](https://www.cleverbot.com/api/).  You can obtain a free API key by [registering on the cleverbot.com site](https://www.cleverbot.com/api/).)

### Set-Up

Only one step is required. Run:

```bash
make all
```

This will install all external dependencies and generate some handy (but optional) executable scripts.

(Without `make` you can run `npm install` to install the external dependencies but this will not generate the optional scripts.)

If you're planning a production deployment of these bots, you may want to create a copy of [./config/example.json](./config/example.json), and edit the settings labeled "CHANGE ME".  See ["Configuration management"](#configuration-management) for more information.

## Running

### As a stand-alone app

Once you've run `make all` (or `make bin`), you can use:

```bash
./bin/BOTNAME API-KEY
```

to run a bot.

In the command above:

  * `BOTNAME` is any of `basic-bot`, `cleverbot-bot`, `coin-flip-bot`, `eliza-bot`, `gmsapsbot` See ["The Bots"](#the-bots) for details on each bot.

  * `API-KEY` is an access token for the Team-One API.  See ["How to get an API Token"](#how-to-get-an-api-token) for details on how to get one.

  * Note that the CleverBot bot expects a second parameter, containing an API key for the CleverBot API.  See [the Cleverbot site](https://www.cleverbot.com/api/) for details on how to obtain a (free) Cleverbot API key.

 The app will log to STDOUT and STDERR to let you know what the bot is doing. Prefix `DEBUG=true` to the command for even more verbose logging.  Prefix `QUIET=true` for less verbose logging. Prefix `COLOR=true` for some color-coding that makes the log easier to scan.  For example:

```bash
DEBUG=true COLOR=true ./bin/basic-bot-js API-KEY
```

#### Alternative ways to launch the app

As long as you've run `npm install`, you can use:

```bash
node ./lib/BOTNAME/BOTNAME.js API-KEY
```

to launch the bot through the JavaScript interpreter, or:


```bash
./node_modules/.bin/coffee ./lib/BOTNAME/BOTNAME.coffee API-KEY
```

to launch the bot through the CoffeeScript interpreter.

Note that each of these ways of launching the app ultimately executes the same code.

### As a daemon

To run a bot in the background as a daemon or service, execute:

```bash
NODE_ENV=local ./bin/app-BOTNAME start
```

Where:

 * `BOTNAME` can be any of `cleverbot-bot`, `coin-flip-bot`, `eliza-bot`, `gmsapsbot`.  See [The Bots](#the-bots) for details on each bot.

 * The value of `NODE_ENV` will be used to find a configuration file in the `config` directory.  For example, when `NODE_ENV` is `local` the configuration will be read from `./config/local.json`. (See ["Configuration management"](#configuration-management).)

 In addition to `start`, you invoke `status`, `stop`, `restart`, `reload` and a bunch more actions.  Run `./bin/app-<BOTNAME> help` for details.

 Log files will be written to `./logs/app-<BOTNAME>.log` and `./logs/app-<BOTNAME>.err`.

## Creating your own bot

To keep our example simple, let's create a bot that parrots back any message that is sent to it, except in ALL CAPS.  We'll call it LoudBot.

### Authoring the core bot

Let's assume we're building a bot that will be bundled directly with this repository, so we'll create a sub-directory at `lib/loud-bot`. Create the file `loud-bot.js` within that directory.  Open that file in your favorite text editor.

In this section we'll create the core parts of the bot -- enough to get it up and running -- and then add some enhancements in subsequent sections.

**1. Imports**

First we add some boilerplate code to import `BaseBot`, the base object the framework provides for us to extend.

```js
var path    = require('path'),
    HOMEDIR = path.join(__dirname,'..','..'),
    LIB_DIR = path.join(HOMEDIR,'lib')
    BaseBot = require(path.join(LIB_DIR,"base-bot")).BaseBot;
```

**2. Instantiate the bot.**

`BaseBot` is a class we could extend through prototypal inheritance but to keep things simple we'll just create a single instance and use events to customize the behavior.

```js
var loudBot = new BaseBot({name:"Loud Bot"});
```


The `BaseBot` constructor accepts an optional "name" parameter. This value is only used in local log messages, it does not appear in (nor is it even shared with) the Team-One application.

**3. Add the message listener.**

`BaseBot` will emit an event when there is activity on the bot's RTM API connection.

The most commonly used of these is the `rtm/message` event, which is fired whenever the bot is notified of the chat message.

The first parameter passed to the method contains the JSON object delivered by the RTM API.  This object is [described in  detail](https://developer.broadsoftlabs.com/#/app/documentation/TeamOne/Bots-SendingAndReceivingMessages.md#receiving-chat-messages) within the Developer's Portal, but in this case we're only interested in a single attribute --  `text`  -- which contains the contents of the chat message itself.

We'll parse the chat message out of the payload, convert it to upper case and then post the ALL CAPS message back to the workspace or chat, like this:

```js
loudBot.on( "rtm/message", function(payload) {
  var message = payload.text;
  message = message.toUpperCase();
  loudBot.reply(payload, message); // you could also say "this.reply" here.
});
```

Note that `reply` is a convenience method provided by the framework.  It accepts two parameters -- the original RTM payload and the contents of a chat message you wish to post.  The `reply` method will post the given chat message back to the workspace (identified by the `workspace_id` attribute in the original payload).


**4. Launching the bot.**

Finally, we'll use the framework's `launch_bot` method to get the bot up and running.

This method accepts two parameters -- the API token used to connect to the Team-One API and a string (or array of strings) defining the [filter parameters](https://app.us.team-one.com/rest/content/rtm-how-to#event-filtering-parameters) that determine which messages our bot will receive from the RTM API.

We'll read the API key from the command line (and report an error if it is missing):

```js
var api_key = process.argv[2];
if (!api_key) {
  console.error("API key is missing.");
  process.exit(1);
}
```

We'll listen for messages that are specifically directed at our bot, whether through an @mention or in a one-on-one chat:

```js
var filters = "at_me=true";
```

Now we can just call `launch_bot`:

```js
loudBot.launch_bot(api_key, "at_me=true");
```

### Testing the core bot

Your `loud-bot.js` file should now contain the code listed in the [previous section](#authoring-the-core-bot), in the same order they appear above.  That's all we need to get the bot working.  So, let's try it out.  Run:

```bash
node ./lib/loud-bot/loud-bot.js API-KEY
```

(Replacing `API-KEY` with your actual key.)  You should see a couple of messages that indicate that the bot is up and running:

```
[Loud Bot] WS connection established.
[Loud Bot] RTM session started.
 ```

The bot will now keep running until we close it (or it is disconnected by the RTM server).

Now open Team-One and start a one-on-one chat with the bot.  It should echo back everything chat message and you'll see some information in the log for every message received and sent:

```
[Loud Bot] Received via websocket: {"type":"message","subtype":"message_added","user":"user5302","screen_name":"rodw5302","given_name":"Rod","family_name":"Waldhoff","org_id":5334,"org_name":"BroadSoft","workspace_id":56086,"workspace_name":"Chat","workspace_1on1":true,"channel":"5334/56086","team":5334,"note_id":531138,"text":"Hello World","at_me":true,"at_us":false,"from_me":false,"ts":"2311383","ts_iso":"2017-05-07T20:52:20.380Z"}
[Loud Bot] Sending RTM payload via websocket: {"type":"message","org_id":5334,"workspace_id":56086,"text":"HELLO WORLD"}
```

### Heartbeat and presence

In addition to the convenience methods that framework provides, `BaseBot` automatically implements a couple of behaviors that are good practices for most bots to follow.

To see these in action, launch out bot with debug-level logging enabled:

```
DEBUG=true ./bin/loud-bot API-KEY
```

After a moment or two, you will see some new messages in the log, which look something like this:

```
[Loud Bot] Sending RTM payload via websocket: {"n":0,"sent":1494188671295,"type":"ping"}
[Loud Bot] Received via websocket: {"n":0,"sent":1494188671295,"type":"pong","ts":"1494188671.215897686","ts_iso":"2017-05-07T20:24:31.215Z"}
[Loud Bot] Got pong response. Round-trip latency 0.0s. Repeating in 32.5s.
```

and:

```
[Loud Bot] Sending RTM payload via websocket: {"type":"rest/request","method":"PUT","path":"/user/-/presence","body":{"presence":"ONLINE"},"id":"2d4e1400336311e789e37baf53628b4a"}
[Loud Bot] Received via websocket: {"type":"rest/response","reply_to":"2d4e1400336311e789e37baf53628b4a","status":204,"ts":"1494188671.569623441","ts_iso":"2017-05-07T20:24:31.569Z"}
[Loud Bot] Presence set to ONLINE. Round-trip latency 0.2s. Repeating in 709.7s.
```

As suggested in the log messages itself, these actions will repeat, creating similar lines in the log every so often.

These correspond to extra RTM API calls that the `BaseBot` will (by default) trigger on a regular interval.

The first set (`type:pong`) represents a periodic "heartbeat" signal that our bot uses to keep the websocket connection from timing-out either at the RTM server or in some networking tier between our bot and that server.  To create this heartbeat our bot submits a `ping` message roughly every 30 seconds, and outputs that message to the log when it receives the `pong` response.  [See the RTM API documentation for more information about `ping` and `pong` messages.](https://app.us.team-one.com/rest/content/rtm-how-to#ping-pong)

The second set (`type:rest/request`) represents a periodic RTM message that our bot posts to set the bot's presence status to "online".  This will allow the bot to appear active with the Team-One application whether or not it has recently sent or received any chat messages.  Doing this consistently gives end-users an easy way to tell whether or not the bot is running and listening.  This update is performed by calling the  [`PUT /user/-/presence` REST method](https://app.us.team-one.com/rest/api/v2/#!/users/put_user_presence) by [tunneling the request thru the RTM API](https://app.us.team-one.com/rest/content/rtm-how-to#rest-api-tunneling). Since Team-One will allow a user to be idle for a little while before flagging them as offline this message only needs to be repeated every 10 minutes or so.

Both of these behaviors can be controlled by properties in the configuration files found in `config`.  See [the next section](#configuration-management) for more information about using the configuration framework.

### Configuration management

The `BaseBot` framework integrates with [a simple configuration management framework](https://github.com/intellinote/inote-util#config) we use to manage environment-specific parameters or settings we'll commonly want to control outside of the code.

The framework works like this:

  * Settings are stored in JSON documents (conventionally found in `./config`).  These are true JSON (not JavaScript) files, so code is not allowed and attribute names must be "quoted".  However, these files *do* allow `/* block-style */` and `// single-line` comments, which makes it easy to annotate the configuration settings.

  * The active configuration is determined at runtime by the `NODE_ENV` environment variable.  Specifically, framework uses the file found at `./config/$NODE_ENV.json` for the active configuration, so given `NODE_ENV=foo` the framework will look for `./config/foo.json`.

    * Note that as a feature of most shells, you can set an environment variable for your entire session by adding something like `export NODE_ENV=foo` to your set-up script, but you can also set (or override) an environment variable for a single run of an application or command by prefixing `NODE_ENV=foo` to the command you would otherwise invoke. E.g., `NODE_ENV=local ./bin/loud-bot`

  * Environment variables can also be used to set or override configuration parameters.  For example, the command:

    ```bash
    foo=true ./bin/loud-bot`
    ```

    is equivalent to the `config` file:

    ```json
    { "foo": true }
    ```

    Since both `.` and `:` can cause problems when used in the name of an environment variable, two underscores (e.g. `__`) can be used to delimit nested attributes.  For example, the command:

    ```bash
    foo__bar=true ./bin/loud-bot`
    ```

    is equivalent to the `config` file:

    ```json
    {
      "foo": {
        "bar": true
      }
    }
    ```
  * To access these configuration parameters from our JavaScript code, we initialize the configuration object via:

    ```js
    var config  = require("inote-util").config.init();
    ```

    then read specific parameters using `config.get`, like this:

    ```js
    var api_key = config.get("api-key");
    ```

    Nested parameters are accessed by using `:` as the delimiter. For example:

    ```js
    var foobar = config.get("foo:bar"); // reads "X" from "{foo:{bar:"X"}}
    ```

#### Reading the API key from the configuration file

Let's add code to `loud-bot.js` to optionally read the API key from the configuration management framework.

First, in our import section at the top of the file we must initialize the configuration object, by adding the following line:

```js
var config  = require("inote-util").config.init(); // add this line
```

Now we can use the `config` object to read the API key.  Replace the line that reads:

```js
var api_key = process.argv[2]; // change this line...
```

with:

```js
var api_key = config.get("loud-bot:api-key") || config.get("api-key") || process.argv[2]; // ...to this.
```

This allows the API key to be read from (in order of precedence) a property named `loud-bot.api-key`, a property named `api-key` or the command line parameter.

Finally, edit your configuration file to add the fragment:

```json
"loud-bot": {
  "api-key": "CHANGE-ME"
}
```
to the root JSON object.

Now we can run:

```bash
NODE_ENV=local ./bin/loud-bot
```

to launch the bot (replacing `local` with the name of your actual configuration file).

### Making a daemon

While running `node FILENAME API-KEY` is fine for development purposes, when we are deploying our bot in a production context where our customers may depend upon it, we'll want something a little more robust.  

In particular:

  1. We'll want to launch our script as a "daemon" -- running in the background and out-lasting the session from which it was launched.

  2. More generally, we'll want to support the typical service-like commands of `stop`, `start`, `restart`, and `status`.

  3. We'll want to send error and log messages to files rather than just STDERR and STDOUT (so we can review them later for debugging or audit purposes).

  4. We'll want to monitor the process and restart it if it shuts down unexpectedly. (This last point is especially important for RTM API clients like our bot.  Clients should _expect_ the Team-One server to periodically close long-running websocket connections. It's virtually guaranteed to happen.  Our bot must be prepared to re-connect when this happens.)

Luckily this framework already provides these features.

In order for our Loud-Bot to take advantage of this we only need to create a tiny shell script.

Inside the `bin` directory, create a file named `app-loud-bot`.  Edit that file to insert the following two lines:

```bash
#!/bin/bash
`dirname $0`/.via-forever "lib/loud-bot/loud-bot.js" $1
```

Then run `chmod a+x ./bin/app-loud-bot` to make sure that the script is executable.

Now we can run:

```bash
NODE_ENV=local ./bin/app-loud-bot start
```

(replacing `local` with the name of your actual configuration file) to launch the bot in the background, writing log files to `./logs/app-loud-bot.log` and `./logs/app-loud-bot.err`.

Just for kicks, let's test the restart-on-failure monitoring.  Run:

```bash
./bin/app-loud-bot pid
```

to discover the process ID the app is running as.  Then run:

```bash
kill -9 THE_PID_YOU_FOUND
```

to abruptly stop the service.

The bot should restart almost immediately, which you can check by tailing the log, running `./bin/app-loud-bot status` or simply interacting with the bot within Team-One.

Now if you run `./bin/app-loud-bot pid` again, you should see that the process ID of the app has changed (because we had to launch a new process).


The daemon script supports many other commands.  Run

```bash
./bin/app-loud-bot help
```

for more information.

## REST Client (non-tunnelled)

For your convenience, a REST API client is provided to support direct (non-tunnelled) REST API interactions.

The client is instantiated in the `launch_bot` method, and is available as `baseBot.rest_client`.

For example, to fetch the list of users in a given workspace:

```js
loudBot.rest_client.getWorkspaceMembers(orgId, workspaceId, function(err, json) {
  console.log("Here is a list of workspace members",json);
});
```

See the [Intellinote Client](https://github.com/intellinote/intellinote-client) documentation for details.

## Temporarily Ignoring Users

When two or more bots interact, it is not unusual to get into an endless loop scenario, with each bot responding to the other indefinitely. To break out of such a loop, one bot must stop responding to the other, breaking the chain.

If you suspect your bot is caught in such a loop you can use:

```js
loudBot.ignore(workspaceId, userId, durationInSeconds);
```

to automatically ignore any `rtm/message`, `rtm/note` or `rtm/user_typing` events associated with the given user and workspace, for the given duration.  These events will not be emitted (for that user and workpace) during that period.

Note the `durationInSeconds` parameter is optional, it defaults to the value of configuration parameter `ignore-duration-seconds` which in turn defaults to 60 seconds.

The `stop_ignoring(workspaceId, userId)` method can be used to stop ignoring a user before the "natural" time-out.

## Licensing

Unless otherwise noted, all code and documentation in this module is made available
under an [MIT License](http://opensource.org/licenses/MIT).

For details, please see the file [LICENSE.txt](LICENSE.txt) in the root
directory of this module.
