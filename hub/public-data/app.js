// =============================================================================
// This is meant to be a server that is a hub app. You can register your own app at https://developer.broadsoftlabs.com
// See the readme for more details
// =============================================================================

// require the packages we need (these need to be installed with "npm install")
var fs = require('fs');
var cors = require('cors');
var express = require('express');
var app = express();

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

//8080 is the default port for heroku but you can use any port you wish
var port = process.env.PORT || 8080; // set our port

// Enable the request router
var router = express.Router(); // get an instance of the express Router

router.options('/*', function(req, res) {
  res.send(200, 'CHECKOUT,CONNECT,COPY,DELETE,GET,HEAD,LOCK,M-SEARCH,MERGE,MKACTIVITY,MKCALENDAR,MKCOL,MOVE,NOTIFY,PATCH,POST,PROPFIND,PROPPATCH,PURGE,PUT,REPORT,SEARCH,SUBSCRIBE,TRACE,UNLOCK,UNSUBSCRIBE');
});

// ROUTES FOR OUR API
// all routes are prefixed automatically with /v1
// They currently also need /youAppName in them. This must match exactly the name you added in the developer portal sandbox
// =============================================================================

// test route to make sure everything is working (accessed at GET http://localhost:8080/test)
router.get('/test', function(req, res) {
  console.log('You called the test route!');
  res.json({message: 'hooray! welcome to our api!'});
});

// This is where you set the notifications number to be shown
router.post('/helloWorld/notifications', function(req, res) {
  console.log('We are requesting the notifications count');
  res.send(200, {count: 99});
});


router.post('/helloWorld/timeline', function(req, res) {
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


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /v1 and we need to actually use the routes we made (app.use)
app.use('/v1', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
