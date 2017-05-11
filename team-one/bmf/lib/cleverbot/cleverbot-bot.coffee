#-------------------------------------------------------------------------------
path                      = require 'path'
HOMEDIR                   = path.join(__dirname,'..','..')
LIB_DIR                   = path.join(HOMEDIR,'lib')
#-------------------------------------------------------------------------------
BaseBot                   = require(path.join(LIB_DIR,"base-bot")).BaseBot
https                     = require("https")
#-------------------------------------------------------------------------------

class CleverbotBot extends BaseBot

  constructor:(@team_one_api_key, @cleverbot_api_key)->
    super(name:"Cleverbot")
    @config.fetch_screen_name = true
    @cleverbot_state_by_uname = {} # holds the cb conversation state by user
    @ignore_count = 0 # number of messages to ignore
    config                    = require('inote-util').config.init()
    @team_one_api_key         ?= config.get("cleverbot:team-one-api-key")  \
                              ? config.get("cleverbot:api-key")            \
                              ? config.get("team-one-api-key")             \
                              ? config.get("team_one_api_key")             \
                              ? config.get("teamoneapikey")                \
                              ? config.get("api-key")                      \
                              ? config.get("api_key")                      \
                              ? config.get("apikey")
    @cleverbot_api_key        ?= config.get("cleverbot:cleverbot-api-key") \
                              ? config.get("cleverbot-api-key")            \
                              ? config.get("cleverbot_api_key")            \
                              ? config.get("cleverbotapikey")
    @cleverbot_host           = config.get("cleverbot:host") ? "www.cleverbot.com"
    @cleverbot_protocol       = config.get("cleverbot:protocol") ? "https"
    @cleverbot_path           = "/getreply?key=#{@cleverbot_api_key}&input="
    if @cleverbot_protocol is "http"
      https = require "http"

  # launch the bot, requesting messages from one-on-one workspaces
  # or that @mention me directly
  launch_bot:(api_key = @api_key)=>
    super api_key, ["at_me=true" ]

  # Handle a chat message delivered by the RTM API.
  # When relevant, submits message text to Cleverbot server,
  # parses response, then posts reponse back to Team-One.
  on_rtm_message:(payload, flags)=>
    # ignore messages I've sent (to avoid an endless reply loop).
    # Also ignore anything that is hidden, not a message or not
    # directed at me (although since our filter is `at_me=true`
    # these checks should be redundant).
    if payload.type is "message" and (not payload.hidden) and (not payload.from_me) and payload.at_me
      # if I'm currently ignoring messages, decrement the counter and exit
      if @ignore_count > 0
        @ignore_count--
        @log "IGNORED. #{@ignore_count} left to ignore."
      else
        # otherwise parse the message to check for our special commands
        parts = payload?.text?.split?(" ")
        # test for '@me IGNORE <N>'
        if parts.length is 3 and parts[1] is 'IGNORE' and parseInt(parts[2]) > 0
          @ignore_count = Util.to_int(parts[2])
          text = "Ok #{payload.given_name}, ignoring #{@ignore_count} message"
          if @ignore_count > 1
            text += "s"
          text += "."
          @post_chat_to_team_one payload, text, ()->undefined
        # test for '@me TELL @<USER> <MESSAGE>'
        else if parts[1] is 'TELL' and /^@/.test(parts[2])
          text = "OK #{payload.given_name}: #{parts[2...].join(" ")}"
          @post_chat_to_team_one payload, text, ()->undefined
        else
          # otherwise post to cleverbot and handle the response
          @submit_to_cleverbot payload.text, @cleverbot_state_by_uname[payload?.user], (err, response)=>
            if err?
              @error "ERROR WHEN SUBMITTING TO CLEVERBOT",err,JSON.stringify(response ? "")
              response ?= {}
              response.clever_output ?= "Oops, an error occured while invoking the upstream CleverBot API: #{err}."
            if response?.cs? and payload?.user? # if cleverbot returned a state object, save it
              @cleverbot_state_by_uname ?= {}
              @cleverbot_state_by_uname[payload.user] = response.cs
            response ?= {}
            response.clever_output ?= "Strange. The upstream CleverBot API did not respond."
            @post_chat_to_team_one payload,  response.clever_output

  # post the specified `text` (and optional conversation state) to
  # cleverbot and callback with the reply.
  # callback signature: (err, cleverbot_response)
  submit_to_cleverbot:(text, cs, callback)=>
    # strip the @cleverbot text because it is gibberish to the actual cleverbot
    text = @replace_my_screen_name(text,"",false) # replace the first instance of @cleverbot with nothing
    text = @replace_my_screen_name(text,"Cleverbot") # replace all other instances with `Cleverbot`.
    # prepare the cleverbot REST API call
    request_options  = {
      method: "GET"
      host: @cleverbot_host
      path: @cleverbot_path + encodeURIComponent(text)
    }
    if cs?
      request_options.path += "&cs="+encodeURIComponent(cs)
    # callback that handles the cleverbot REST API call
    handler = (response)=>
      unless /^2[0-9]{2}$/.test(response?.statusCode?.toString())
        callback new Error("Expected 2xx-series status code, found "+response?.statusCode+".")
      else
        body = ""
        response.on "data",(chunk)=>
          body += chunk
        response.on "end", ()=>
          try
            @debug "Cleverbot API replied:", body
            json = JSON.parse(body)
            callback null, json
          catch e
            callback(e)
    # actually sumbit the cleverbot REST API call
    @debug "Submitting to cleverbot API:", JSON.stringify(request_options)
    https.request(request_options, handler).end()

  # post given response_text to Team-One.
  # where approriate @screen_name is prefixed to messages
  # TODO: extract the @screen_name logic into BaseBot (but make it optional)
  post_chat_to_team_one:(payload, response_text)->
    @reply payload, response_text

  print_help:()=>
    console.log """
      USE:
        cleverbot-bot TEAM_ONE_KEY CLEVERBOT_KEY
      or
        api_key=TEAM_ONE_KEY cleverbot_api_key=CLEVERBOT_KEY cleverbot-bot
      or
        NODE_ENV=THE_ENV cleverbot-bot
    """

  # kick off the bot
  main:(argv)=>
    unless @team_one_api_key? and @cleverbot_api_key?
      console.error "ERROR: Missing one or more API keys."
      @print_help()
      process.exit 1
    else
      @launch_bot(@team_one_api_key)

# when this file is executed directly, invoke CleverbotBot.main
if require.main is module
  (new CleverbotBot(process.argv[2],process.argv[3])).main()
