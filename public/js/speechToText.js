//const WatsonSpeech = require('watson-speech');

var SpeechToText = (function() {

  var token;
  var customizationID;
  var stream;
  var recording = false;

  function init() {
    document.getElementById('pttButton').addEventListener("click", startStopRecording);

    new Promise((resolve, reject) => {
      fetch(`/api/speech-to-text/token`)
          .then(response => response.text()).then((response) => {
            token = response;
          }).catch((error) => {
            reject(error);
          });
    });
  }

  // Publicly accessible methods defined
  return {
    init: init,
    record: record
  };

  function startStopRecording() {
    if (!recording) {
      let element = document.getElementById('pttButton');
      element.style.backgroundColor = '#fff';
      element.style.color = '#00B4A0';
      element.innerHTML = '<i class="fa fa-stop"></i>';
      recording = true;
      record();
    } else {
      let element = document.getElementById('pttButton');
      element.style.color = '#fff';
      element.style.backgroundColor = '#00B4A0';
      element.innerHTML = '<i class="fa fa-microphone"></i>';
      //stop();
      //ConversationPanel.sendInputText();
      recording = false;
      stop();
    }
  }

  function record() {
    if (!recording) {
      retunr;
    }
    let model = `${Cookies.get('language')}_BroadbandModel`;
    return new Promise((resolve, reject) => {
      stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
        token,
        model: model,
        keepMicrophone: true,
        //inactivity_timeout: -1,
        outputElement: '#textInput'
      });

      console.log('Recording...');

      stream.on('error', (err) => {
        console.log(err);
        stop();
        //reject(err);
      });
      stream.on('data', function(data) {
        if (data.results[0] && data.results[0].final) {
          stream.stop();
          console.log('stop listening.');
          ConversationPanel.sendInputText();
        }
      });
    });
  }

  function stop() {
    console.log('Recording stopped.');
    if (stream !== undefined) {
      stream.stop();
      stream.end();
    }
  }

}());
