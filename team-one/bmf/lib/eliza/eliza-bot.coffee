path    = require 'path'
HOMEDIR = path.join(__dirname,'..','..')
LIB_DIR = path.join(HOMEDIR,'lib')
Eliza   = require(path.join(LIB_DIR,"eliza","eliza"))
BaseBot = require(path.join(LIB_DIR,"base-bot")).BaseBot

# Wraps a simple implementation of Eliza (via isaacs/node-elizabot's IRC
# chatbot) with Team-One bot.
#
# Note that:
#
#  1. Every user has an independent conversation with Eliza. (Each is a distinct
#     instance of the Eliza handler.)
#
#  2. That conversation (currently) ignores workspace and org boundaries, so if
#     you say something in your private workspace eliza may parrot it back to
#     you in the Meeting Room workspace (if you message Eliza there, she only
#     replies in the workspace you messaged her from).
#
class ElizaBot extends BaseBot

  constructor:(@api_key)->
    super(name:"Eliza")
    @sessions = {} # holds Eliza instance for each user
    config   = require('inote-util').config.init()
    @api_key ?= config.get("eliza:team-one-api-key")  \
              ? config.get("eliza:api-key")            \
              ? config.get("team-one-api-key")         \
              ? config.get("team_one_api_key")         \
              ? config.get("teamoneapikey")            \
              ? config.get("api-key")                  \
              ? config.get("api_key")                  \
              ? config.get("apikey")

  # Handle a chat message delivered by the RTM API.
  # when relevant, sends chat message text to
  # eliza and posts the response back to Team-One
  on_rtm_message:(payload, flags)=>
    if payload.type is "message" and (not payload.hidden)
      if not payload.from_me and payload.at_me
        session = @sessions[payload.user]
        unless session?
          session = new Eliza()
          @sessions[payload.user] = session
        response_text = session.transform(payload.text)
      if payload.screen_name? and not payload.workspace_1on1
        response_text = "@#{payload.screen_name} #{response_text}"
      if session.quit
        response_text += "\n" + session.getFinal()
        delete sessions[payload.user]
      @reply payload, response_text

  launch_bot:(api_key)=>
    filters = "at_me=true"
    super api_key, filters

  print_help:()=>
    console.log """
      USE:
        eliza-bot TEAM_ONE_KEY
      or
        api_key=TEAM_ONE_KEY eliza-bot
      or
        NODE_ENV=THE_ENV eliza-bot
    """

  main:()=>
    unless @api_key?
      console.error "ERROR: Missing API key."
      @print_help()
      process.exit(1)
    else
      @launch_bot(@api_key)

if require.main is module
  (new ElizaBot(process.argv[2])).main()
