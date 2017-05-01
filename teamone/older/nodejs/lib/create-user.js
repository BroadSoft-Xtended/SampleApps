/*
 * create-user.js - demonstrates how use `client_credentials` grant and
 *                  `create-user` scope to create new Intellinote user.
 *
 * Some Intellinote API methods can be invoked outside of a "user context".
 *
 * If our application has been authorized (by Intellinote) to do so, we can
 * peform a type of "user-less" OAuth2 authentication known as a
 * "client_credentials" grant.
 *
 * With the client_credentials grant type, our application can obtain an
 * access token and refresh token that allows our application to take
 * certain actions outside of the scope of any specific user.  It is
 * an "application-level" log-in.
 *
 * This script demonstrates:
 *
 *  - how to perform a client_credentials-based authentication to
 *    to achieve application-level access to Intellinote.
 *
 *  - how to use that application-level access to create
 *    a new Intellinote user.
 *
 *  - how to use the automatic new-user-authorization grant
 *    to obtain an access token that allows our application
 *    to interact with Intellinote on the newly created
 *    user's behalf.
 *
 * NOTE: In order for this script to work properly, our application's
 *       API client record must have certain "rights" within the
 *       Intellinote system.  Specifically:
 *
 *        - Our application must be allowed to perform "user-less"
 *          authentication.
 *
 *        - Our application must be granted access to the
 *          `create-user` scope.
 *
 *        - Our application must be able to create users with
 *          access to the `create-org` scope.
 *
 *       (If you need this level of access but do not currently
 *       have it, contact Intellinote for support.)
 */

// IMPORTS

var HTTP = require("./util/http.js");
var F = require("./util/formatter.js");
var Sequencer = require("./util/sequencer.js");
var assert = require('assert');

// CONFIGURATION

/*
 * This script makes use of the `config.json` file found in the parent directory.
 */
var config = require("../config.json");
var server  = config.server.scheme + config.server.host + ":" + config.server.port;
var baseURL = config.server.base;
var http = new HTTP(server+baseURL);
F.p("http baseURL is "+server+baseURL);

var CLIENT_ID = config.oauth.client_id,
    CLIENT_SECRET = config.oauth.client_secret,
    SCOPE = config.oauth.scope,
    REDIRECT = config.oauth.redirect_uri;

// IMPLEMENTATION

var S = new Sequencer();

// Log in via client_credentials grant to obtain the access and refresh tokens.

/*
 * To perform the client_credentials "log in", we submit a POST
 * request to:
 *
 *     {BASE-URL}/auth/oauth2/access
 *
 * passing the following parameters in a JSON document in the
 * request body:
 *
 *   - our client_id (as assigned by Intellinote)
 *   - our client_secret (as assigned by Intellinote)
 *   - the value `"grant_type": "client_credentials"
 *
 * If all goes well, Intellinote will respond with a JSON document
 * containing an `access_token` and a `refresh_token`.
 */
var refreshToken = null;
var accessToken = null;
S.next(function(next){
  console.log("Logging-in for user-less, application-level API access.");
  var url = "/auth/oauth2/access";
  var payload = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials"
  }
  http.post(url,{json:payload},function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok(body && body.access_token,"Expected an access_token value here, but found:" +JSON.stringify(body));
    assert.ok(body && body.refresh_token,"Expected a refresh_token value here, but found:" +JSON.stringify(body));
    /* collect the data we'll need later */
    accessToken = body.access_token;
    refreshToken = body.refresh_token;
    /* move on */
    next();
  });
});

// Set authorization header.

/*
 * Now that we have our access_token, we'll add it to our HTTP client.
 */
S.next(function(next){ http.useAuthorization(accessToken); next(); });

// Hit a test method to demonstrate that the access token works
S.next(function(next){
  console.log("Confirming our access works by hitting /v2.0/ping/authed.");
  var url = "/v2.0/ping/authed";
  http.getJSON(url,function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok( body.timestamp );
    /* move on */
    next();
  });
});

// Create a new user

/*
 * To avoid conflicts, let's create a random email address for our new user.
 */
var email = Date.now() + "-" + Math.round(Math.random()*10000) + "@example.org";

/*
 * When we create the new user, we should get back:
 *
 *  - the `user_id` assigned to this new user
 *
 *  - a `refresh_token` that allows us to interact with
 *    Intellinote on behalf of that user.
 */
var userId = null;
var userRefreshToken = null;

/*
 * Creating the user is just a matter of POSTing certain attributes
 * to the `/v2.0/user` API method.
 */
S.next(function(next) {
  console.log("Creating a new user.");
  var url = "/v2.0/user";
  var payload = {
    "given_name":"Demo",
    "family_name":"User",
    "password":'DemoPasswd1234',
    "email":email,
    "job_title":"Product Demonstrator",
    "tel_work":"(212) 853-5987"
  };
  http.post(url,{json:payload},function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 201 );
    assert.ok(body && body.user_id,"Expected a user_id value here, but found:" +JSON.stringify(body));
    assert.ok(body && body.refresh_token,"Expected a refresh_token value here, but found:" +JSON.stringify(body));
    /* collect the data we'll need later */
    userId = body.user_id;
    userRefreshToken = body.refresh_token
    /* move on */
    next();
  });
});

// Obtain an access token for the user using the pre-authorized refresh token

/*
 * We can trade the `refresh_token` we got in the last call
 * to obtain an `access_token` in the usual way.
 */
var userAccessToken = null
S.next(function(next){
  console.log("Obtaining an access token for that new user.");
  var url = "/auth/oauth2/access";
  var payload = {
    refresh_token: userRefreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token"
  }
  http.post(url,{json:payload},function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok(body && body.access_token,"Expected an access_token value here, but found:" +JSON.stringify(body));
    /* collect the data we'll need later */
    userAccessToken = body.access_token;
    if(body.refresh_token) {
      userRefreshToken = body.refresh_token;
    }
    /* move on */
    next();
  });
});

// Set authorization header to the *user's* access token
/* Now we can use that access token to access the new user's account. */
S.next(function(next){ http.useAuthorization(userAccessToken); next(); });

// Hit a test method to demonstrate that the user access token works
S.next(function(next){
  console.log("Confirming our user-level access works by hitting /v2.0/ping/authed.");
  var url = "/v2.0/ping/authed";
  http.getJSON(url,function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok( body.timestamp );
    /* move on */
    next();
  });
});

// Fetch a list of orgs (should be empty)
S.next(function(next){
  console.log("Get a list of the orgs the user has access to (should be empty).");
  var url = "/v2.0/orgs";
  http.getJSON(url,function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok( Array.isArray(body) );
    assert.equal( body.length, 0 );
    /* move on */
    next();
  });
});

// Create a new org for that user
var orgId = null;
S.next(function(next) {
  console.log("Create a new org for that user.");
  var url = "/v2.0/org";
  var payload = {
    "name":email+"'s Demo Org"
  };
  http.post(url,{json:payload},function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 201 );
    assert.ok(body && body.org_id,"Expected a org_id value here, but found:" +JSON.stringify(body));
    /* collect the data we'll need later */
    orgId = body.org_id;
    /* move on */
    next();
  });
});

// Fetch a list of orgs (should be non-empty)
S.next(function(next){
  console.log("List the orgs again (should be non-empty).");
  var url = "/v2.0/orgs";
  http.getJSON(url,function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok( Array.isArray(body) );
    assert.equal( body.length, 1 );
    assert.equal( body[0].org_id, orgId );
    /* move on */
    next();
  });
});

// Fetch a list of workspaces
var workspaceId = null
S.next(function(next){
  console.log("List the workspaces in that org.");
  var url = "/v2.0/org/"+orgId+"/workspaces";
  http.getJSON(url,function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok( Array.isArray(body) );
    assert.ok(body[0].workspace_id,"Expected a workspace_id value here, but found:" +JSON.stringify(body));
    /* collect the data we'll need later */
    workspaceId = body[0].workspace_id
    /* move on */
    next();
  });
});

// Fetch a list of notes
S.next(function(next){
  console.log("List notes in that workspace.");
  var url = "/v2.0/org/"+orgId+"/workspace/"+workspaceId+"/notes";
  http.getJSON(url,function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok( Array.isArray(body) );
    assert.ok( body.length === 0 );
    /* move on */
    next();
  });
});

// Switching back to the app-level API key...
S.next(function(next){ http.useAuthorization(accessToken); next(); });

// Let us create a second user
var secondEmail = Date.now() + "-" + Math.round(Math.random()*10000) + "@example.org";
var secondUserId = null;
var secondUserRefreshToken = null;

S.next(function(next) {
  console.log("Creating a second new user.");
  var url = "/v2.0/user";
  var payload = {
    "given_name":"Demo2",
    "family_name":"User2",
    "password":'DemoPasswd2345',
    "email":secondEmail,
    "job_title":"Second User"
  };
  http.post(url,{json:payload},function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 201 );
    assert.ok(body && body.user_id,"Expected a user_id value here, but found:" +JSON.stringify(body));
    assert.ok(body && body.refresh_token,"Expected a refresh_token value here, but found:" +JSON.stringify(body));
    /* collect the data we'll need later */
    secondUserId = body.user_id;
    secondUserRefreshToken = body.refresh_token
    /* move on */
    next();
  });
});

// Switching back to the org-admin API key...
S.next(function(next){ http.useAuthorization(userAccessToken); next(); });

// Add the user to the org
S.next(function(next) {
  console.log("Adding second user to org.");
  var url = "/v2.0/org/"+orgId+"/member/"+ secondUserId
  var payload = {
    "access_type":"FULL"
  };
  http.post(url,{json:payload},function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 201 );
    /* move on */
    next();
  });
});

// Select a list of org members
S.next(function(next) {
  console.log("Selecting list of org members.");
  var url = "/v2.0/org/"+orgId+"/members"
  http.getJSON(url,function(err,response,body){
    /* test the response */
    assert.ok( !err );
    assert.ok( response.statusCode === 200 );
    assert.ok( Array.isArray(body) );
    assert.ok( body.length === 2 );
    /* move on */
    next();
  });
});

// Run it.
S.run();
