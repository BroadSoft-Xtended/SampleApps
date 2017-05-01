/*
 * oauth-bare.js - this script demonstrates how to use the OAuth2 protocol to
 *                 access Intellinote on behalf of an end-user.
 *
 * See `oauth-annotated.js` for more information.
 */

// IMPORTS

var HTTP = require("./util/http.js");
var Sequencer = require("./util/sequencer.js");

// CONFIGURATION

var USERNAME = null, PASSWORD = null;
if(process.argv.length < 4) {
  console.error(F.r("The command line parameters <USERNAME> and <PASSWORD> must be provided."));
  process.exit(1);
} else {
  USERNAME = process.argv[2];
  PASSWORD = process.argv[3];
}

var config = require("../config.json");
var server  = config.server.scheme + config.server.host;
var baseURL = config.server.base;
var http = new HTTP(server+baseURL);

var CLIENT_ID = config.oauth.client_id,
    CLIENT_SECRET = config.oauth.client_secret,
    SCOPE = config.oauth.scope,
    REDIRECT = config.oauth.redirect_uri;

// IMPLEMENTATION

var S = new Sequencer();

// Enable cookies.
S.next(function(next){ http.supportCookies(false); next(); });

// Log in.
S.next(function(next){
  http.supportCookies(true);
  var url = "/log-in"
  var payload = {username:USERNAME,password:PASSWORD};
  http.post(url,{form:payload},function(err,response,body){ next(); });
});

// Get authorization code.
var authorizationCode = null;
S.next(function(next){
  var codeRegex = /(\?|&)code=([^=*]+)(&|$)/;
  var url = "/auth/oauth2/authorization?response_type=code&client_id="+CLIENT_ID+"&scope="+SCOPE+"&redirect_uri="+REDIRECT;
  http.get(url,function(err,response,body){
    if(response.statusCode === 302) {
      authorizationCode = response.headers.location.match(codeRegex)[2]
      next();
    } else if(response.statusCode === 200) {
      var url = "/auth/oauth2/authorization/granted?response_type=code&client_id="+CLIENT_ID+"&scope="+SCOPE+"&redirect_uri="+REDIRECT;
      http.get(url,function(err,response,body){
        assert.ok(codeRegex.test(response.headers.location),F.r("Expected a Location header containing the authorization code but found \"Location: "+(response.headers.location||'null')+"\"."));
        authorizationCode = response.headers.location.match(codeRegex)[2]
        next();
      });
    } else {
      console.error("Unexpected status code: ",response.statusCode);
    }
  });
});

// Disable cookies.
S.next(function(next){ http.supportCookies(false); next(); });

// Fetch access_token and refresh_token
var refreshToken = null;
var accessToken = null
S.next(function(next){
  var url = "/auth/oauth2/access";
  var payload = {
    code: authorizationCode,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code"
  }
  http.post(url,{json:payload},function(err,response,body){
    accessToken = body.access_token;
    refreshToken = body.refresh_token;
    next();
  });
});

// Set authorization header.
S.next(function(next){ http.useAuthorization(accessToken); next(); });

// Fetch a list of orgs.
var orgId = null;
S.next(function(next){
  var url = "/v2.0/orgs";
  http.getJSON(url,function(err,response,body){
    orgId = body[0].org_id
    next();
  });
});

// Clear authorization (so we can refresh the token).
S.next(function(next){ http.useAuthorization(null); next() });

// Refresh access token using refresh token
S.next(function(next){
  var url = "/auth/oauth2/access";
  var payload = {
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token"
  }
  http.post(url,{json:payload},function(err,response,body){
    accessToken = body.access_token;
    if(body.refresh_token) {
      refreshToken = body.refresh_token;
    }
    next();
  });
});

// Set authorization header to the NEW access token.
S.next(function(next){ http.useAuthorization(accessToken); next(); });

// Fetch a list of workspaces (using NEW access token).
var workspaceId = null;
S.next(function(next){
  var url = "/v2.0/org/"+orgId+"/workspaces";
  http.getJSON(url,function(err,response,body){
    workspaceId = body[0].workspace_id
    next();
  });
});

// Fetch a list of notes (using NEW access token
S.next(function(next){
  var url = "/v2.0/org/"+orgId+"/workspace/"+workspaceId+"/notes";
  http.getJSON(url,function(err,response,body){ next(); });
});

// Run it.
S.run();
