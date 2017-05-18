#-------------------------------------------------------------------------------
# Base Imports
#-------------------------------------------------------------------------------
LogUtil                = require('inote-util').LogUtil
Util                   = require('inote-util').Util
WebSocket              = require 'ws'
EventEmitter           = require 'events'
IntellinoteClient      = require("intellinote-client").IntellinoteClient
https                  = require 'https'
#-------------------------------------------------------------------------------

# "Abstract" base class to extend when creating Team-One bots.
#
# Provides convenience methods to simplify bot creation and some default
# behaviors like heartbeat (ping) and set-presence-to-online timers.
#
# Subclasses should implement `on_rtm_message`, probably invoking
# `reply` or `send_payload` at some point within it.
#
# Subclasses may hook into other methods to handle additional message types
# or provide other specialized behavior.  See comments below.
#
# Note that `log`, `debug` and `error` methods are provided for
# configuration-aware logging.  Subclasses should typically use that rather
# than `console.log` or `console.error` for most logging purposes.
#
# See `./basic/basic-bot.coffee` for a tiny example of extending this class
# to implement a bot.
#
# See the [README file](../README.md) for a long-winded description of how to
# extend this class.
#
class BaseBot extends EventEmitter

  constructor:(options)->
    @config = @_configure(options)
    @_register_internal_listeners()
    @_maybe_register_sigint_handler(@config)
    @_configure_logging(@config)
    @ignoring = {}
    @ping_count = 0
    if @config.start_protocol is "http"
      https = require 'http'

  # ignore the specified user within the specified workspace for
  # duration seconds.
  ignore:(workspace_id, user_id, duration_in_seconds)=>
    duration_in_seconds ?= @config.default_ignore_duration_seconds
    duration = duration_in_seconds*1000
    key = "#{workspace_id}|#{user_id}"
    ignore_until = Date.now()+duration
    @ignoring[key] = ignore_until
    stop_ignoring = ()=>
      if @ignoring[key] is ignore_until
        delete @ignoring[key]
    setTimeout(stop,duration)

  # stop ignoring the specified user within the specified
  # workspace, even if the previously defined duration has
  # not elapsed.
  stop_ignoring:(workspace_id, user_id)=>
    key = "#{workspace_id}|#{user_id}"
    delete @ignoring[key]

  # returns `true` if we should ignore the specified payload,
  # `false` otherwise.
  should_ignore:(payload)=>
    if payload.type in ["message","user_typing"]
      key = "#{payload.workspace_id}|#{payload.user}"
    else if payload.type is "note"
      key = "#{payload.workspace_id}|#{payload.note?.creator?.user_id ? payload.previous_note?.creator?.user_id}"
    if key?
      ignore_until = @ignoring[key]
      if ignore_until?
        if ignore_until >= Date.now()
          return true
        else
          delete @ignoring[key]
          return false
      else
        return false
    else
      return false

  # The REST client (`rest_client`) is automatically initialized in `launch_bot`,
  # but you can use this method to exert more control over the initialization
  # or to init and use the REST client before `launch_bot` is called.
  init_rest_client:(api_key,base_url,debug)=>
    # if a config map is passed as the first parameter rather than an api key,
    # use that instaed
    if api_key? and typeof api_key is "object" and (api_key.access_token? or api_key.api_key?) and not base_url? and not debug?
      config = api_key
      if config.api_key and not config.access_token
        config.access_token = config.api_key
        delete config.api_key
    else
      client_config = {
        access_token: api_key
        base_url: base_url ? "#{@config.start_protocol}://#{@config.start_host}:#{@config.start_port}/rest/v2"
        debug: debug ? false
      }
      @rest_client = new IntellinoteClient(client_config)

  # Connect to the RTM API with the given `api_key` (string) and
  # `filters` (string or array of strings). Once launched the
  # `@on_rtm_message` method will be invoked every time a
  # `message` payload is received from the RTM API.
  launch_bot:(api_key, filters)=>
    @log @Cg "Launching bot."
    @debug "Fetching WSS URL."
    unless @rest_client?
      @init_rest_client(api_key)
    @get_wss_url api_key, filters, (err, url)=>
      if err?
        @error "while fetching WSS URL:", err
        @error "can't establish WSS connection. Exiting"
        process.exit(2)
      else
        @debug "Fetched WSS URL:", url
        @debug @Cg "Opening websocket."
        @ws = new WebSocket(url)
        @ws.on "open", ()=>
          @emit "ws/open"
        @ws.on "close", (code, reason)=>
          @emit "ws/status", code, reason
        @ws.on "error", (err)=>
          @emit "ws/error", err
        @ws.on "message", (data, flags)=>
          @emit "ws/message", data,flags

  # Hits the `/rest/v2/rtms/start` endpoint to obtain a WSS URL
  # that can be used to initiate an RTM session.
  get_wss_url:(api_key,filters,callback)=>
    filters ?= []
    if typeof filters is 'string'
      filters = [filters]
    filters.push("event_type=message_added")
    filters.push("from_me=false")
    full_path = "#{@config.start_path}?#{filters.join('&')}"
    options = {
      method: "GET"
      host: @config.start_host
      path: full_path
      port: @config.start_port
      headers: {
        Authorization: "Bearer #{api_key}"
      }
    }
    handler = (response)->
      unless /^2[0-9]{2}$/.test "#{response?.statusCode}"
        callback new Error("Expected 2xx-series status code but found #{response?.statusCode}.")
      else
        body = ""
        response.on "data", (chunk)->
          body += chunk
        response.on "end", ()->
          try
            json = JSON.parse(body)
            callback(null, json.href)
          catch e
            callback e
    https.request(options, handler).end()

  # Invoked (via `@launch_bot`) when the websocket is first connected.
  on_ws_open:()=>
    @log @Cg "Websocket connection established."

  # Invoked (via `@launch_bot`) when the websocket is closed.
  on_ws_close:(code,reason)=>
    process.nextTick ()=> # allow other event listeners to run
      @log "Websocket connection closed (code=#{code},reason=#{reason}). exiting."
      @ws = null
      process.exit 0

  # Invoked (via `@launch_bot`) when an websocket error is encountered.
  on_ws_error:(err)=>
    @error "from websocket:",err

  # Invoked (via `@launch_bot`) when an websocket message is receieved.
  # Invokes `@on_hello`, `@on_ping`, @on_rtm_message`, etc. based on the
  # contents of the message.
  on_ws_message:(data,flags)=>
    json = null
    try
      json = JSON.parse(data)
    catch e
      # ignored
    (if json?.type is "message" then @log else @debug) @CM("Received via websocket:"),data
    if json?
      if @should_ignore json
        @debug "Ignoring:",json
      else
        switch json.type
          when "hello"
            @emit "rtm/hello", json, flags
          when "goodbye"
            @emit "rtm/goodbye", json, flags
          when "pong"
            @emit "rtm/pong", json, flags
          when "message"
            @emit "rtm/message", json, flags
          when "user_typing"
            @emit "rtm/user_typing", json, flags
          when "note"
            @emit "rtm/note", json, flags
          when "rest/response"
            @emit "rtm/rest/response", json, flags

  # Invoked (via `@on_ws_message`) when a `message` payload is delivered.
  # `json` will contain the JSON  payload that was receieved (in object, not string form).
  on_rtm_message:(json,flags)=>
    undefined

  # Invoked (via `@on_ws_message`) when a `note` payload is delivered.
  # `json` will contain the JSON  payload that was receieved (in object, not string form).
  on_rtm_note:(json,flags)=>
    undefined

  # Invoked (via `@on_ws_message`) when a `user_type` payload is delivered.
  # `json` will contain the JSON  payload that was receieved (in object, not string form).
  on_rtm_user_typing:(json,flags)=>
    undefined

  # Invoked (via `@on_ws_message`) when a `rest/response` payload is delivered.
  on_rtm_rest_response:(json,flags)=>
    if json.reply_to is @put_presence_id
      @put_presence_id = null
      @debug """
        Presence set to #{@config.presence_value}. \
        Round-trip latency #{@_format_duration(@put_presence_sent)}. \
        Repeating in #{@_format_duration(0,@config.presence_wait_millis)}.
      """

  # Invoked (via `@on_ws_message`) when the `hello` payload is delivered.
  on_rtm_hello:(json,flags)=>
    @log @CG "RTM session started."
    if @config.fetch_screen_name
      @fetch_screen_name()
    if @config.ping_wait_millis
      @send_ping()
    if @config.presence_wait_millis
      @put_presence()
      setInterval(@put_presence,@config.presence_wait_millis)

  # Invoked (via `@on_ws_message`) when the `pong` payload is delivered.
  # Logs the event then sets a timer to send the next `ping`
  on_rtm_pong:(json,flags)=>
    if @config.ping_wait_millis
      if json?.sent?
        latency_str = " Round-trip latency #{@_format_duration(json.sent)}."
      @debug """
        Got pong response.#{latency_str} \
        Repeating in #{@_format_duration(0,@config.ping_wait_millis)}.
      """
      setTimeout((()=>@send_ping()),@config.ping_wait_millis)

  # Invoked (via `@on_ws_message`) when the `goodbye` payload is delivered.
  on_rtm_goodbye:(json,flags)=>
    @log @CR "The server said \"goodbye\" so I'm shutting down."
    try
      @ws?.close?()
      @ws = null
    catch e
      # ignored
    process.exit 0

  # Updates my presence status by invoking a REST method thru the web socket.
  # TODO consider doing this via @rest_client instead?
  put_presence:()=>
    if @ws?
      payload = {
        type: "rest/request"
        method: "PUT"
        path: @config.presence_path
        body: {"presence":@config.presence_value}
        id: Util.uuid(null,true)
      }
      @put_presence_id = payload.id
      @put_presence_sent = Date.now()
      try
        @send_payload payload
      catch err
        @error "while posting presence:", payload, err

  # send a chat message containing `message` to a workspace or chat.
  #  - `reply_to` - the original payload we are responding to
  #  - `message`  - the text of the message to send
  #  - `options`  - an optional map of options.
  #                 recognized options include:
  #                   - `@mention` - auto (default), true, false (also recognized as `at_mention`)
  reply:(reply_to, message, options)=>
    reply_to ?= {}
    options ?= {}
    message ?= ""
    if reply_to.screen_name?
      if Util.truthy_string( options["@mention"] ? options["at_mention"] )
        message = "@#{reply_to.screen_name} #{message}"
      else if Util.falsey_string( options["@mention"] ? options["at_mention"] )
        message = message
      else unless reply_to.workspace_1on1
        message = "@#{reply_to.screen_name} #{message}"
    payload = {
      type         : "message"
      org_id       : reply_to.org_id
      workspace_id : reply_to.workspace_id
      text         : message
    }
    @send_payload payload

  send_typing:(org_id, workspace_id)=>
    # allow `org_id` to be a payload-like object
    if not workspace_id? and org_id?.org_id? and org_id?.workspace_id?
      workspace_id = org_id.workspace_id
      org_id = org_id.org_id
    payload = {
      type: "typing"
      org_id: org_id
      workspace_id: workspace_id
    }
    @send_payload(payload)

  # publish the given payload object to the web socket (then log it)
  send_payload:(payload)=>
    log = (if payload?.type is "message" then @log else @debug)
    if payload? and typeof payload isnt "string"
      payload = JSON.stringify(payload)
    log(@CB("Sending RTM payload via websocket:"), payload)
    @ws.send payload

  # Assuming @my_screen_name is populated, searches @my_screen_name
  # in `text` and replaces it with `replace_with` (defaults to `" "`).
  # when `replace_globally` is `true` (the default) all instances of
  # the screen name are replaced, otherwise only the first instance
  # is replaced.
  #
  # See `fetch_screen_name` and the `fetch_screen_name` configuration
  # parameter for more details.
  replace_my_screen_name:(text, replace_with=" ", replace_globally=true)=>
    replace_with ?= " "
    if text?
      if replace_globally and @my_screen_name_re_g?
        text = text.replace(@my_screen_name_re_g, replace_with)
      else if @my_screen_name_re
        text = text.replace(@my_screen_name_re, replace_with)
    return text

  # Use the (non-tunnelled) REST client to fetch the specified
  # user's profile.
  #  - `id`  - optional identifier for the user to fetch, which can be user_id,
  #            email address or the string `-`, indicating that the profile of
  #            the _current_ (bot) user should be fetched; defualts to `-`.
  #  - `callback` - callback method with the signature `(err, json)`
  #                 (where `json` contains the user info).
  #
  get_user:(id,callback)=>
    if typeof id is 'function' and not callback?
      callback = id
      id = null
    id ?= "-"
    if callback? # don't bother to make the call if the caller is not going to accept the data
      @debug "Using REST client to call GET /user/#{id}"
      @rest_client.get_user "-", (err, json, response, body)=>
        @debug "REST client to call to GET /user/#{id} yielded",err, response?.statusCode, JSON.stringify(json)
        if err?
          @error "Error during rest_client.get_user", err
        callback(err, json, response, body)
    else
      @warn "get_user call ignored because no callback method was provided."

  fetch_screen_name:(callback)=>
    @get_user "-", (err, json, response, body)=>
      if err?
        if callback?
          callback err
        else
          @warn "get_user yielded an error in fetch_screen_name but no callback was provided.", err
      else unless json?.screen_name?
        @warn "fetch_screen_name failed to return an object with a 'screen_name' attribute."
        callback? null, null
      else
        @my_user_id = json.user_id
        @my_screen_name = json.screen_name
        @my_screen_name_re   = new RegExp("@#{@my_screen_name} ?")
        @my_screen_name_re_g = new RegExp("@#{@my_screen_name} ?","g")
        callback? null, @my_screen_name

  # posts a `ping` payload to the websocket
  send_ping:()=>
    @send_payload {
      n:@ping_count++
      sent: Date.now()
      type:"ping"
    }

  # log the given message unless QUIET is set
  log:(message...)=>
    unless @config.quiet
      # LogUtil.tplog("\x1b[0;37m#{@botname}\x1b[1;37m",message...,"\x1b[0m")
      LogUtil.tplog("#{@botname}",message...)

  # log the given message if DEBUG is set
  debug:(message...)=>
    if @config.debug
      LogUtil.tplog("#{@botname}",message...)

  # log the given message to STDERR
  error:(message...)=>
    LogUtil.tperr("#{@botname}",@CR("ERROR"),message...)

  # log the given message to STDERR
  warn:(message...)=>
    LogUtil.tperr("#{@botname}",@CY("WARNNIG"),message...)

  # utility method for formatting a duration in millliseconds as seconds
  _format_duration:(millis,now)=>
    now ?= Date.now()
    if millis?
      val = "#{Math.round((now-millis)/100)/10}"
      unless /\./.test val
        val = "#{val}.0s"
      else
        val = "#{val}s"
      return val
    else
      return null

  _maybe_register_sigint_handler:(options)=>
    options ?= {}
    unless Util.falsey_string(options.sigint)
      process.on 'SIGINT', ()=>
        if @ws?
          try
            @log @Cr "Got interrupt signal (Ctrl-C). Sending goodbye payload."
            @send_payload({type:"goodbye"})
            setTimeout((()->process.exit()),6000)
          catch err
            # ignored
            process.exit(1)
        else
          process.exit()

  _register_internal_listeners:()=>
    for event in ["open","error","close","message"]
      @on "ws/#{event}", @["on_ws_#{event}"]
    for event in ["message","user_typing","note","rest/response","hello","pong","goodbye"]
      @on "rtm/#{event}", @["on_rtm_#{event.replace /\//g,'_'}"]

  _configure_logging:(options)=>
    options ?= {}
    if options.botname?
      @botname = "[#{options.botname}]"
    else
      @botname = ""
    unless Util.truthy_string(options.log_pid)
      LogUtil.tplog = LogUtil.tlog
      LogUtil.tperr = LogUtil.terr
    if Util.falsey_string(options.log_ts)
      LogUtil.tplog = console.log
      LogUtil.tperr = console.error
    # if use-color is set, the create color-wrapping methods
    if @config.use_color
      @Cg = (str)->"\x1b[0;32m#{str}\x1b[0m"
      @CG = (str)->"\x1b[1;32m#{str}\x1b[0m"
      @Cr = (str)->"\x1b[0;31m#{str}\x1b[0m"
      @CR = (str)->"\x1b[1;31m#{str}\x1b[0m"
      @Cb = (str)->"\x1b[0;34m#{str}\x1b[0m"
      @CB = (str)->"\x1b[1;34m#{str}\x1b[0m"
      @Cm = (str)->"\x1b[0;35m#{str}\x1b[0m"
      @CM = (str)->"\x1b[1;35m#{str}\x1b[0m"
      @Cy = (str)->"\x1b[0;33m#{str}\x1b[0m"
      @CY = (str)->"\x1b[1;33m#{str}\x1b[0m"
    else # else declare the equivalent methods as no-ops==
      for f in [ "Cg", "CG", "Cr", "CR", "Cb", "CB", "Cm", "CM", "Cy", "CY" ]
        @[f] = (x)->x

  _configure:(overrides, defaults)=>
    return @configure( require('inote-util').config.init( defaults, overrides ) )

  configure:(config)=>
    c = {}
    #-------------------------------------------------------------------------------
    # Compose the base REST method used to launch RTM session.
    # Other than changing `START_HOST` to point to a specific regional data-center
    # you probably don't need to modify any of these values.
    #-------------------------------------------------------------------------------
    c.start_protocol         = config.get("rtm:start:protocol") ? "https"
    c.start_host             = config.get("rtm:start:host")     ? "app.intellinote.net"
    c.start_port             = Util.to_int(config.get("rtm:start:port"))
    unless c.start_port?
      if c.start_protocol is 'https'
        c.start_port         ?= 443
      else
        c.start_port         ?= 80
    c.start_path             = config.get("rtm:start:path") ? "/rest/v2/rtms/start"
    #-------------------------------------------------------------------------------
    # Configure ping frequency (if any).  Defaults to around 30 seconds (but the
    # exact value is "fuzzed" to avoid unnecessary sychronization when launching
    # several bots simaltaneously). Set `PING_WAIT_MILLIS` to `0` or `false` to
    # disable the ping entirely.
    #-------------------------------------------------------------------------------
    c.ping_wait_millis       = config.get("rtm:ping:wait-time-millis") ? config.get("ping_wait_millis")
    if c.ping_wait_millis? and Util.falsey_string(c.ping_wait_millis)
      c.ping_wait_millis     = false
    else
      c.ping_wait_millis     = Util.to_int(c.ping_wait_millis)
    c.ping_wait_millis       ?= 30*1000
    if c.ping_wait_millis
      c.ping_wait_millis     = c.ping_wait_millis - (3*1000) + (Math.random()*6*1000) # fuzz +/- 3 seconds
    #-------------------------------------------------------------------------------
    # Configure presence update frequency (if any). Defaults to around 12 minutes
    # (but the exact value is "fuzzed" to avoid unnecessary sychronization when
    # launching several bots simaltaneously). Set `PRESENCE_WAIT_MILLIS` to `0` or
    # `false` to disable the ping entirely.
    #-------------------------------------------------------------------------------
    c.presence_wait_millis   = config.get("rtm:presence:wait-time-millis") ? config.get("presence_wait_millis")
    if c.presence_wait_millis? and Util.falsey_string(c.presence_wait_millis)
      c.presence_wait_millis = false
    else
      c.presence_wait_millis = Util.to_int(c.presence_wait_millis)
    c.presence_wait_millis   ?= 12*60*1000
    c.presence_value         = config.get("rtm:presence:status") ? "ONLINE"
    c.presence_path          = config.get("rtm:presence:path") ? "/user/-/presence"
    if c.presence_wait_millis
      c.presence_wait_millis = c.presence_wait_millis - (30*1000) + (Math.random()*60*1000) # fuzz +/- 30 seconds
    c.fetch_screen_name      = Util.truthy_string(config.get("rtm:fetch-screen-name") ? config.get("rtm:fetch_screen_name") ? config.get("fetch-screen-name") ? config.get("fetch_screen_name") ? false)
    #-------------------------------------------------------------------------------
    # Configure log level. Note that `QUIET` is laconic but not totally silent.
    #-------------------------------------------------------------------------------
    c.quiet                           = Util.truthy_string(config.get("quiet") ? config.get("QUIET") ? false)
    c.debug                           = Util.truthy_string(config.get("debug") ? config.get("DEBUG") ? (/(^|,|;)Team-?one(-?(Base-?)?Bots?)?($|,|;)/i.test(process.env.NODE_DEBUG)) )
    #-------------------------------------------------------------------------------
    c.sigint                          = Util.truthy_string(config.get("sigint-handler") ? config.get("sigint_handler") ? config.get("sigint") ? true)
    c.botname                         = config.get("botname") ? config.get("name")
    c.log_pid                         = Util.truthy_string(config.get("log:pid") ? config.get("log-pid") ? config.get("log_pid") ? false)
    c.log_ts                          = Util.truthy_string(config.get("log:ts") ? config.get("log-ts")  ? config.get("log_ts") ? true)
    c.use_color                       = @_should_use_color(config)
    c.default_ignore_duration_seconds = Util.to_int(config.get("ignore-duration-seconds")) ? 60
    #-------------------------------------------------------------------------------
    return c

  # inspect:
  #  - inote-util.config object
  #  - process.argv
  #  - process.env
  #  - process.stdout
  # to determine whether or not color output is appropriate
  _should_use_color:(config = null, argv = process.argv, env = process.env, stdout = process.stdout)=>
    positive_value = config.get("log:use-color") ? config.get("log:use_color") ? config.get("log:usecolor") ? config.get("log:color") ? config.get("use-color") ? config.get("use_color") ? config.get("color") ? config.get("USE-COLOR") ? config.get("USE_COLOR") ? config.get("COLOR")
    negative_value = config.get("log:no-color") ? config.get("log:no_color") ? config.get("log:nocolor") ? config.get("no-color") ? config.get("no_color") ? config.get("nocolor") ? config.get("NO-COLOR") ? config.get("NO_COLOR") ? config.get("NOCOLOR")
    if Util.truthy_string(positive_value) or positive_value is "always"
      return true
    else if Util.falsey_string(negative_value) or negative_value is "never"
      return false
    else if ("--no-color" in argv) or ("--color=false" in argv) or ("--color=0" in argv)
      return false
    else if ("--color" in argv) or ("--color=true" in argv) or ("--color=always" in argv) or ("--color=1" in argv)
      return true
    else if stdout? and not stdout.isTTY
      return false
    else if "COLORTERM" in env
      return true
    else if env.TERM is "dumb"
      return false
    else if /(^screen)|(^xterm)|(^vt100)|(color)|(ansi)|(cygwin)|(linux)/i.test env.TERM
      return true
    else
      return false

exports.BaseBot = BaseBot
