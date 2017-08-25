var api = require('./lib/botApi.js');

var config = {
  apiKey: process.env.KEY,
  orgId: process.env.ORG_ID
};

var currentAnswer = 2;
var questionAsked = false;

function getMathQuestion () {
  var number1 = Math.floor(Math.random()*1000 + 100);
  var number2 = Math.floor(Math.random()*1000 + 100);
  currentAnswer = number1 + number2;
  return 'What is ' + number1 + ' + ' + number2 + '?';
}

api.incomingMessage = function incomingMessage (message, user) {
  console.log('The incoming message', message, user);

  if(message.match(/\/math/)){
    api.reply(getMathQuestion());
    questionAsked = true;
  }
  else if(questionAsked){
    if(message == currentAnswer){
      api.reply('You are correct!');
    }
    else{
      api.reply('Sorry, that is incorrect');
    }

    questionAsked = false;
    console.log('They did not say /math', message);
  }
}

api.launchBot(config);
