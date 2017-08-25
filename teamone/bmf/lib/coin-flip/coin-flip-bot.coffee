path        = require 'path'
HOMEDIR     = path.join(__dirname,'..','..')
LIB_DIR     = path.join(HOMEDIR,'lib')
BaseBot     = require(path.join(LIB_DIR,"base-bot")).BaseBot

# Simple /slash-command bot that responds to `/flip` etc.
# by flipping a virtual coin and posting the result as a
# chat message.
class CoinFlipBot extends BaseBot

  constructor:(@api_key)->
    super(name:"CoinFlip")
    @flip_stats = {
      coins_flipped : 0    # total flips
      times_heads   : 0    # number heads
      times_tails   : 0    # number tails
      streak_value  : null # last value that came up
      streak_count  : 0    # number of times in a row
    }
    config       = require('inote-util').config.init()
    @api_key     ?= config.get("coin-flip:team-one-api-key")  \
                  ? config.get("coin-flip:api-key")           \
                  ? config.get("team-one-api-key")            \
                  ? config.get("team_one_api_key")            \
                  ? config.get("teamoneapikey")               \
                  ? config.get("api-key")                     \
                  ? config.get("api_key")                     \
                  ? config.get("apikey")
    @heads_emoji = config.get("coin-flip:heads-emoji") ? "🙂  "
    @tails_emoji = config.get("coin-flip:tails-emoji") ? "🙃  "

  # launch the bot, listening for messages like `HELP`, `/flip-coin` etc
  launch_bot:(api_key = @api_key)=>
    super api_key, "matching="+encodeURIComponent("/((help)|(\/((coin-?flip)|(flip(-?coin)?))))(\s|$)/i")

  # Handle a chat message delivered by the RTM API.
  # When relevant, flips coin and posts results as
  # a chat message in TEam-oNe.
  on_rtm_message:(payload, flags)=>
    if payload.type is "message" and (not payload.hidden)
      response = null
      # if the message is directed at me and contains `HELP`, reply back
      if /(\s|^)HELP(\s|$)/i.test(payload.text)
        if (not payload.from_me) and payload.at_me
          response = "@#{payload.screen_name} post a chat message containing `/coinflip`, `/flip` or similiar and I'll flip a virtual coin for you and post the results."
        else
          response = null
      else
        # if the message contains the slash-command, flip coin and reply.
        # note that this relies on the filter defined in `launch_bot` to
        # test that the message is one that is actually relevant.
        response = @describe_flip(payload.screen_name,@flip_coin(),@flip_stats)
      if response?
        @reply payload, response

  # flip a coin, update stats, return coin (as `1` for heads or `0` for tails)
  flip_coin:()=>
    coin = Math.round(Math.random())
    @flip_stats.coins_flipped++
    if coin is 1
      @flip_stats.times_heads++
    else
      @flip_stats.times_tails++
    if coin is @flip_stats.streak_value
      @flip_stats.streak_count++
    else
      @flip_stats.streak_count = 1
      @flip_stats.streak_value = coin
    return coin

  # return a humanized version of
  #  <number> <noun>
  # in a moderately clever way
  pluralize:(count, singular, plural)=>
    plural ?= singular + "s"
    number = count
    switch number
      when  0
        number = "zero"
      when  1
        number = "one"
      when  2
        number = "two"
      when  3
        number = "three"
      when  4
        number = "four"
      when  5
        number = "five"
      when  6
        number = "six"
      when  7
        number = "seven"
      when  8
        number = "eight"
      when  9
        number = "nine"
      when 10
        number = "ten"
      when 11
        number = "eleven"
      when 12
        number = "twelve"
    if count is 1
      return "#{number} #{singular}"
    else
      return "#{number} #{plural}"

  # generate a message describing the results of the coint flip
  describe_flip:(at_user, coin)=>
    message = ""
    if at_user?
      message += "#### @#{at_user} "
    message += "Your coin came up "
    if coin
      face = "heads"
      message += "**#{@heads_emoji} HEADS**."
    else
      face = "tails"
      message += "**#{@tails_emoji} TAILS**."
    if @flip_stats?
      if @flip_stats.streak_count > 1
        message += "\n**That makes #{@pluralize(@flip_stats.streak_count,face,face)} in a row.**"
      message += "\nI've flipped a coin #{@pluralize(@flip_stats.coins_flipped,'time')}."
      message += "\nHeads has come up #{@pluralize(@flip_stats.times_heads,'time')}."
      message += "\nTails has come up #{@pluralize(@flip_stats.times_tails,'time')}."
    return message

  print_help:()=>
    console.log """
      USE:
        coin-flip-bot TEAM_ONE_KEY
      or
        api_key=TEAM_ONE_KEY coin-flip-bot
      or
        NODE_ENV=THE_ENV coin-flip-bot
    """

  main:(argv)=>
    unless @api_key?
      console.error "ERROR: Missing API key."
      @print_help()
      process.exit(1)
    else
      @launch_bot(@api_key)

# when this file is executed directly, invoke CoinFlipBot.main
if require.main is module
  (new CoinFlipBot(process.argv[2])).main()
