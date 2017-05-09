https                = require "https"
WebSocket            = require "ws"

class BotkitWorker

  constructor:(@botkit,@config)->
    @type = @config.type ? "team-one-bot"
    @config ?= {}
    @identity = @config.identity ? {}
    @identity.id ?= null
    @identity.name ?= ""
    @botkit.on "message_received", @_on_message_received

  #### Botkit Functions

  startRTM:()=>
    @_launch(@config)
    return this

  # TODO support re-configure of access token here
  configureRTM:()=>
    return this

  # TODO actual close rtm client here
  closeRTM:(err)=>
    return this

  destroy:()=>
    @closeRTM()
    @botkit.shutdown()
    return this

  send:(message,cb)=>
    message.type ?= "message"
    @ws.send JSON.stringify(message)
    if message.attachments?
      for attachment in message.attachments
        if typeof attachment is 'object' and not Buffer.isBuffer(attachment)
          attachment = JSON.stringify(attachment)
        unless Buffer.isBuffer(attachment)
          attachment = new Buffer(attachment)
        @_post_file message, attachment
    cb?()
    return this

  say:(message,cb)=> #botkit overrides this anyway
    return @send(message,cb)

  reply:(src, resp, cb)=>
    if typeof resp is 'string'
      resp = { text: resp }
    resp.type ?= "message"
    resp.channel ?= src.channel
    @say resp, cb
    return this

  replyWithQuestion:(message,question,cb)=>
    return @reply message, question, cb

  # TODO what about these?
  #replyAcknowledge:(cb)
  replyPublic:(src, resp, cb)=>@reply(src,resp,cb)
  replyPublicDelayed:(src, resp, cb)=>@reply(src,resp,cb)
  replyPrivate:(src, resp, cb)=>@reply(src,resp,cb)
  replyPrivateDelayed:(src, resp, cb)=>@reply(src,resp,cb)
  replyInteractive:(src, resp, cb)=>@reply(src,resp,cb)

  # TODO reply then later edit text
  #replyAndUpdate = function(src, resp, cb)

  startTyping:(src)=>
    return @reply src, {type:'typing'}

  replyWithTyping:(src, resp, cb)=>
    if typeof resp is 'string'
      resp = { text: resp }
    typing_delay = (1200/60) * (resp?.text?.length ? 1)
    if typing_delay > 2000
      typing_delay = 2000
    setTimeout (()=>@reply(src,resp,cb)), typing_delay
    return @startTyping src

  identifyBot:(cb)=>
    data = null
    if @identity?
      data = {}
      data.name = @identity.name
      data.id = @identity.id
      data.team_id = @identityTeam()
    cb?(null, data)
    return data

  identifyTeam:(cb)=>
    id = @team_info?.id ? "Unknown Team!"
    cb?(null,id)
    return id

  configureIncomingWebhook:()=>
    return this

  sendWebhook:()=>
    return this

  startConversation:(message, cb)=>
    @botkit.startConversation(this,message, cb)
    return this

  createConversation:(message, cb)=>
    @botkit.createConversation(this,message, cb)
    return this

  # "This handles the particulars of finding an existing conversation or topic to fit the message into."
  findConversation:(message,cb)=>
    if typeof message is 'string'
      message = JSON.parse(message)
    for task in (@botkit.tasks ? [])
      if typeof task.source_message is 'string'
        task.source_message = JSON.parse(task.source_message)
      for convo in (task.convos ? [])
        if typeof convo.source_message is 'string'
          convo.source_message = JSON.parse(convo.source_message)
        if convo.isActive() and convo.source_message.user is message.user and convo.source_message.channel is message.channel
          cb?(convo)
          return this # break out and skip the final cb
    cb?()
    return this

  startPrivateConversation:(message, cb)=>
    org_id = message?.org_id
    unless org_id?
      org_id = message?.channel?.split(/\//)?[0]
      if /^[0-9]+$/.test org_id
        org_id = parseInt(org_id)
    # send an empty message via rest api to discover and/or create the 1-on-1 workspace
    payload = {
      type:"rest/request"
      method:"POST"
      path:"/org/#{org_id}/user/#{encodeURIComponent(message?.user)}/message"
      body: {
        "body": ""
      }
      id: "dm#{Math.random()*10000}ts#{Date.now()}"
    }
    @ws.send JSON.stringify(payload)
    # once we ge the response back we can start the conversation
    @_listen_for_reply_to payload.id, (response)=>
      if response.status is 201
        message.org_id = org_id
        message.workspace_id = response?.body?.chat_id
        message.channel = "#{message.org_id}/#{message.workspace_id}"
        @startConversation message, cb
      else
        cb?(new Error("Unable to identify or create 1-on-1 workspace (status=#{response.status})"))

   #### Utilities and "private" functions

  _launch:(config)=>
    @_get_wss_url config.token, (err, url)=>
      @ws = new WebSocket(url)
      @ws.on "open", ()=>
        @botkit.startTicking()
      @ws.on "message", (data, flags)=>
        json = JSON.parse(data)
        if json?.reply_to?
          listener = @_reply_to_listeners[json.reply_to]
          if listener?
            delete @_reply_to_listeners[json.reply_to]
            listener(json)
        if json.type is "hello"
          @botkit.trigger('rtm_open', [this])
        else if json.type is "message"
          @botkit.receiveMessage this, json
        else
          @botkit.trigger json.type, [this, json.text]

  _reply_to_listeners:{}

  _on_message_received:(bot, message)=>
    console.log "_on_message_received", message
    if message.type is "message" and message.subtype is "message_added" and not message.from_me
      message.event = "ambient"
      if message.at_me
        message.event = "direct_mention"
      else if message.at_us
        message.event = "mention"
      console.log "TRIGGERING", message
      @botkit.trigger message.event, [bot, message]


  _listen_for_reply_to:(id, callback)=>
    @_reply_to_listeners[id] = callback

  _get_wss_url:(api_key,cb)=>
    requestOptions  = {
      method: "GET",
      host: "app.intellinote.net",
      path: "/rest/v2/rtms/start",
      headers: {
        Authorization: "Bearer " + api_key
      }
    }
    handler = (response)->
      unless /^2[0-9]{2}$/.test response.statusCode.toString()
        cb(new Error("Expected 2xx-series status code, found #{response.statusCode}."))
      else
        body = ""
        response.on "data", (chunk)->body += chunk
        response.on "end", ()->
          try
            json = JSON.parse(body)
            cb null, json.href
          catch e
            cb e
    https.request(requestOptions, handler).end()


  # invoked by @send to upload a file
  # `src` -  the source message, from which org/ws-id are determined
  # `buffer` - the file contents as a buffer
  # TODO support client-specified file name and mime-type
  _post_file:(src, buffer, cb)=>
    org_id = src?.org_id
    ws_id = src?.org_id
    unless org_id? and ws_id?
      parts = src?.channel?.split(/\//)
      org_id ?= parts?[0]
      if /^[0-9]+$/.test org_id
        org_id = parseInt(org_id)
      ws_id ?= parts?[1]
      if /^[0-9]+$/.test ws_id
        ws_id = parseInt(ws_id)
    payload = {
      type:"rest/request"
      method:"POST"
      path:"/org/#{org_id}/workspace/#{ws_id}/file"
      body: {file:"data:application/octet-stream;base64,"+buffer.toString("base64")}
      id: "pf#{Math.random()*10000}ts#{Date.now()}"
    }
    @ws.send JSON.stringify(payload)
    @_listen_for_reply_to payload.id, (response)=>
      if response.status is 201
        cb?(null)
      else
        cb?(new Error("Unable to post file (status=#{response.status})"))


Botkit = require("botkit")
CoreBot = Botkit.core
Botkit.teamonebot = (config)->
  bot = new CoreBot(config ? {})
  bot.defineBot BotkitWorker
  return bot

exports.Botkit = Botkit
exports.TeamOneBot = exports.TeamoneBot = exports.team_one_bot = exports.teamonebot = Botkit.teamonebot
