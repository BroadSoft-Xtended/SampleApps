// =============================================================================
// This is meant to be a server that is a hub app. You can register your own app at https://developer.broadsoftlabs.com
// See the readme for more details
// YOUR APP HAS TO BE SET TO PRIVATE
// =============================================================================

// require the packages we need (these need to be installed with "npm install")
var fs = require('fs');
var cors = require('cors');
var express = require('express');
var app = express();
var rp = require('request-promise');
var cookieParser = require('cookie-parser')
var session = require('express-session')

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))


//You will need to enable cors in order to receive request from our servers
app.use(cors({
  "origin": "https://hub-sandbox.broadsoftlabs.com:8443",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": true,
  "credentials": true
}));

var bodyParser = require('body-parser');

// Allow use of webpages in the public diectory
app.use('/', express.static(__dirname + '/public'));


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser())

//8080 is the default port for heroku but you can use any port you wish
var port = process.env.PORT || 8080; // set our port

// Enable the request router
var router = express.Router(); // get an instance of the express Router

router.options('/*', function(req, res) {
  res.send(200, 'CHECKOUT,CONNECT,COPY,DELETE,GET,HEAD,LOCK,M-SEARCH,MERGE,MKACTIVITY,MKCALENDAR,MKCOL,MOVE,NOTIFY,PATCH,POST,PROPFIND,PROPPATCH,PURGE,PUT,REPORT,SEARCH,SUBSCRIBE,TRACE,UNLOCK,UNSUBSCRIBE');
});

// ROUTES FOR OUR API
// They currently also need /youAppName in them. We use :appName in the routes so that you can call your app anything you want in the dev portal
// =============================================================================

// test route to make sure everything is working (accessed at GET http://localhost:8080/test)
router.get('/test', function(req, res) {
  console.log('You called the test route!');
  res.json({message: 'hooray! welcome to our api!'});
});

// This is where you set the notifications number to be shown
router.post('/:appName/notifications', function(req, res) {
  // const hubLogintoken = req.params.hubLogintoken; req.cookies? req.get('Cookie')
  console.log('We are requesting the notifications count');
  res.send(200, {count: 99});
});


router.post('/:appName/timeline', function(req, res) {
  console.log('We are requesting the contextual data', req.body);
  var emails = req.body.context.emails;

  var timeline = {
    items: [{
      date: new Date(),
      title: 'My test record',
      description: 'My description: user emails you are talking to:' + emails,
      webLink: 'https://www.google.com'
    }]
  };

  return res.json(timeline);
});

router.get('/:appName/authenticate', function(req, res) {
  console.log('/authenticate', req.query);
  req.session.hubLoginToken = req.query.hubLoginToken;
  res.writeHead(307, {
    'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0',
    Location: '/signup.html'
  });
  res.end();
});

router.post('/signupUser', function(req, res) {
  console.log('signupUser params', req.body);

  var options = {
    method: 'POST',
    uri: 'https://core.broadsoftlabs.com/v1/HackathonPrivate/jodonnell@broadsoft.com/auth',
    body: {
      hubLoginToken: req.session.hubLoginToken,
      auth: 'jodonnell@broadsoft.com'
    },
    json: true
  };

  rp(options).then(function(result) {
    res.redirect(result.url);
  }).catch(function(error) {
    console.log('Could not post to hub', error.message);
    res.send(500, error);
  })
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /v1 and we need to actually use the routes we made (app.use)
app.use(router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
console.log('cache test2');



//
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
