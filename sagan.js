'use strict';

const request = require('request');

function converse(input, callback) {

  var api = '/v2/api/skillSets/' + input.avatar + '/converse';
  var url = input.url;

  var location = input.location;
  var lat = location.split(',')[0].trim();
  var long = location.split(',')[1].trim();

  request.post({
    url: `${url}${api}?api_key=${input.wpa}`,
    json: {
      'text': input.text,
      'language': input.language,
      'userID': input.userid,
      'deviceType': 'wa_elect_chatbot_web',
      'additionalInformation': {
        'context': {
          'user': {
            'id': input.userid,
          },
          'application': {
            'id': 'wa_elect_chatbot_web',
            attributes: {
              location: {
                lat: lat,
                long: long,
              },
            },
          }
        }
      }
    }
  }, function(err, response, body) {
    if (err || (body === undefined)) {
      callback('no response');
    } else {
      callback(null, body);
    }
  });
}

module.exports = {
  converse: converse
};

// converse('hi', (err, result) => {
//   console.log(result);
// });
