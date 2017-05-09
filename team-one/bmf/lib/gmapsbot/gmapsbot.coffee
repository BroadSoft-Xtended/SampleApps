#-------------------------------------------------------------------------------
path          = require 'path'
HOMEDIR       = path.join(__dirname,'..','..')
LIB_DIR       = path.join(HOMEDIR,'lib')
BaseBot       = require(path.join(LIB_DIR,"base-bot")).BaseBot
#-------------------------------------------------------------------------------
RE_AT_MENTION = /^@[A-Z0-9]+$/i
RE_MAP        = /^map$/i
RE_OF         = /^of$/i
RE_DIRECTIONS = /^dir(ections?)?$/i
RE_FROM       = /^f(r(om)?)?$/i
RE_TO         = /^to?$/i

class Gmapsbot extends BaseBot

  constructor:(@api_key)->
    super(name:"Gmapsbot")
    config       = require('inote-util').config.init()
    @api_key     ?= config.get("gmapsbot:team-one-api-key")  \
                  ? config.get("gmapsbot:api-key")           \
                  ? config.get("team-one-api-key")           \
                  ? config.get("team_one_api_key")           \
                  ? config.get("teamoneapikey")              \
                  ? config.get("api-key")                    \
                  ? config.get("api_key")                    \
                  ? config.get("apikey")

  # launch the bot, requesting messages from one-on-one workspaces
  # or that @mention me directly
  launch_bot:(api_key = @api_key)=>
    filters = [ "at_me=true" ]
    super api_key, filters

  # Handle a chat message delivered by the RTM API.
  # Performs a rudimentary parse of the input, looking for patterns like:
  #    directions to <place>
  #    directions from <place>
  #    directions to <place> from <place>
  #    directions from <place> to <place>
  #    map of <place>
  # When found, a link the corresponding Google map is posted.
  # Otherwise a simple help message is posted.
  on_rtm_message:(payload, flags)=>
    response_text = null
    # ignore messages I've sent (to avoid an endless reply loop).
    # Also ignore anything that is hidden, not a message or not
    # directed at me (although since our filter is `at_me=true`
    # these checks should be redundant).
    if payload.type is "message" and (not payload.hidden) and (not payload.from_me) and payload.at_me
      parts = payload?.text?.split?(" ")
      if RE_AT_MENTION.test parts[0] # skip leading @mention if any
        parts.shift()
      if RE_MAP.test(parts[0])  # MAP
        parts.shift()
        if RE_OF.test(parts[0]) # ...OF...
          parts.shift()
        rest = parts.join(" ")  # <PLACE>
        link = "https://maps.google.com?q=#{encodeURIComponent(parts)}"
        response_text = "Here's your [map of #{rest.toUpperCase()}](#{link})."
      else if RE_DIRECTIONS.test(parts[0]) # DIRECTIONS
        place = []
        current_part = "to"
        places = {}
        parts.shift()
        while parts.length > 0
          if RE_FROM.test(parts[0])
            if place.length > 0
              places[current_part] = place.join(" ")
            current_part = "from"
            place = []
            parts.shift()
          else if RE_TO.test(parts[0])
            if place.length > 0
              places[current_part] = place.join(" ")
            current_part = "to"
            place = []
            parts.shift()
          else
            place.push(parts.shift())
        if place.length > 0
          places[current_part] = place.join(" ")
        if places.from? or places.to?
          link = "https://maps.google.com?"
          response_text = "Here are your [DIRECTIONS"
          if places.from?
            response_text += " FROM #{places.from.toUpperCase()}"
            link += "&saddr=#{encodeURIComponent(places.from)}"
          if places.to?
            response_text += " TO #{places.to.toUpperCase()}"
            link += "&daddr=#{encodeURIComponent(places.to)}"
          response_text += "](#{link})."
      response_text ?= "Sorry, I didn't understand that. Try `map of <place>` or `directions [from <place>] to <place>`."
      @post_chat_to_team_one payload, response_text

  # post given response_text to Team-One.
  # where approriate @screen_name is prefixed to messages
  post_chat_to_team_one:(payload, response_text)->
    @reply payload, response_text

  print_help:()=>
    console.log """
      USE:
        gmapsbot TEAM_ONE_KEY
      or
        api_key=TEAM_ONE_KEY gmapsbot
      or
        NODE_ENV=THE_ENV gmapsbot
    """

  main:()=>
    unless @api_key?
      console.error "ERROR: Missing API key."
      @print_help()
      process.exit(1)
    else
      @launch_bot(@api_key)

# when this file is executed directly, invoke Gmapsbot.main
if require.main is module
  (new Gmapsbot(process.argv[2])).main()
