# A simple CoffeeScript-based example of using the bot management framework.

path        = require 'path'
HOMEDIR     = path.join(__dirname,'..','..')
LIB_DIR     = path.join(HOMEDIR,'lib')
BaseBot     = require(path.join(LIB_DIR,"base-bot")).BaseBot

class BasicBot extends BaseBot

  constructor:()->
    super(name:"BasicBotCoffee")

  on_rtm_message:(payload, flags)=>
    @reply payload, "This bot is just an example. It doesn't actually do anything."

  launch_bot:(api_key)=>
    super api_key, "at_me=true"

  main:(argv)=>
    api_key = argv?[2] ? process.env["api_key"] ? process.env["API_KEY"]
    unless api_key?
      console.error """
        ERROR: API Key is missing.
          use: [debug=true] basic-bot-coffee <API-KEY>
           or: [debug=true] api_key=<API-KEY> basic-bot-coffee
      """
      process.exit(1)
    else
      @launch_bot(api_key)

if require.main is module
  (new BasicBot()).main(process.argv)
