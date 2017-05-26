// =============================================================================
// This is meant to be a server that is a hub app. You can register your own app at https://developer.broadsoftlabs.com
// See the readme for more details
// YOUR APP HAS TO BE SET TO PRIVATE
// =============================================================================

// =============================================================================
// require the packages we need (these need to be installed with "npm install")
// =============================================================================

var fs = require('fs');
var cors = require('cors');
var express = require('express');
var app = express();
var rp = require('request-promise');
var cookieParser = require('cookie-parser')
var session = require('express-session')
var path = require('path');
var _ = require('underscore');

// hard coded auth token for demonstration purposes only
var auth = {
  access_token: 'asdf87sdaf798sdf987asd9f',
  refresh_token: 'dasdfawerwqedqeqewxqwec23'
}
// var auth = 'dsadfasdfasdfasd'
// =============================================================================
// Express app configuration
// =============================================================================

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

//You will need to enable cors in order to receive request from our servers
app.use(cors({
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": true
}));

// If you are doing REST apis, you will need the body-parser to parse response bodies
var bodyParser = require('body-parser');

// use ejs as view engine to render contextual with context parameters
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

// Allow use of webpages in the public diectory
app.use('/', express.static(__dirname + '/public'));

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// This allows you to read and set cookies
app.use(cookieParser())

// returns true if the request is authenticated
var isAuthenticated = function(req) {
  var authParam = req.query.auth || req.body.auth;
  try {
    authParam = JSON.parse(authParam);
  } catch(error) {
  }
  console.log('checking authentication : ', authParam);
  return _.isEqual(auth, authParam);
}

//8080 is the default port for heroku but you can use any port you wish
var port = process.env.PORT || 8080; // set our port

// Enable the request router
var router = express.Router();

// This is required to interface with the Hub api
router.options('/*', function(req, res) {
  res.send(200, 'CHECKOUT,CONNECT,COPY,DELETE,GET,HEAD,LOCK,M-SEARCH,MERGE,MKACTIVITY,MKCALENDAR,MKCOL,MOVE,NOTIFY,PATCH,POST,PROPFIND,PROPPATCH,PURGE,PUT,REPORT,SEARCH,SUBSCRIBE,TRACE,UNLOCK,UNSUBSCRIBE');
});

// =============================================================================
// ROUTES FOR OUR API
// =============================================================================

router.get('/microApp', function(req, res) {
  if(!isAuthenticated(req)) {
    return res.json({message: 'you are not authenticated'});
  }
  console.log('You called the micro app route!');
  res.sendFile(path.join(__dirname + '/public/microApp.html'));
});

router.get('/contextual', function(req, res) {
  if(!isAuthenticated(req)) {
    return res.json({message: 'you are not authenticated'});
  }
  var context = req.query.context;
  try {
    context = JSON.parse(context);
  } catch(error) {
    console.error('could not parse context : ', context);
  }
  console.log('You called the contextual route with context : ', context);
  res.render('contextual', {
    context: context
  });
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/test)
router.get('/test', function(req, res) {
  if(!isAuthenticated(req)) {
    return res.json({message: 'you are not authenticated'});
  }
  console.log('You called the test route!');
  res.json({message: 'hooray! welcome to our api!'});
});

// This is where you set the notifications number to be shown
router.get('/notifications', function(req, res) {
  if(!isAuthenticated(req)) {
    return res.json({message: 'you are not authenticated'});
  }
  // const hubLogintoken = req.query.hubLogintoken;
  // This is used to identify your user. You should save the token and associate it to a user when you authenticate the user
  console.log('We are requesting the notifications count');
  res.send(200, {count: 99});
});

// This gets called when a user tries to enable your app in the app settings page
router.get('/authenticate', function(req, res) {
  // re.query has a few things in it including the hub url
  console.log('/authenticate', req.query);

  // persist the callback so we know which url to call when authentication succeeds
  req.session.callback = req.query.callback;

  // This is needed so the redirect does not get cached. If it is cached, it wont update on chages
  // I want users to go to my signup page once they enable the app
  res.writeHead(307, {
    'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0',
    Location: '/signup.html'
  });
  res.end();
});

// This is the route that is called by the form in public/signup.html. It is sent by the form element in html
router.post('/signupUser', function(req, res) {
  console.log('signupUser params', req.body);

  // Now you have to redirect to hub with your auth token and username. This auth token will get sent back to you on requests from hub.
  var url = req.session.callback + '?auth=' + JSON.stringify(auth) + '&username=' + req.body.username;
  console.log('redirecting to ' + url);
  return res.redirect(url);
});

// =============================================================================
// REGISTER OUR ROUTES -------------------------------
// =============================================================================
app.use(router);

// =============================================================================
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
console.log('cache test2');


// =============================================================================
// PasspotJS Example
// Not used in this app but is a good reference if you want to log the user in with something like google or Facebook
// =============================================================================
//
// var passport = require('passport');
// var requestPromise = require('request-promise');
// var _ = require('underscore');
//
// module.exports = {
//   trivia: [
//     function (req, res, next) {
//       var params = req.allParams();
//       req.session.hubUrl = params.hubUrl;
//       req.session.hubLoginToken = params.hubLoginToken;
//       return passport.authenticate('trivia', sails.config.constants)(req, res, next);
//     }
//   ],
//
//   error: function (req, res) {
//     return res.json({
//       message: 'OAuth error'
//     });
//   },
//
//   authorize: function (req, res) {
//     req.session.username = req.user.userProfile.emails.filter(function(email) {
//       return email.type === 'account';
//     })[0].value;
//     var params = {
//       hubLoginToken: req.session.hubLoginToken,
//       auth: {
//         access_token: CryptoService.encrypt(req.user.accessToken),
//         refresh_token: CryptoService.encrypt(req.user.refreshToken)
//       }
//     };
//
//     var url = req.session.hubUrl + '/v1/trivia/' + req.session.username + '/auth';
//     sails.log(req.session.username + ' : notifying hub of auth : ' + url + '...', params);
//     return requestPromise({
//       method: 'POST',
//       uri: url,
//       body: params,
//       json: true
//     }).then(function(result) {
//       var url = result.url;
//       sails.log(req.session.username + ' : notified - redirecting to ' + url);
//       return res.redirect(url);
//     });
//   }
// }
