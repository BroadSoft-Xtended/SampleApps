/*
 * http.js - a basic HTTP client wrapping the `request` module.
 *
 * THE HTTP METHODS
 *
 * https.js supports 6 primary HTTP request types.
 *
 *  - get(uri,cb)        - executes a GET request against the given URI.
 *
 *  - getJSON(uri,cb)    - executes a GET request against the given URI and
 *                         parses the response body as a JSON document.
 *
 *  - post(uri,body,cb)  - executes a POST request against the given URI
 *                         using `body` as the request body (see below).
 *
 *  - put(uri,body,cb)   - executes a PUT request against the given URI
 *                         using `body` as the request body (see below).
 *
 *  - patch(uri,body,cb) - executes a PATCH request against the given URI
 *                         using `body` as the request body (see below).
 *
 *  - delete(uri,cb)     - executes a DELETE request against the given URI.
 *
 * Each method accepts the general arguments: `uri, [body], callback`.
 *
 * uri
 *
 * The `uri` is location to make the request to, and may include the
 * full URL (protocol, host, port, path, query-string, etc.).
 *
 * If the `uri` is absolute (starts with `http[s]://`) it will be used
 * as-is.  If it is relative, the path will be resolved relative to the
 * `urlBase` attribute.
 *
 * body
 *
 * The `body` (when present) must contain a map with exactly one key--either
 * `json` or `form`.  The value of this key should be another map, contianing
 * the actual name/value pairs to be included in the request body.
 *
 * When the root key in `body` is `form`, the body content will be posted as
 * `application/x-www-form-urlencoded` data.  When the root key is `json`, the
 * body content will be posted as `application/json` data.
 *
 * When `json` data is included in the request body, the resopnse body is
 * automatically interpreted as a JSON document.
 *
 * callback
 *
 * The callback method has the signature `(err,response,body)`--identical to
 * the callback used with `request`.
 *
 * OTHER METHODS
 *
 *  - useAuthorization(token) - stores the given `token` for use in the
 *                              Authorization header, like this:
 *                                  Authorization: Bearer <ACCESS-TOKEN>
 *                              Set `token = null` to erase the current
 *                              access token (if any).
 *
 *  - supportCookies(bool)    - when `true`, create a new (empty) "cookie jar" and
 *                              enabled cookie support. When `false`, disable
 *                              cookie support and delete the current cookie jar
 *                              (if any).
 * ATTRIBUTES
 *
 *  - urlBase - the URL to use when given a relative path.
 *
 *  - quiet   - by default, HTTP prints information about the request and response
 *              to the console. Setting `quiet = true` will suppress that.
 *
 *------------------------------------------------------------------------------
 */
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
var F = require("./formatter.js");
var request = require("request");

__bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

HTTP = (function() {
  function HTTP(urlBase) {
    this.cookieJar        = null;
    this.accessToken      = null;
    this.urlBase          = urlBase;
    this.quiet            = false;
    this.supportCookies   = __bind(this.supportCookies,this);
    this.useAuthorization = __bind(this.useAuthorization,this);
    this.get              = __bind(this.get,this);
    this.getJSON          = __bind(this.getJSON,this);
    this.put              = __bind(this.put,this);
    this.post             = __bind(this.post,this);
    this.patch            = __bind(this.patch,this);
    this['delete']        = __bind(this['delete'],this);
    this._request         = __bind(this._request,this);
  };
  HTTP.prototype.supportCookies = function(useCookies) {
    if(useCookies) {
      this.cookieJar = request.jar();
    } else {
      delete this.cookieJar;
    }
  }
  HTTP.prototype.useAuthorization = function(token) {
    this.accessToken = token;
  }
  HTTP.prototype.get = function(path,callback) {
    this._request("get",path,null,{},callback);
  }
  HTTP.prototype.getJSON = function(path,callback) {
    this._request("get",path,null,{json:true},callback);
  }
  HTTP.prototype.put = function(path,body,callback) {
    this._request("put",path,body,{},callback);
  }
  HTTP.prototype.post = function(path,body,callback) {
    this._request("post",path,body,{},callback);
  }
  HTTP.prototype.patch = function(path,body,callback) {
    this._request("patch",path,body,{},callback);
  }
  HTTP.prototype["delete"] = function(path,callback) {
    this._request("del",path,null,{},callback);
  }
  HTTP.prototype._request = function(method,path,body,options,callback) {
    if(!this.quiet) { F.req(method,path,this.accessToken,body); }
    var params = {};
    params.followRedirect = false;
    if(/^https?:\/\//.test(path)) {
      params.uri = path;
    } else {
      params.uri = this.urlBase + path;
    }
    params.headers = {};
    if(this.accessToken) { params.headers.Authorization = "Bearer " + this.accessToken; }
    params.jar = this.cookieJar;
    if(options.json) {
      params.json = true;
    }
    if(body && body.json) {
      params.json = true;
      params.body = body.json;
    } else if(body && body.form) {
      params.form = body.form;
    }
    request[method](params,function(err,response,body){
      if(!this.quiet) { F.res(response,body); }
      callback(err,response,body);
    });
  }
  return HTTP;
})();

module.exports = HTTP;
