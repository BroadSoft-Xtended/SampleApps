// *(If you're viewing this in a web browser, you can [click here](#the-program)
// to skip these comments and jump to the start of the actual code.)*
//
// ---
//
// ## Contents
//
//  * [An Introduction and Some Background](#an-introduction-and-some-background)
//     * [About the Team-One (Intellinote) API](#about-the-team-one-intellinote-api)
//     * [About this File](#about-this-file)
//  * [The Program](#the-program)
//     * [A Note on Structure](#a-note-on-structure)
//     * [Imports](#imports)
//     * [Main](#main)
//     * [API Methods](#api-methods)
//     * [Utility Methods](#utility-methods)
//  * [Example Output](#example-output)
//  * [Footnotes](#footnotes)
//
// ---
//
// ## An Introduction and Some Background
//
// ### About the Team-One (Intellinote) API
//
// Team-One (Intellinote) provides a RESTful (JSON-over-HTTP) web service API
// that allows API clients to perform virtually any action that can be performed
// via the web, desktop or mobile user interaces (and a few actions that cannot
// be performed directly via the UI-clients).
//
// To use the Team-One REST API, you will need an API Client account. When your
// API Client account is created you'll be provided with
// [OAuth2](http://oauth.net/2/) credentials, typically including a client
// identifier (`client_id`) and "password" (`client_secret`). Your client will
// use these credentials to authenticate to and subsequently access the Team-One
// API, typically by following the standard OAuth2 protocol.  (There are
// examples of this below.)
//
// The Team-One API can be operated in both a "user-scope" mode and in an
// "application-scope" mode .
//
// In the user-scope mode, an API client is acting directly on behalf of a
// Team-One user, and has access to the same content and actions that the
// user has access to. (The user-scope mode is essentially the "Authorization
// Code" and "Implicit" grant types in the OAuth2 specification.)
//
// In the application-scope mode, an API client can perform some actions in a
// "userless" way (i.e., not tied to any paticular user) AND can assume the
// identity of a specific user on a call-by-call basis. (The application-scope
// mode is essentially the "Client Credentials" grant type in the OAuth2
// specification)
//
// Not every API client is allowed to use the application-scope mode, and even
// within the application-scope mode API clients can only access the accounts of
// users that they are authorized for.
//
// More information about the Team-One API can be found at
// [api.intellinote.net](https://api.intellinote.net/rest/api/v2/).
//
// ### About this File
//
// This file demonstrates how to create and manage users and organizations via
// the Team-One API. We will be operating in the application-scope mode (and
// hence your API client must be approved for userless authentication in order
// to successfully execute this script).
//
// The Team-One API is a RESTful web service in which simple plain-text
// (JSON-format) data are exchanged with the Team-One server over HTTP(S). Any
// technology that can send and receive HTTP requests is compatiable with the
// Team-One API.
//
// However, since many developers are at least loosely familiar with it, we will
// use server-side JavaScript (Node.js) to demonstrate how the API is used. (If
// you're not familiar with JavaScript you can treat this file as "pseudo-code"
// while translating the logic to your language of choice.)
//
// We'll write this example in a "literate programming"-style. This file is a valid
// JavaScript program that can be directly executed. (See the README
// for instructions.) This file is also heavily annotated (via standard
// JavaScript comments) which can be read directly and used to generate an
// annotated web-based view of the code. (See the README for instructions on
// this also.)
//
// ---
// ## The Program
//
// ### A Note on Structure
//
// To make it easier to follow the logic, this program is
// presented in the following order:
//
// 1. [Imports](#imports) - a brief preamble that loads the external libraries
//    we'll need.
//
// 2. [Main](#main) - a `main` method that both drives the program and provides
//    a high-level overview of the steps in the process.
//
// 3. [API Methods](#api-methods) - functions (called from `main`) that
//    implement the actual interaction with the Team-One server. These provide
//    detailed examples of how to invoke the Team-One API to perform various
//    functions.
//
// 4. [Utility Methods](#utility-methods) - a few utility functions that make it
//    easier to write the rest of the code.
//
// 5. [Execution](#execution) - calling `main()` to actually execute the script.


// ### Imports
//
// In order to make this example easier to write (and read), we'll use two
// external libraries. (These can be automatically installed for you by `npm`.)

// We'll use the popular [`request`](https://github.com/request/request) module
// as our HTTP client.
var request   = require("request");

// We'll use this `Sequencer` object  (from
// [`inote-util`](https://github.com/intellinote/inote-util)) to "flatten" what
// would otherwise be a deeply-nested sequence of callback functions.
//
// (We'll show you how this works below. It's pretty simple.)
var Sequencer = require("inote-util").Sequencer;

// Finally, we'll use two "core" Node modules to interact with files.
// (but these are actually only used in the `readConfig` method.)
var path      = require("path");
var fs        = require("fs");

// ### Main

// This `main` method is the driver for the rest of the program, and provides a
// high-level overview of the steps in the process.
//
// (This method is invoked in a line near the bottom of the file. The methods it
// is calling are defined below.)

function main () {

  // #### 0. Setup.

  // This `Sequencer` utility lets us "flatten" a deeply nested callback tree.
  // See the [footnote below](#note-1) for more information.

  var S = new Sequencer();

  // Every API client will have different `client_id` and `client_secret` values.
  // To avoid hard-coding them, we'll declare this `config` object:

  var config = null;

  // ...and read them from an external configuration file:

  S.first(function(next) {
    console.log("\nReading configuration file...");
    config = readConfig();
    console.log("...read\n" + JSON.stringify(config,null,2) + ".");
    next();
  });


  // #### 1. Authenticate.

  // In order to make any API calls, we'll need an (OAuth2) "access token".

  // This access token will be passed in an `Authorization` header to
  // identify the API client.

  var accessToken = null;

  // Since we don't have an access token yet, we can obtain one by
  // authenticating to the Team-One API. We'll authenticate in the (userless)
  // "application-scope". (See the implementation method below for details.)

  S.then(function(next) {
    console.log("\nAuthenticating as API client...");
    performUserlessLogIn(config.oauth.client_id, config.oauth.client_secret, function (err,response) {
      exitIfError(err);
      console.log("...performUserlessLogIn returned\n" + JSON.stringify(response,null,2) + ".");
      // The response will contain an OAuth2 `access_token` and `refresh_token`.
      // We'll save the access token to use below.
      accessToken = response.access_token;
      next();
    });
  });


  // #### 2. Create the admin user.

  // In Team-One, every _organization_ is created by a specific _user_, who
  // becomes the "owner" or administrator of that organization.

  // Let's define that user:

  var adminUser = {
    given_name: "Adam",
    family_name: "Admin",
    email: randomEmail("Adam","Admin")
  }

  // ...and create it using the API:

  S.then(function(next) {
    console.log("\nCreating admin user "+adminUser.email+"...");
    createUser( accessToken, adminUser.given_name, adminUser.family_name, adminUser.email, function (err, response) {
      exitIfError(err);
      console.log("...createUser returned\n" + JSON.stringify(response,null,2));
      // The response will contain the unique identifier assigned to that user.
      // We'll add that to our `adminUser` object for later use.
      adminUser.user_id = response.user_id;
      next();
    });
  });


  // #### 3. Create the organization.

  // Now we can create the new organization.

  // Let's define our simple organization:

  var org = {
    name: "TestOrg"
  }

  // ...and create it via the API:

  S.then(function(next) {
    console.log("\nCreating org (while acting as admin user)...");
    createOrg( accessToken, org.name, adminUser.user_id, function (err, response) {
      exitIfError(err);
      console.log("...createOrg returned\n" + JSON.stringify(response,null,2));
      // The response will contain the unique identifier assigned to that
      // organization. We'll add that to our `org` object for later use.
      org.org_id = response.org_id;
      next();
    });
  });


  // #### 4. Create more users

  // Let's define a few more users to work with:

  var moreUsers = [
    { given_name: "Antoinette", family_name: "Meyer",  email: randomEmail("Antoinette","Meyer") },
    { given_name: "Kirk",       family_name: "Santos", email: randomEmail("Kirk","Santos") },
    { given_name: "Donald",     family_name: "Ortega", email: randomEmail("Donald","Ortega") },
    { given_name: "Sherry",     family_name: "Ball",   email: randomEmail("Sherry","Ball") }
  ]

  // Previously we created one user at a time (Adam Admin) . We can also create
  // several users, in batch, by submitting an array of user records.

  S.then(function(next) {
    console.log("\nCreating more users...");
    createUsers( accessToken, moreUsers, function (err, response) {
      exitIfError(err);
      console.log("...createUsers returned\n" + JSON.stringify(response,null,2));
      // When users are created in batch, we get back a list of responses. Each
      // response contains a `status_code` and `body` attribute, which
      // approximates the response to a single create-user call.
      for(var i=0;i<response.length;i++) {
        moreUsers[i].user_id = response[i].body.user_id;
      }
      next();
    });
  });


  // #### 5. Add users to the organization

  // Now let's add those users to the organization. There are a few ways to do
  // this, so we'll show a few examples.

  // ##### 5a. Add by `user_id`.

  // We can add a user to the organization based on the `org_id` and `user_id`:

  S.then(function(next) {
    console.log("\nAdding user " + moreUsers[0].email + " to org (via user_id)...");
    addUserToOrg( accessToken, org.org_id, moreUsers[0].user_id, function (err, response) {
      exitIfError(err);
      console.log("...addUserToOrg returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });


  // ##### 5b. Add by `email`.

  // We can also add a user to the organization based on the `org_id` and *`email` address*:

  S.then(function(next) {
    console.log("\nAdding user " + moreUsers[1].email + " to org (via email address)...");
    addUserToOrg( accessToken, org.org_id, moreUsers[1].email, function (err, response) {
      exitIfError(err);
      console.log("...addUserToOrg returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });


  // ##### 5c. Add several at once.

  // We can also add several users to the organization at a time (by passing an
  // array of `user_id` and/or `email` values):

  S.then(function(next) {
    console.log("\nAdding multiple users to the org in one call...");
    addUsersToOrg( accessToken, org.org_id, [moreUsers[2].email, moreUsers[3].user_id], function (err, response) {
      exitIfError(err);
      console.log("...addUsersToOrg returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });


  // ##### 5d. Fetch the member list.

  // Let's grab the list of members in the organization, just to see what we
  // have so far:

  S.then(function(next) {
    console.log("\nFetching list of current org members...");
    getOrgMembers( accessToken, org.org_id, function (err, response) {
      exitIfError(err);
      console.log("...getOrgMembers returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });


  // #### 6. Modify the organization's membership.

  // Now let's make some changes to the organization's membership.

  // ##### 6a. Change a user's role.

  // We can promote a user to the `ADMIN` role:

  S.then(function(next) {
    console.log("\nChanging user " + moreUsers[1].email + "'s role to ADMIN...");
    changeUserRoleInOrg( accessToken, org.org_id, moreUsers[1].user_id, "ADMIN", function (err, response) {
      exitIfError(err);
      console.log("...changeUserRoleInOrg returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });

  // (Valid roles include `FULL`, for a "regular" member, and `ADMIN`.)


  // ##### 6b. Remove a user from the organization.

  // We can also remove one or more users from the organization:

  S.then(function(next) {
    console.log("\nRemoving user " + moreUsers[2].email + " from org...");
    removeUserFromOrg( accessToken, org.org_id, moreUsers[2].user_id, function (err, response) {
      exitIfError(err);
      console.log("...removeUserFromOrg returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });


  // ##### 6c. Fetch the member list.

  // Let's grab the list of members again to see our changes:

  S.then(function(next) {
    console.log("\nFetching list of current org members...");
    getOrgMembers( accessToken, org.org_id, function (err, response) {
      exitIfError(err);
      console.log("...getOrgMembers returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });


  // #### 7. Modify a user's data.

  // We can also use the API to modify an individual user's data:

  S.then(function(next) {
    console.log("\nModifying user " + moreUsers[3].user_id + "...");
    update = {
      given_name: "Nancy",
      family_name: "May",
      email: randomEmail("Nancy","May")
    }
    updateUser( accessToken, moreUsers[3].user_id, update, function (err, response) {
      exitIfError(err);
      console.log("...updateUser returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });

  // Let's fetch that user's information to see our changes:

  S.then(function(next) {
    console.log("Fetching user " + moreUsers[3].user_id + "...");
    getUser( accessToken, moreUsers[3].user_id, function (err, response) {
      exitIfError(err);
      console.log("...getUser returned\n" + JSON.stringify(response,null,2));
      next();
    });
  });

  // #### 8. And now we're done.

  S.finally(function() {
    console.log("\nAll Done.\n");
  });

}

// ### API Methods

// This section contains functions that implement the client side of the
// Team-One REST API.

// See [api.intellinote.net](https://api.intellinote.net/rest/api/v2/) for
// an interactive reference to, and much more information about,
// these and other Team-One API methods.


// #### performUserlessLogIn

// [POST /rest/auth/oauth2/access](https://api.intellinote.net/rest/content/examples#perform-a-userless-application-level-log-in)

/**
 * Using the given `clientId` and `clientSecret` parameters,
 * perform a "userless" (`client_credentials`-type) OAuth2
 * authentication and return the generated `access_token` and
 * `refresh_token`.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be a JSON object with `access_token`
 * and `refresh_token` attributes.
 *
 * Note that this method simply implements the client-side of a
 * standard OAuth2 authentication protocol. There is nothing
 * Team-One-specific about it (other than the URL).
 */
function performUserlessLogIn (clientId, clientSecret, callback) {

  // Since this is the first time we use it, let's
  // briefly explain the request parameters (as used by the
  //`request` library).

  // `params` contains a simple description of the HTTP request
  // to be submitted.

  var params = {

    // `url` is the URL to hit. This value _may_ include
    // a query string if necessary.

    "url": "https://api.intellinote.net/rest/auth/oauth2/access",

    // `form` is the request body. In this and all other examples in this file,
    // our request body will consist of a JSON object. They look like regular
    // JavaScript objects here. Over the wire they will be the standard
    // (stringified) JSON representation of that JavaScript object.

    // In this case we'll submit the standard OAuth2 request
    // body for the `client_credentials` grant.

    "form": {
      "client_id": clientId,
      "client_secret": clientSecret,
      "grant_type": "client_credentials"
    },

    // `headers` is a set of HTTP headers to include in the
    // request. Here we specify `Content-Type`. Later we'll
    // also include the `Authorization` header to authenticate
    // to the server.

    "headers": {
      "Content-Type": "text/json"
    }
  }

  // `request` has `get`, `post`, `put`, etc. methods that do
  // just what you'd think they do.


  request.post(params, function (e, r, b) {

    // The callback signature is `(err,response,body)`.
    // We'll use our `readResponseAsJSON` utility method
    // to handle the response.

    readResponseAsJSON(e, r, b, callback);
  });
}

// #### createUser

// [POST /rest/v2/user](https://api.intellinote.net/rest/api/v2/#!/users/post_user)

/**
 * Use the Team-One API to create a new user record
 * based on the given attributes.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be a JSON object with a `user_id`
 * attribute, indicating the identifier assigned to the newly
 * created user resource.
 */
function createUser (accessToken, firstName, lastName, emailAddress, callback) {
  var params = {
    "url": "https://api.intellinote.net/rest/v2/user",
    "form": {
      // Note that one could include a `password` attribute here to create a
      // password for this user.
      // Other valid attributes include `job_title`, `tel_work` and `tel_cell`.
      "given_name": firstName,
      "family_name": lastName,
      "email": emailAddress
    },
    "headers": {
      "Content-Type": "text/json",
      // In this and all subsequent API methods, we'll include an `Authorization`
      // header containing the access token (as described in the OAuth2
      // specification.)
      "Authorization": "Bearer "+accessToken
    }
  }
  request.post(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}


// #### createUsers

// [POST /rest/v2/users](https://api.intellinote.net/rest/api/v2/#!/users/post_users)

/**
 * Use the Team-One API to create _several_ new user
 * records based on an array of user data objects.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be a JSON array containing objects
 * of the the form `{status_code:...,body:...}`--one for each
 * element in the submitted array.
 *
 * Each object reprsent the API's response to the creation of
 * the corresponding user.
 */
function createUsers (accessToken, userList, callback) {
  var params = {
    "url": "https://api.intellinote.net/rest/v2/users",
    // In this case our payload
    // consists of a JSON object with
    // a `users` attribute, containing
    // a list of user records.
    "form": {
      "users": userList
    },
    "headers": {
      "Content-Type": "text/json",
      "Authorization": "Bearer "+accessToken
    }
  }
  request.post(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}


// #### getUser

// [GET /rest/v2/user/{userId}](https://api.intellinote.net/rest/api/v2/#!/users/get_user_user_id)

/**
 * Use the Team-One API to fetch the specified
 * user resource.
 *
 * The `userId` parameter may be `user_id` or
 * `email` value (although `user_id` may be slightly
 * more efficient.)
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be a JSON object encapsulating
 * information about the user.
 */
function getUser (accessToken, userId, callback) {
  var params = {
    "url": "https://api.intellinote.net/rest/v2/user/"+userId,
    "headers": {
      "Authorization": "Bearer "+accessToken
    }
  }
  request.get(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}

// #### updateUser

// [PUT /rest/v2/user/{userId}](https://api.intellinote.net/rest/api/v2/#!/users/patch_user_user_id)

/**
 * Use the Team-One API to update the specified user's data.
 *
 * The `update` parameter is a map of user attributes to update.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be empty.
 */
function updateUser (accessToken, userId, update, callback) {
  var params = {
    "url": "https://api.intellinote.net/rest/v2/user/"+userId,
    "form": update,
    "headers": {
      "Content-Type": "text/json",
      "Authorization": "Bearer "+accessToken
    }
  }
  request.put(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}

// #### createOrg

// [POST /rest/v2/org?_as_user_id={userId}](https://api.intellinote.net/rest/api/v2/#!/organizations/post_org)

/**
 * Use the Team-One API to create a new organization resource.
 *
 * The `orgName` parameter is the name that will be assigned to the org.
 *
 * The `orgAdmin` parameter is the `user_id` or `email` attribute of
 * the user that will be the "owner" of the org.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be a JSON object containing
 * an `org_id` attribute.
 */
function createOrg (accessToken, orgName, orgAdmin, callback) {
  var params = {
    // We add the `_as_user_id` parameter to tell the API that we
    // want to assume the identify at the specified user when
    // creating the org.
    //
    // This only works because when we created the user (above) we
    // were implicitly granted permission to take on that user's identity
    // when acting in the application-scope mode.
    "url": "https://api.intellinote.net/rest/v2/org?_as_user_id="+orgAdmin,
    "form": {
      "name": orgName
    },
    "headers": {
      "Content-Type": "text/json",
      "Authorization": "Bearer "+accessToken
    }
  }
  request.post(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}


// #### getOrgMembers

// [GET /rest/v2/org/{orgId}/members](https://api.intellinote.net/rest/api/v2/#!/organizations/get_org_org_id_members)

/**
 * Use the Team-One API to obtain a
 * list of users that are members of the
 * specified organization.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will contain an array of user
 * resources.
 */
function getOrgMembers (accessToken, orgId, callback) {
  var params = {
    "url": "https://api.intellinote.net/rest/v2/org/"+orgId+"/members",
    "headers": {
      "Authorization": "Bearer "+accessToken
    }
  }
  request.get(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}

// #### addUserToOrg

// [POST /rest/v2/org/{orgId}/member/{userId}](https://api.intellinote.net/rest/api/v2/#!/organizations/post_org_org_id_member_user_id)

/**
 * Use the Team-One API to add a
 * user to an organization.
 *
 * The `userId` parameter is the `user_id` or `email` attribute of
 * the user to be added to the org.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be empty.
 */
function addUserToOrg (accessToken, orgId, userId, callback) {
  var params = {
    "url": "https://api.intellinote.net/rest/v2/org/" + orgId + "/member/" + userId,
    "form": {
      // Valid access types include `FULL` and `ADMIN`.
      "access_type": "FULL"
    },
    "headers": {
      "Content-Type": "text/json",
      "Authorization": "Bearer "+accessToken
    }
  }
  request.post(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}

// #### addUsersToOrg

// [POST /rest/v2/org/{orgId}/members](https://api.intellinote.net/rest/api/v2/#!/organizations/post_org_org_id_members)

/**
 * Use the Team-One API to add _several_
 * users to an organization.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be a JSON array containing objects
 * of the the form `{status_code:...,body:...}`--one for each
 * element in the submitted array.
 *
 * Each object reprsent the API's response to the creation of
 * the corresponding user.
 */
function addUsersToOrg (accessToken, orgId, userIds, callback) {

  // In this case our payload
  // consists of a JSON object with
  // a `users` attribute, containing
  // a list of `user_id` and `access_type`
  // pairs.
  //
  // Despite the name, each `user_id` attribute
  // can be an actual `user_id` or an email address.

  payload = { "users": [] };
  for (var i=0; i<userIds.length; i++) {
    payload.users.push({
      "user_id":userIds[i],
      "access_type":"FULL"
    });
  }
  var params = {
    "url": "https://api.intellinote.net/rest/v2/org/" + orgId + "/members",
    "form": payload,
    "headers": {
      "Content-Type": "text/json",
      "Authorization": "Bearer "+accessToken
    }
  }
  request.post(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}


// #### changeUserRoleInOrg

// [PUT /rest/v2/org/{orgId}/member/{userId}](https://api.intellinote.net/rest/api/v2/#!/organizations/put_org_org_id_member_user_id)

/**
 * Use the Team-One API to change a
 * user's role to an organization.
 *
 * The `userId` parameter is the `user_id` or `email` attribute of
 * the user to be added to the org.
 *
 * The `newRole` parameter may be `FULL` or `ADMIN`.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be empty.
 */
function changeUserRoleInOrg (accessToken, orgId, userId, newRole, callback) {
  var params = {
    "url": "https://api.intellinote.net/rest/v2/org/"+orgId+"/member/"+userId,
    "form": {
      "access_type":newRole
    },
    "headers": {
      "Content-Type": "text/json",
      "Authorization": "Bearer "+accessToken
    }
  }
  request.put(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}


// #### removeUserFromOrg

// [DELETE /rest/v2/org/{orgId}/member/{userId}](https://api.intellinote.net/rest/api/v2/#!/organizations/delete_org_org_id_member_user_id)

/**
 * Use the Team-One API to remove a
 * user from an organization.
 *
 * The `userId` parameter is the `user_id` or `email` attribute of
 * the user to be removed.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be empty.
 */
function removeUserFromOrg (accessToken, orgId, userId, callback) {
  var params = {
    "url": "https://api.intellinote.net/rest/v2/org/" + orgId + "/member/" + userId,
    "form":null,
    "headers": {
      "Authorization": "Bearer "+accessToken
    }
  }
  request.del(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}


// #### removeUsersFromOrg

// [DELETE /rest/v2/org/{orgId}/members](https://api.intellinote.net/rest/api/v2/#!/organizations/delete_org_org_id_members)

/**
 * Use the Team-One API to remove a
 * user to from an organization.
 *
 * The `userId` parameter is the `user_id` or `email` attribute of
 * the user to be removed.
 *
 * The `callback` parameter should be a method with
 * the signature `(err,body)` where `err` is the error
 * (if any) and `body` is the API's response.
 *
 * The API's response will be a JSON array containing objects
 * of the the form `{status_code:...,body:...}`--one for each
 * element in the submitted array.
 *
 */
function removeUsersFromOrg (accessToken, orgId, userIds, callback) {

  // In this case our payload
  // consists of a JSON object with
  // a `users` attribute, containing
  // a list of `user_id` values.
  //
  // Despite the name, each `user_id` attribute
  // can be an actual `user_id` or an email address.

  payload = { "users": [] };
  for (var i=0; i<userIds.length; i++) {
    payload.users.push({
      "user_id":userIds[i]
    });
  }
  var params = {
    "url": "https://api.intellinote.net/rest/v2/org/" + orgId + "/members",
    "form": payload,
    "headers": {
      "Content-Type": "text/json",
      "Authorization": "Bearer "+accessToken
    }
  }
  request.del(params, function (e, r, b) {
    readResponseAsJSON(e, r, b, callback);
  });
}


// ### Utility Methods

// To simplify the rest of this program, here we define
// a handful of utility methods that are used above.

// #### readConfig

// This example program relies on a configuration file (named
// `config.json` and found in this repository's root directory).

// The `readConfig` method loads this configuration file and
// returns its contents.

/**
 * Loads a configuration file from `../config.json`.
 *
 * Returns a map of `config.json`'s content.
 */
function readConfig () {

  var configFile = path.join(__dirname, "..", "config.json");

  // If the config file is not found or the file does not contain
  // a valid JSON document, we'll exit with an error message.
  // Otherwise we'll just return the contents of the file
  // (parsed as a JS object).

  if (!fs.existsSync(configFile)) {
    console.error("ERROR: Configuration file not found.");
    console.error("       This script requires a configuration file at:");
    console.error("          " + configFile);
    console.error("       Please set up a configuration file before continuing.");
    console.error("");
    console.error("       See config.json.template for guidance.");
    process.exit(2);
  } else {
    try {
      return require(configFile);
    } catch (err) {
      console.error("ERROR: Encountered an error while parsing configuration file at:")
      console.error("          " + configFile);
      console.error("       The error was:");
      console.error("          " + err);
      console.error("       Please address the issue before continuing.");
      console.error("");
      console.error("       Note that the configuration MUST be a valid JSON document.");
      console.error("");
      console.error("       See config.json.template for guidance.");
      process.exit(3);
    }
  }
}


// #### readResponseAsJSON

// Most of our API requests will send and receive data
// as JSON documents.

// `readResponseAsJSON` parses a JSON object
// from an HTTP response (or yields an error if something went wrong
// with the request.)

/**
 * Handles an HTTP response.
 *
 * The `err`, `response` and `body` parameters are the objects
 * returned by `request`.
 *
 * The `callback` parameter is a callback method with the
 * signature `(err,json)` where `err` is the error (if any)
 * and `json` is a JavaScript object parsed from the body
 * of the response (if any).
 *
 * If the response is neither `null` nor a valid JSON document,
 * an error is raised.
 *
 */
function readResponseAsJSON (err, response, body, callback) {
  if (err) {
    callback(err);
  } else if (!response) {
    callback(new Error("Expected non-null response object."));
  } else if (response.statusCode < 200 || response.statusCode > 299) {
    callback(new Error("Expected 2xx status, found " + response.statusCode + "."));
  } else if (!body) {
    if (response.statusCode == 204) {
      callback(null,null);
    } else {
      callback(new Error("Expected non-null response body (for HTTP status code " + response.statusCode + ")."));
    }
  } else {
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        callback(e);
      }
    }
    callback(null, body);
  }
}


// #### randomEmail

// In Intellinote/Team-One, email addresses must be unique.
// So that we can run this program multiple times, we'll
// use the `randomEmail` method to generate a (probably) unique
// email address on-the-fly.

function randomEmail (fname, lname, domain) {
  if(!fname) fname = "jane";
  if(!lname) lname = "smith";
  if(!domain) domain = "example.com";
  var random = "-" + (Date.now()%10000) + "" +  Math.round(Math.random()*10000);
  return fname.toLowerCase().charAt(0) + lname.toLowerCase() + random + "@" + domain;
}


// #### exitIfError

// If `err` is not `null`, it is printed
// to STDERR and the program exits with
// a non-0 exit code.

function exitIfError (err) {
  if(err) {
    console.error("ERROR:",err);
    process.exit(1);
  }
}


// ### Execution

// Here we invoke the `main` method to start the processing.

// If (a) the requsite external libaries have been loaded
// (via `npm install`, for example) and (b) the `config.json`
// file is set up properly with a valid `client_id` and
// `client_secret` pair, you can run this program with the
// command:
//
//     node lib/manage-orgs-and-users.js
//
// This should print to STDOUT output similiar to that
// [seen below](#example-output).

main();

// ---
// ## Example Output

// Here's an example of the output when the program is run:

/*


Reading configuration file...
...read
{
  "oauth": {
    "client_id": "REDACTED",
    "client_secret": "REDACTED"
  }
}

Authenticating as API client...
...performUserlessLogIn returned
{
  "refresh_token": "REDACTED",
  "access_token": "REDACTED",
  "token_type": "bearer"
}

Creating admin user aadmin-69698513@example.com...
...createUser returned
{
  "user_id": "user31639",
  "refresh_token": "REDACTED"
}

Creating org (while acting as admin user)...
...createOrg returned
{
  "org_id": 25817
}

Creating more users...
...createUsers returned
[
  {
    "status": 201,
    "body": {
      "user_id": "user31640",
      "refresh_token": "REDACTED"
    },
    "error": null
  },
  {
    "status": 201,
    "body": {
      "user_id": "user31641",
      "refresh_token": "REDACTED"
    },
    "error": null
  },
  {
    "status": 201,
    "body": {
      "user_id": "user31642",
      "refresh_token": "REDACTED"
    },
    "error": null
  },
  {
    "status": 201,
    "body": {
      "user_id": "user31643",
      "refresh_token": "REDACTED"
    },
    "error": null
  }
]

Adding user ameyer-69693698@example.com to org (via user_id)...
...addUserToOrg returned
{}

Adding user ksantos-6969743@example.com to org (via email address)...
...addUserToOrg returned
{}

Adding multiple users to the org in one call...
...addUsersToOrg returned
[
  {
    "status": 201,
    "body": {},
    "error": null
  },
  {
    "status": 201,
    "body": {},
    "error": null
  }
]

Fetching list of current org members...
...getOrgMembers returned
[
  {
    "user_id": "user31639",
    "given_name": "Adam",
    "family_name": "Admin",
    "email": "aadmin-69698513@example.com",
    "screen_name": "adama31639",
    "avatar": "https://app.intellinote.net/media/v1/user/user31639/avatar.png",
    "access_type": "ADMIN"
  },
  {
    "user_id": "user31643",
    "given_name": "Sherry",
    "family_name": "Ball",
    "email": "sball-69696687@example.com",
    "screen_name": "sherryb31643",
    "avatar": "https://app.intellinote.net/media/v1/user/user31643/avatar.png",
    "access_type": "FULL"
  },
  {
    "user_id": "user31640",
    "given_name": "Antoinette",
    "family_name": "Meyer",
    "email": "ameyer-69693698@example.com",
    "screen_name": "antoinettem31640",
    "avatar": "https://app.intellinote.net/media/v1/user/user31640/avatar.png",
    "access_type": "FULL"
  },
  {
    "user_id": "user31642",
    "given_name": "Donald",
    "family_name": "Ortega",
    "email": "dortega-69696965@example.com",
    "screen_name": "donaldo31642",
    "avatar": "https://app.intellinote.net/media/v1/user/user31642/avatar.png",
    "access_type": "FULL"
  },
  {
    "user_id": "user31641",
    "given_name": "Kirk",
    "family_name": "Santos",
    "email": "ksantos-6969743@example.com",
    "screen_name": "kirks31641",
    "avatar": "https://app.intellinote.net/media/v1/user/user31641/avatar.png",
    "access_type": "FULL"
  }
]

Changing user ksantos-6969743@example.com's role to ADMIN...
...changeUserRoleInOrg returned
null

Removing user dortega-69696965@example.com from org...
...removeUserFromOrg returned
null

Fetching list of current org members...
...getOrgMembers returned
[
  {
    "user_id": "user31639",
    "given_name": "Adam",
    "family_name": "Admin",
    "email": "aadmin-69698513@example.com",
    "screen_name": "adama31639",
    "avatar": "https://app.intellinote.net/media/v1/user/user31639/avatar.png",
    "access_type": "ADMIN"
  },
  {
    "user_id": "user31643",
    "given_name": "Sherry",
    "family_name": "Ball",
    "email": "sball-69696687@example.com",
    "screen_name": "sherryb31643",
    "avatar": "https://app.intellinote.net/media/v1/user/user31643/avatar.png",
    "access_type": "FULL"
  },
  {
    "user_id": "user31640",
    "given_name": "Antoinette",
    "family_name": "Meyer",
    "email": "ameyer-69693698@example.com",
    "screen_name": "antoinettem31640",
    "avatar": "https://app.intellinote.net/media/v1/user/user31640/avatar.png",
    "access_type": "FULL"
  },
  {
    "user_id": "user31641",
    "given_name": "Kirk",
    "family_name": "Santos",
    "email": "ksantos-6969743@example.com",
    "screen_name": "kirks31641",
    "avatar": "https://app.intellinote.net/media/v1/user/user31641/avatar.png",
    "access_type": "ADMIN"
  }
]

Modifying user user31643...
...updateUser returned
null

Fetching user user31643...
...getUser returned
{
  "user_id": "user31643",
  "given_name": "Nancy",
  "family_name": "May",
  "email": "nmay-57206616@example.com",
  "screen_name": "sherryb31643",
  "avatar": "https://app.intellinote.net/media/v1/user/user31643/avatar.png"
}

All Done.

*/


// ---
// ## footnotes
//
// **A note about the `Sequencer`** <a name="note-1"></a>
//
// JavaScript/Node.js relies heavily on "callback functions" to handle
// asynchronous activities (like waiting on a response from the server).
// Rather than `return`ing a value, asynchronous methods accept a `callback`
// function as a parameter. When the asynchronous action is complete the
// callback method is invoked (passing in the results of the operation--stuff
// that might normally be `return`ed by a synchronous function.) That's nifty
// (for reasons too complicated to explain here), but can lead to some ugly
// code when you need to string together several callback functions. For
// example:
//
//     methodOne( function() {
//       // ...do...
//       // ...stuff...
//       methodTwo( function() {
//         // ...do...
//         // ...stuff...
//         methodThree( function() {
//           // ...do...
//           // ...stuff...
//           methodFour( function() {
//             // ...do...
//             // ...stuff...
//             andSoOn();
//           });
//         });
//       });
//     });
//
// The `Sequencer` object allows us to flatten the calls like this:
//
//     S = new Sequencer();
//     S.first(function(next) {
//       methodOne(next);
//     });
//     S.then(function(next) {
//       // ...do...
//       // ...stuff...
//       methodTwo(next);
//     });
//     S.then(function(next) {
//       // ...do...
//       // ...stuff...
//       methodThree(next);
//     });
//     S.then(function(next) {
//       // ...do...
//       // ...stuff...
//       methodFour(next);
//     });
//     S.finally(andSoOn());
//
// so there is less nesting.
//
// <!-- ignore this --><style> h3, h4, h5, h6 { text-transform: none} .pilcrow { display: none; } .annotation ul, .annotation ol { margin: 0; } div.annotation { padding-top:0 !important; padding-bottom:0 !important;} .annotation pre { -moz-box-shadow: none !important; -webkit-box-shadow: none !important; box-shadow: none !important; font-size: 0.8em !important; border: none;} @media print { pre {margin-left: 2em !important; padding-top:0.8em;}} </style><!-- /ignore this -->
