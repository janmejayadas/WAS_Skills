/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var {converse} = require('./sagan');
const AuthorizationV1 = require('watson-developer-cloud/authorization/v1');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  if (req && req.body && req.body.input && req.body.input.text && req.body.input.text !== '') {
    converse(req.body.input, (err, result) => {
      if (err) {
        return res.status(err.code || 500).json(err);
      }
      //checkResultForLocationInfo(result);
      return res.json(updateMessage(result));
    });
  } else {
    return res.json({
      speech: {
        text: `Hi, what can I do for you?`
      }
    });
  }
});

const SpeechToText = new SpeechToTextV1({
  username: process.env.WATSON_SPEECH_TO_TEXT_USERNAME,
  password: process.env.WATSON_SPEECH_TO_TEXT_PASSWORD,
});

//const authService = new AuthorizationV1(SpeechToText.getCredentials());
const sttAuthService = new AuthorizationV1(SpeechToText.getCredentials());

app.use(`/api/speech-to-text/token`, (req, res) => {
  //authService.getToken((error, token) => {
  sttAuthService.getToken((error, token) => {
       if (error) {
         console.log('Error:', error);
       } else {
         res.send(token);
       }
     });
   });

   const TextToSpeech = new TextToSpeechV1({
     username: process.env.WATSON_TEXT_TO_SPEECH_USERNAME,
     password: process.env.WATSON_TEXT_TO_SPEECH_PASSWORD,
   });

   const ttsAuthService = new AuthorizationV1(TextToSpeech.getCredentials());

   app.use(`/api/text-to-speech/token`, (req, res) => {
     ttsAuthService.getToken((error, token) => {
    if (error) {
      console.log('Error:', error);
    } else {
      res.send(token);
    }
  });
});


/**
 * Updates the response text using the intent confidence
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(response) {
  //response.output = {text: response.speech.text};
  return response;
}

function checkResultForLocationInfo(result) {
  if (result.expertise.name) {
    if (result.expertise.name === "restaurant") {
      var card = result.card
      if (card) {
        if (card.content[0]) {
          process.env.lat = card.content[0].latitude
          process.env.long = card.content[0].longitude
        }
      }
    }
  }
}

module.exports = app;
