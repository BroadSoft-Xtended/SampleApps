# Use Botkit to create (or port) bots for Team-One

This module contains an (experimental) [Botkit](https://github.com/howdyai/botkit) connector for [Team-One (Intellinote)](https://www.intellinote.net/).

Using this module, it is trivial to "port" many Botkit-based bots to Team-One.

Specifically, rather than using the lines:

```js
var Botkit = require('botkit');
var controller = Botkit.slackbot({ debug: false});
```

to instantiate your Botkit bot, you'll use:

```js
var Botkit = require('botkit');
require("botkit-teamone")
var controller = Botkit.teamonebot({ debug: false});
```

That's it.

At this stage there are a few Slack-specific features not (yet) fully represented in the "teamonebot" connector, but otherwise Team-One can act as a drop-in replacement for Slack in your bot implementation.

For more information, this introduction to the [Team-One Real-Time / Bot API](https://app.intellinote.net/rest/content/rtm-how-to)

## Creating your bot

1) Create a "bot user" within Team-One / Intellinote. (Or use your existing account to create a bot that acts as "you".)

2) Create an API token for that user at <https://app.intellinote.net/rest/account/api-tokens>.

3) Pass that token to the Botkit `spawn` method when launching your bot:

   ```js
   controller.spawn({ token: MY_API_TOKEN });
   ```

## Non-Botkit bots

The Team-One [Real-Time Messaging API](https://app.intellinote.net/rest/content/rtm-how-to) is a simple but powerful websocket-based API that supports not only chat messages, but the full scope of the Team-One collaboration and workflow management functionality.

See [..tk...](#) for examples of creating bots directly with the Team-One API.
