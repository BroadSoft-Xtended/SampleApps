/*
 * oauth-annotated.js - this script demonstrates how to use the OAuth2 protocol to
 *                      access Intellinote on behalf of an end-user.
 *
 * This script both contains and generates a moderately large amount of commentary
 * on what is going on within the script.  For a less verbose example, see the
 * file `oauth-bare.js`
 *
 * Note that this script emulates the user's part in the OAuth2 process as well as
 * the servers. For this reason you must pass a username and password on the command
 * line.
 */

// IMPORTS

var HTTP = require("./util/http.js");           // <= a simple HTTP client wrapping `request`
var Sequencer = require("./util/sequencer.js"); // <= a utility for "flattening" nested calls.
var F = require("./util/formatter.js");         // <= some console output formatting routines
var assert = require('assert');                 // <= node's built-in assertion library

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
var server  = config.server.scheme + config.server.host + ":" + config.server.port;
var baseURL = config.server.base;
var http = new HTTP(server+baseURL);
F.p("http baseURL is "+server+baseURL);

var CLIENT_ID = config.oauth.client_id,
    CLIENT_SECRET = config.oauth.client_secret,
    SCOPE = config.oauth.scope,
    REDIRECT = config.oauth.redirect_uri;


// THE ACTUAL PROGRAM

var S = new Sequencer();

// Print banner.
S.first(function(next){ F.H1("Start"); next(); });

// Print a description of the first step.
S.next(function(next){
  F.H2("Step One: Get the Authorization Code");
  F.p("The first step in an OAuth2 authorization process is normally a manual one.");
  F.p();
  F.p("Before Intellinote can allow our application to access Intellinote on the ");
  F.p("user's behalf, the user must explicitly \"grant\" our application access to");
  F.p("his or her account.");
  F.p();
  F.p("The process works like this:");
  F.p();
  F.p("1. We will direct the user to a special URL at Intellinote.");
  F.p();
  F.p("2. Intellinote will ask the user to log in (if he hasn't already) and to");
  F.p("   approve our application's access (if he hasn't already).");
  F.p();
  F.p("3. Once the user has been authenticated and authorized our application to");
  F.p("   act on his behalf, Intellinote will redirect the user back to our site ");
  F.p("   (to a URL we specify) with a special "+F.ub("authorization code")+" value appended");
  F.p("   to the URL as a query string parameter.");
  F.p();
  F.p("   This authorization code is our proof that the user granted access to");
  F.p("   our application.");
  F.p();
  F.p("Later, our application will be able to trade that authorization code for an");
  F.p(F.ub("access token")+" that will act as our application's credential when accessing");
  F.p("Intellinote for that user. (That step is described in more detail below.)");
  F.p();
  F.p("Typically this is a one-time action. Once the user has granted access, our");
  F.p("application will be able to obtain new access tokens without direct action ");
  F.p("on the user's part -- the user doesn't even need to be online.");
  F.p();
  F.p("For the purpose of this demonstration, we will pretend to be the end-user's ");
  F.p("web browser and complete this step programmatically, but in practice we ");
  F.p("won't have to worry about this step. We'll just send the user to Intellinote");
  F.p("and wait for him to come back with an authorization code.");
  F.p();
  next();
});

// Enable cookies.
S.next(function(next){
  F.H4("Enabling cookies since we're pretending to act as the end-user's browser.");
  http.supportCookies(true);
  F.p("Done.");
  F.p();
  next();
});

// Log in.
S.next(function(next){
  F.H4('Logging in as user "'+F.ub(USERNAME)+'".');
  var url = "/log-in"
  var payload = {username:USERNAME,password:PASSWORD};
  http.post(url,{form:payload},function(err,response,body){
    assert.equal(response.statusCode,302,F.r("Expected a redirect to the homepage after logging in but found response "+response.statusCode+"."));
    assert.equal(response.headers.location,(baseURL+"/"),F.r("Expected a redirect to the homepage after logging in but found location "+response.headers.location+"."));
    F.p("Logged in.");
    F.p();
    next();
  });
});

// Get authorization code.
var authorizationCode = null;
var codeRegex = /(\?|&)code=([^=*]+)(&|$)/;
S.next(function(next){
  F.H4('Requesting authorization code from "'+F.ub(USERNAME)+'"');
  F.H4('for scope "'+F.ub(SCOPE)+'".');
  var url = "/auth/oauth2/authorization?response_type=code&client_id="+CLIENT_ID+"&scope="+SCOPE+"&redirect_uri="+REDIRECT;
  http.get(url,function(err,response,body){
    if(response.statusCode === 302) {
      F.p("Got a "+F.ub('302')+" response to request for an authorization code.");
      F.p('The user must have already granted access.');
      assert.ok(codeRegex.test(response.headers.location),F.r("Expected a Location header containing the authorization code but found \"Location: "+(response.headers.location||'null')+"\"."));
      authorizationCode = response.headers.location.match(codeRegex)[2]
      next();
    } else if(response.statusCode === 200) {
      F.p("Got a 200 response to request for an authorization code.");
      F.p("The user must need to grant access.");
      assert.ok(/Third-Party Application Authorization/.test(body),F.r("Expected a page asking the user to authorize access but found: "+(body||'null')));
      F.p("Granting access (as user).");
      var url = "/auth/oauth2/authorization/granted?response_type=code&client_id="+CLIENT_ID+"&scope="+SCOPE+"&redirect_uri="+REDIRECT;
      http.get(url,function(err,response,body){
        F.p("Done.");
        authorizationCode = response.headers.location.match(codeRegex)[2]
        next();
      });
    } else {
      assert.fail(F.r("Unexpected status code ("+response.statusCode+") for URL "+url));
    }
  });
});

// Print the authorization code.
S.next(function(next){
  F.p(F.g("Found authorization code \""+F.ub(authorizationCode)+"\"."));
  F.p();
  next()
});

// Print a description of the second step.
S.next(function(next){
  F.H2("Step Two: Get an Access Token");
  F.p("Now that we have an "+F.ub("authorization code")+" that certifies that the end-user has");
  F.p("authorized our application to access his or her account, we can exchange it");
  F.p("for an " +F.ub("access token")+" that we'll include in our actual API calls.");
  F.p();
  F.p("To get the access token, we submit a POST request to Intellinote, including:");
  F.p("  - the "+F.ub("authorization code"));
  F.p("  - our "+F.ub("client id") + " (as assigned by Intellinote)");
  F.p("  - our "+F.ub("client secret") + " (as assigned by Intellinote)");
  F.p("  - the value "+F.ub("grant_type=authorization_code"));
  F.p("in a JSON document within the request body.");
  F.p();
  F.p("If all goes well, Intellinote will respond with a JSON document that contains");
  F.p("our access token.");
  F.p();
  F.p("An access token acts as a type of credential. When we include it within the");
  F.p("HTTP request header named \"Authorization\", Intellinote will allow our");
  F.p("application to execute an API method on behalf of the user.");
  F.p();
  F.p("An access token is a "+F.u("temporary")+" credential. It will eventually become \"stale\".");
  F.p("When that happens, Intellinote will start to return an HTTP 401 (Unauthorized)");
  F.p("response to our API calls. When this happens we can request a new access token");
  F.p("using a "+F.ub("refresh token")+" that will also be returned by this call.");
  F.p()
  F.p("(The use of the refresh token is described in detail below.)");
  F.p()
  next();
});

// Disable cookies (since we're done pretending to act as the end-user's browser).
S.next(function(next){
  F.H4("Disabling cookies since we're done pretending to act as the end-user's browser.");
  http.supportCookies(false);
  F.p("Done. From now on all calls are server-to-server calls without cookies.");
  F.p();
  next()
});

// Fetch access_token and refresh_token
var refreshToken = null;
var accessToken = null
S.next(function(next){
  F.H4("Requesting access token and refresh token using code \""+F.ub(authorizationCode)+"\".");
  var url = "/auth/oauth2/access";
  var payload = {
    code: authorizationCode,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code"
  }
  http.post(url,{json:payload},function(err,response,body){
    assert.equal(response.statusCode,200,F.r("Expected 200 status response to request for access_token using authorization_code, but found \""+response.statusCode+"\"."));
    assert.ok(body.access_token,F.r("Expected body to contain an access_token attribute, but found \""+JSON.stringify(body)+"\"."));
    assert.ok(body.refresh_token,F.r("Expected body to contain a refresh_token attribute, but found \""+JSON.stringify(body)+"\"."));
    accessToken = body.access_token;
    refreshToken = body.refresh_token;
    F.p("Done.");
    next();
  });
});

// Print access_token and refresh_token.
S.next(function(next){
  F.p(F.g("Found access_token \""+F.ub(accessToken)+"\"."));
  F.p(F.g("Found refresh_token \""+F.ub(refreshToken)+"\"."));
  F.p();
  next()
});

// Print a description of step three.
S.next(function(next){
  F.H2("Step Three: Use the Access Token");
  F.p("Now that we have an "+F.ub("access token")+", we simply need to include it in our API");
  F.p("calls within the "+F.ub("Authorization")+" request header, like this:");
  F.p();
  F.p("    Authorization: Bearer <ACCESS TOKEN VALUE>");
  F.p();
  F.p("Intellinote will use this value to determine:");
  F.p("  - which application is making the call, and");
  F.p("  - which user's data the application is trying to access.");
  F.p()
  next();
});

// Set the authorization header.
S.next(function(next){
  F.H4("Setting Authorization Header");
  F.p("Setting Authorization header to \""+F.ub("Bearer "+accessToken)+"\"");
  F.p("for all subsequent requests.");
  http.useAuthorization(accessToken);
  F.p("Done.");
  F.p();
  next()
});

// Fetch a list of orgs.
var orgId = null;
S.next(function(next){
  F.H4("Using the access token to invoke API methods.");
  var url = "/v2.0/orgs";
  http.getJSON(url,function(err,response,body){
    assert.equal(response.statusCode,200,F.r("Expected 200 status but found \""+F.ub(response.statusCode)+"\"."));
    assert.ok(Array.isArray(body),F.r("Expected the response body to contain an array of organizations but found: "+F.ub(JSON.stringify(body))));
    assert.ok(body.length >= 1,F.r("Expected a non-empty array of organizations."));
    assert.ok(body[0].org_id,F.r("Expected the frist organization to have an org_id value."));
    F.p(F.g("Found org_id \""+F.ub(orgId)+"\"."));
    F.p("Done.");
    orgId = body[0].org_id
    next();
  });
});

// Print a description of step four.
S.next(function(next){
  F.H2("Refresh the Access Token");
  F.p("As mentioned above, our "+F.ub("access token")+" will eventually expire and stop working.");
  F.p("When this happens we can use our "+F.ub("refresh token")+" to obtain a new one.");
  F.p();
  F.p("The refresh call is very similar to the call that used the authorization code");
  F.p("to obtain the initial access and refresh tokens.");
  F.p();
  F.p("To refresh the access token, we submit a POST request to Intellinote, including:");
  F.p("  - the "+F.ub("refresh token"));
  F.p("  - our "+F.ub("client id") + " (as assigned by Intellinote)");
  F.p("  - our "+F.ub("client secret") + " (as assigned by Intellinote)");
  F.p("  - the value "+F.ub("grant_type=refresh_token"));
  F.p("in a JSON document within the request body.");
  F.p();
  F.p("If all goes well, Intellinote will respond with a JSON document that contains");
  F.p("our new access token.");
  F.p();
  F.p("Intellinote may also return a new refresh token value. If it does, we should");
  F.p("use this new refresh token the next time we want to refresh the access token.");
  F.p()
  next();
});

// Clear access_token
S.next(function(next){
  F.H4("Clearing access_token to pretend as if the access token has expired.");
  http.useAuthorization(null);
  accessToken = null
  F.p("Done.");
  F.p("");
  next()
});

// Refresh the access token
S.next(function(next){
  F.H4("Requesting a NEW access token using the refresh token");
  F.H4("\""+F.ub(refreshToken)+"\".");
  var url = "/auth/oauth2/access";
  var payload = {
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token"
  }
  http.post(url,{json:payload},function(err,response,body){
    assert.equal(response.statusCode,200,F.r("Expected 200 status response to request for access_token using refresh_token, but found \""+F.ub(response.statusCode)+"\"."));
    assert.ok(body.access_token,F.r("Expected body to contain an access_token attribute, but found \""+F.ub(JSON.stringify(body))+"\"."));
    F.p("Done.");
    accessToken = body.access_token;
    if(body.refresh_token) {
      refreshToken = body.refresh_token;
    }
    next();
  });
});

// Print the NEW acces and request token values.
S.next(function(next){
  F.p(F.g("Found NEW access_token \""+F.ub(accessToken)+"\"."));
  F.p(F.g("Found refresh_token \""+F.ub(refreshToken)+"\"."));
  F.p();
  next()
});

// Set the new Authorizatoin header value
S.next(function(next){
  F.H4("Setting Authorization Header");
  F.p("Setting Authorization header to \""+F.ub("Bearer "+accessToken)+"\"");
  F.p("for all subsequent requests.");
  http.useAuthorization(accessToken);
  F.p("Done.");
  next()
});

// Decribe the next step.
S.next(function(next){
  F.H2("Use the NEW Access Token");
  next();
});

// Fetch a list of workspaces.
var workspaceId = null;
S.next(function(next){
  F.H4("Using NEW access code to invoke API.");
  var url = "/v2.0/org/"+orgId+"/workspaces";
  http.getJSON(url,function(err,response,body){
    assert.equal(response.statusCode,200,F.r("Expected 200 status but found \""+F.ub(response.statusCode)+"\"."));
    assert.ok(Array.isArray(body),F.r("Expected the response body to contain an array but found: "+F.ub(JSON.stringify(body))));
    assert.ok(body.length >= 1,F.r("Expected a non-empty array."));
    assert.ok(body[0].workspace_id,F.r("Expected a workspace_id value."));
    F.p(F.g("Found workspace_id \""+F.ub(orgId)+"\"."));
    F.p("Done.");
    workspaceId = body[0].workspace_id
    next();
  });
});

// Fetch a list of notes.
S.next(function(next){
  F.H4("Using NEW access code to invoke API again.");
  var url = "/v2.0/org/"+orgId+"/workspace/"+workspaceId+"/notes";
  http.getJSON(url,function(err,response,body){
    assert.equal(response.statusCode,200,F.r("Expected 200 status but found \""+F.ub(response.statusCode)+"\"."));
    assert.ok(Array.isArray(body),F.r("Expected the response body to contain an array but found: "+F.ub(JSON.stringify(body))));
    assert.ok(body.length >= 1,F.r("Expected a non-empty array."));
    assert.ok(body[0].note_id,F.r("Expected a note_id value."));
    F.p("Done.");
    next();
  });
});

// Execute the sequence defined above.
S.run(function(){
  F.H2("");
  F.p(F.g("ALL DONE."));
  F.p();
  F.H1("END");
});
