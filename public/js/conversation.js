// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/

var ConversationPanel = (function() {
  var settings = {
    selectors: {
      chatBox: '#scrollingChat',
      fromUser: '.from-user',
      fromWatson: '.from-watson',
      latest: '.latest'
    },
    authorTypes: {
      user: 'user',
      watson: 'watson'
    }
  };

  // Publicly accessible methods defined
  return {
    init: init,
    inputKeyDown: inputKeyDown,
    sendInputText: sendInputText
  };

  // Initialize the module
  function init() {
    setupCookies();
    chatUpdateSetup();
    Api.sendRequest('', null);
    setupInputBox();
  }

  function setupCookies() {
    if (!Cookies.get('wpa_key')) {
      Cookies.set('wpa_key', config.KEY, { expires: 365 });
    }

    if (!Cookies.get('avatar')) {
      Cookies.set('avatar', config.EXPERTISE_COLLECTION, { expires: 365 });
    }

    if (!Cookies.get('location')) {
      Cookies.set('location', config.LOCATION, { expires: 365 });
    }

    if (!Cookies.get('userid')) {
      Cookies.set('userid', config.USERID, { expires: 365 });
    }

    if (!Cookies.get('language')) {
      Cookies.set('language', 'en-US', { expires: 365 });
    }

    displayMessage({speech: {text: `Your current context is:<br><br><b>WPA key</b> ${Cookies.get('wpa_key').substring(0,7)}...<br><b>avatar</b> ${Cookies.get('avatar')}<br><b>user</b> ${Cookies.get('userid')}<br><b>location</b> ${Cookies.get('location')}<br><b>language</b> ${Cookies.get('language')}<br><br>Type <b>/help</b> for a list of commands to change the context of this chatbot.<br><br>`}}, settings.authorTypes.watson);
  }

  // Set up callbacks on payload setters in Api module
  // This causes the displayMessage function to be called when messages are sent / received
  function chatUpdateSetup() {
    var currentRequestPayloadSetter = Api.setRequestPayload;
    Api.setRequestPayload = function(newPayloadStr) {
      currentRequestPayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);
    };

    var currentResponsePayloadSetter = Api.setResponsePayload;
    Api.setResponsePayload = function(newPayloadStr) {
      currentResponsePayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.watson);
    };
  }

  // Set up the input box to underline text as it is typed
  // This is done by creating a hidden dummy version of the input box that
  // is used to determine what the width of the input text should be.
  // This value is then used to set the new width of the visible input box.
  function setupInputBox() {
    var input = document.getElementById('textInput');
    var dummy = document.getElementById('textInputDummy');
    var minFontSize = 14;
    var maxFontSize = 16;
    var minPadding = 4;
    var maxPadding = 6;

    // If no dummy input box exists, create one
    if (dummy === null) {
      var dummyJson = {
        'tagName': 'div',
        'attributes': [{
          'name': 'id',
          'value': 'textInputDummy'
        }]
      };

      dummy = Common.buildDomElement(dummyJson);
      document.body.appendChild(dummy);
    }

    function adjustInput() {
      if (input.value === '') {
        // If the input box is empty, remove the underline
        input.classList.remove('underline');
        input.setAttribute('style', 'width:' + '100%');
        input.style.width = '100%';
      } else {
        // otherwise, adjust the dummy text to match, and then set the width of
        // the visible input box to match it (thus extending the underline)
        input.classList.add('underline');
        var txtNode = document.createTextNode(input.value);
        ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height',
          'text-transform', 'letter-spacing'].forEach(function(index) {
            dummy.style[index] = window.getComputedStyle(input, null).getPropertyValue(index);
          });
        dummy.textContent = txtNode.textContent;

        var padding = 0;
        var htmlElem = document.getElementsByTagName('html')[0];
        var currentFontSize = parseInt(window.getComputedStyle(htmlElem, null).getPropertyValue('font-size'), 10);
        if (currentFontSize) {
          padding = Math.floor((currentFontSize - minFontSize) / (maxFontSize - minFontSize) *
            (maxPadding - minPadding) + minPadding);
        } else {
          padding = maxPadding;
        }

        var widthValue = (dummy.offsetWidth + padding) + 'px';
        input.setAttribute('style', 'width:' + widthValue);
        input.style.width = widthValue;
      }
    }

    // Any time the input changes, or the window resizes, adjust the size of the input box
    input.addEventListener('input', adjustInput);
    window.addEventListener('resize', adjustInput);

    // Trigger the input event once to set up the input box and dummy element
    Common.fireEvent(input, 'input');
  }

  // Display a user or Watson message that has just been sent/received
  function displayMessage(newPayload, typeValue) {
    var isUser = isUserMessage(typeValue);
    var textExists = (newPayload.input && newPayload.input.text) ||
      (newPayload.speech && newPayload.speech.text);
    if (isUser !== null && textExists) {
      // Create new message DOM element
      var messageDivs = buildMessageDomElements(newPayload, isUser);
      var chatBoxElement = document.querySelector(settings.selectors.chatBox);
      var previousLatest = chatBoxElement.querySelectorAll((isUser ?
              settings.selectors.fromUser : settings.selectors.fromWatson) +
              settings.selectors.latest);
      // Previous "latest" message is no longer the most recent
      if (previousLatest) {
        Common.listForEach(previousLatest, function(element) {
          element.classList.remove('latest');
        });
      }

      messageDivs.forEach(function(currentDiv) {
        chatBoxElement.appendChild(currentDiv);
        // Class to start fade in animation
        currentDiv.classList.add('load');
      });
      // Move chat to the most recent messages when new messages are added
      scrollToChatBottom();

      // play the response through computer speakers
      fetch('/api/text-to-speech/token')
      .then(function(response) {
         return response.text();
       }).then(function (token) {
               // WatsonSpeech.TextToSpeech.synthesize({
                 let audio = WatsonSpeech.TextToSpeech.synthesize({
                 text: newPayload.speech.text,
                 token: token
              //  })
             });
            audio.addEventListener("ended", () => {
               SpeechToText.record();
            });
       });
    } else {
      if (typeof newPayload === 'string') {
        displayMessage({speech: {text: `Error: ${newPayload}`}}, settings.authorTypes.watson);
      }
    }
  }

  // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
  // Returns true if user, false if Watson, and null if neither
  // Used to keep track of whether a message was from the user or Watson
  function isUserMessage(typeValue) {
    if (typeValue === settings.authorTypes.user) {
      return true;
    } else if (typeValue === settings.authorTypes.watson) {
      return false;
    }
    return null;
  }

  // Constructs new DOM element from a message payload
  function buildMessageDomElements(newPayload, isUser) {
    var textArray = isUser ? newPayload.input.text : newPayload.speech.text;
    if (Object.prototype.toString.call(textArray) !== '[object Array]') {
      textArray = [textArray];
    }
    var messageArray = [];

    textArray.forEach(function(currentText) {
      if (currentText) {
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-watson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': ['message-inner'],
              'children': [{
                // <p>{messageText}</p>
                'tagName': 'p',
                'text': currentText
              }]
            }]
          }]
        };
        messageArray.push(Common.buildDomElement(messageJson));
      }
    });

    var card = newPayload.card ? newPayload.card : null;
    if(card && card.type === 'recipes') {
      card.content = JSON.parse(card.content);
      var messJ = {
        'tagName': 'div',
        'classNames': ['segments'],
        'children': [{
          'tagName': 'div',
          'classNames': ['from-watson', 'latest', 'sub'],
          'children': [{
            'tagName': 'div',
            'classNames': ['card-group'],
            'children': [{
              'tagName': 'div',
              'classNames': ['card'],
              'children': [{
                'tagName': 'img',
                'classNames': ['card-img-top'],
                'attributes': [{'name': 'src', 'value': `${card.content.matches[0].imageUrlsBySize[90]}`}]
              },{
                'tagName': 'div',
                'classNames': ['card-block'],
                'children': [{
                  'tagName': 'a',
                  'classNames':['card-title'],
                  'attributes':[{'name':'href', 'value':`https://www.yummly.com/recipe/${card.content.matches[0].id}`}, {'name':'target', 'value':'_blank'}],
                  'text': `${card.content.matches[0].recipeName}`
                }, {
                  'tagName': 'h5',
                  'classNames': ['card-text'],
                  'text': 'Ingredients'
                }, makeIngredientsHtml(card.content.matches[0].ingredients)]
              }]
            }, {
              'tagName': 'div',
              'classNames': ['card'],
              'children': [{
                'tagName': 'img',
                'classNames': ['card-img-top'],
                'attributes': [{'name': 'src', 'value': `${card.content.matches[1].imageUrlsBySize[90]}`}]
              },{
                'tagName': 'div',
                'classNames': ['card-block'],
                'children': [{
                  'tagName': 'a',
                  'classNames':['card-title'],
                  'attributes':[{'name':'href', 'value':`https://www.yummly.com/recipe/${card.content.matches[1].id}`}, {'name':'target', 'value':'_blank'}],
                  'text': `${card.content.matches[1].recipeName}`
                }, {
                  'tagName': 'h5',
                  'classNames': ['card-text'],
                  'text': 'Ingredients'
                }, makeIngredientsHtml(card.content.matches[1].ingredients)]
              }]
            }, {
              'tagName': 'div',
              'classNames': ['card'],
              'children': [{
                'tagName': 'img',
                'classNames': ['card-img-top'],
                'attributes': [{'name': 'src', 'value': `${card.content.matches[2].imageUrlsBySize[90]}`}]
              },{
                'tagName': 'div',
                'classNames': ['card-block'],
                'children': [{
                  'tagName': 'a',
                  'classNames':['card-title'],
                  'attributes':[{'name':'href', 'value':`https://www.yummly.com/recipe/${card.content.matches[2].id}`}, {'name':'target', 'value':'_blank'}],
                  'text': `${card.content.matches[2].recipeName}`
                }, {
                  'tagName': 'h5',
                  'classNames': ['card-text'],
                  'text': 'Ingredients'
                }, makeIngredientsHtml(card.content.matches[2].ingredients)]
              }]
            }]
          }]
        }]
      };
      messageArray.push(Common.buildDomElement(messJ));
    }

    return messageArray;
  }

  function makeIngredientsHtml(ing) {
    var ingHtmlJSON = {
      'tagName': 'ul',
      'classNames': ['card-text'],
      'children': []
    };

    for(i in ing) {
      let item = {
        'tagName': 'li',
        'text': `${ing[i]}`
      };
      ingHtmlJSON.children.push(item);
    }

    return ingHtmlJSON;
  }

  // Scroll to the bottom of the chat window (to the most recent messages)
  // Note: this method will bring the most recent user message into view,
  //   even if the most recent message is from Watson.
  //   This is done so that the "context" of the conversation is maintained in the view,
  //   even if the Watson message is long.

  function scrollToChatBottom() {
    var scrollingChat = document.querySelector('#scrollingChat');

    // Scroll to the latest message sent by the user
    var scrollEl = scrollingChat.querySelector(settings.selectors.fromUser +
            settings.selectors.latest);
    if (scrollEl) {
      scrollingChat.scrollTop = scrollEl.offsetTop;
    }
  }

  // Handles the submission of input
  function inputKeyDown(event, inputBox) {
    // Submit on enter key, dis-allowing blank messages
    if (event.keyCode === 13 && inputBox.value) {
      // Retrieve the context from the previous server response
      sendInputText();
    }
  }

  function sendInputText() {
    var inputBox = document.querySelector('#textInput');
    var context;
    var latestResponse = Api.getResponsePayload();
    if (latestResponse) {
      context = latestResponse.context;
    }

    if (inputBox.value.startsWith('/')) {
      displayMessage({input: {text: inputBox.value}}, settings.authorTypes.user);
      displayMessage(handleCommand(inputBox.value), settings.authorTypes.watson);
    } else {
      // Send the user message
      Api.sendRequest(inputBox.value, context);
    }
    inputBox.value = '';
    // Clear input box for further messages
    Common.fireEvent(inputBox, 'input');
  }

  function handleCommand(input) {
    var cmdTokens = input.split(' ');
    var command = cmdTokens[0];
    var value = "";
    if (cmdTokens.length > 1) {
      value = cmdTokens[1];
    }

    if (command === '/location') {
      if (value === '') {
        return {
          speech: {
            text: `current location is ${Cookies.get('location').split(',')[0]},${Cookies.get('location').split(',')[1]}`
          }
        };
      } else if (value === 'help') {
        return {
          speech: {
            text: '/location <i>lat,long<i/>'
          }
        };
      } else {
        if (value.split(',').length != 2) {
          return {
            speech: {
              text: 'Sorry, I only understand <i>lat,long</i><br><b>/location</b> <i>lat,long<i/>'
            }
          };
        } else {
          Cookies.set('location', value, { expires: 365 });
          return {
            speech: {
              text: 'location set to ' + value
            }
          };
        }
      }

    } else if (command === '/avatar') {
      if (value === '') {
        return {
          speech: {
            text: `current avatar is ${Cookies.get('avatar')}`
          }
        };
      } else if (value === 'help') {
        return {
          speech: {
            text: '/avatar <i>name</i>'
          }
        };
      } else {
        Cookies.set('avatar', value, { expires: 365 });
        return {
          speech: {
            text: 'avatar set to ' + value
          }
        };
      }

    } else if (command === '/wpa') {
      if (value === '') {
        var key = Cookies.get('wpa_key').substring(0,7) + '...';
        return {
          speech: {
            text: `current WPA is ${key}`
          }
        };
      } else if (value === 'help') {
        return {
          speech: {
            text: '/wpa <i>WPA api key</i>'
          }
        };
      } else {
        Cookies.set('wpa_key', value, { expires: 365 })
        var shortenedValue = value.substring(0,7) + '...';
        return {
          speech: {
            text: 'wpa set to ' + shortenedValue
          }
        };
      }

    } else if (command === '/defaults') {
      if (value === 'help') {
        return {
          speech: {
            text: `Command by itself will reset WPA key, avatar, location, and language to default settings.`
          }
        };
      } if (value === '') {
        Cookies.remove('wpa_key');
        Cookies.remove('avatar');
        Cookies.remove('location');
        Cookies.remove('language');
        setupCookies();
        return {
          speech: {
            //text: `reset WPA key, avatar and location to defaults.`
            text: ''
          }
        };
      }

    } else if (command === '/userid') {
      if (value === '') {
        return {
          speech: {
            text: `current user ID is ${Cookies.get('userid')}`
          }
        };
      } else if (value === 'help') {
        return {
          speech: {
            text: '/userid <i>name</i>'
          }
        };
      } else {
        Cookies.set('userid', value, { expires: 365 });
        return {
          speech: {
            text: 'user ID set to ' + value
          }
        };
      }

    } else if (command === '/help') {
      return {
        speech: {
          text: 'The supported commands are:<br><br><b>/location</b> <i>lat,long</i><br><b>/avatar</b> <i>name</i><br><b>/wpa</b> <i>WPA_API_key</i><br><b>/defaults</b><br><b>/userid</b> <i>name</i><br><b>/language</b> <i>language_code</i><br><br>Use "/<i>command</i> help" for help on a particular command.'
        }
      };

    } else if (command === '/language') {
      if (value === '') {
        return {
          speech: {
            text: `current language is ${Cookies.get('language')}`
          }
        };
      } else if (value === 'help') {
        return {
          speech: {
            text: '/language [en-US|en-GB|de-DE|es-ES|fr-FR|ja-JP|pt-BR|zh-CN|ar-AR]'
          }
        };
      } else {
        Cookies.set('language', value, { expires: 365 });
        return {
          speech: {
            text: 'language set to ' + value
          }
        };
      }

    } else {
      return {
        speech: {
          text: `I dont understand the command ${command}.  Use "/help" to see available commands.`
        }
      };
    }
  }

}());
