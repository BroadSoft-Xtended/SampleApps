var https                = require("https");
var path                 = require("path");
var WebSocket            = require("ws");

const START_HOST           = "app.intellinote.net";
const START_PATH           = "/rest/v2/rtms/start?event_type=message&from_me=false&at_me=true&or_matching=%2F(%5E%7C%5Cs)%5C%2F((math))(%5Cs%7C%24)%2Fi";

const FILENAME             = path.basename(__filename);

module.exports = {
  config: {},
  ws: {},

  test: function test() {
    console.log('Your test is working :)');
  },

  init: function init (config) {
    module.exports.config = config;
  },

  incomingMessage: {},

  handleChatMessage: function handleChatMessage(payload) {
    // console.log("PAYLOAD", payload);
    // We first confirm that module.exports is a new chat message.
    module.exports.config.orgId = payload.org_id;
    module.exports.config.workspaceId = payload.workspace_id;

    if (payload.type === "message" && !payload.hidden) {
      console.log('Incoming Message', payload.text);

      var user = {
        userId: payload.user,
        orgId: payload.org_id,
        workspaceId: payload.workspace_id
      }

      module.exports.incomingMessage(payload.text.toString(), user);
    }
  },

  reply: function reply (messageText) {
    var message = {
      type         : "message",
      org_id       : module.exports.config.orgId,
      workspace_id : module.exports.config.workspaceId,
      text         : messageText
    }
    // ...and send it to the server.
    module.exports.ws.send(JSON.stringify(message));
  },

  launchBot: function launchBot(config) {
    module.exports.init(config);

    var api_key = module.exports.config.apiKey;
    var org_id = module.exports.config.orgId;
    // We start a session by grabbing the WSS URL.
    module.exports.getWSSUrl(function(err, url) {
      if (err) {
        console.error('Error occured', err);
        process.exit(1);
      } else {
        // We can use that URL to create a new `WebSocket` client.
        module.exports.ws = new WebSocket(url);
        // The `open` event is fired once the websocket connection has
        // been established.
        module.exports.ws.on("open", function() {
          console.log("WS connection established.");
        });
        // The `message` event is fired whenever the client receives a
        // payload from the server.
        module.exports.ws.on("message", function (data, flags) {
          // The RTM API payloads are always JSON, so let's parse the data as JSON.
          var json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            /* ignored */
          }
          // Assuming we have a JSON payload...
          if (json) {
            // ...we take a different action based on the payload's `type` attribute.
            switch (json.type) {
              // The first thing the server sends is `hello`.
              case "hello":
                console.log("RTM session started.");
                break;
              // The server sends `goodbye` if it is closing the socket connection.
              case "goodbye":
                console.log("The server said \"goodbye\" so I'm shutting down.")
                process.exit(0);
                break;
              // The server sends a `message` payload when a new chat message
              // is created (or one is edited or deleted).
              case "message":
                module.exports.handleChatMessage(json);
                break;
              // We'll just ignore any other payloads.
              default:
                break;
            } // end switch(type)
          } // end if(json)
        }); // end on(message)
      } // end url check
    }); // end getWSSUrl
  }, // end of launchBot

  getWSSUrl: function getWSSUrl(callback) {
    // We'll submit a GET request to `/rtms/{ORG_ID}/start`
    // (injecting the given `org_id` value) and include an
    // `Authorization` header containing the given `api_key`.
    var requestOptions  = {
      method: "GET",
      host: START_HOST,
      path: START_PATH,
      headers: {
        Authorization: "Bearer " + module.exports.config.apiKey
      }
    };

    var handler = function(response) {
      if (!/^2[0-9]{2}$/.test(response.statusCode.toString())) {
        callback(new Error("Expected 2xx-series status code, found "+response.statusCode+"."))
      } else {
        var body = "";
        response.on("data", function(chunk) { body += chunk; });
        response.on("end", function() {
          try {
            var json = JSON.parse(body);
            callback(null, json.href);
          } catch (error) {
            console.log('ERROR: ', error);
            callback(error);
          }
        });
      }
    }
    // Finally let's submit the actual request.
    https.request(requestOptions, handler).end();
  } // end of getWSSUrl
}
