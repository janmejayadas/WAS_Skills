# Description

This Node.js app demonstrates a simple chat interface to a WPA instance

![Image](/docs/images/screen.jpg)

This example is based on the [Conversation Simple Application](https://github.com/watson-developer-cloud/conversation-simple)

## Pre-requisites

* Obtain a WPA API key (contact someone on the ConsumerIoT WPA team) 

* Make sure that you have the following prerequisites installed:
    * The [Node.js](https://nodejs.org/#download) runtime, including the [npm][npm_link] package manager

## To run

1. `cp .env.example .env`

2. Edit the .env file, adding your key

3. `npm install`

4. `npm start`

## If you want to push to Bluemix

1. Create a Bluemix account
    * [Sign up](https://console.ng.bluemix.net/registration/?target=/catalog/%3fcategory=watson) in Bluemix, or use an existing account. Your account must have available space for at least 1 app and 1 service.
    
2. `cf login --sso`

3. Edit the `manifest.yml` file providing whatever name you want (this will be the first part of the URL) 

4. Perform steps 1 and 2 in the **To run** section above

5. `cf push`

## Deploy to IBM Cloud

[![Deploy to IBM Cloud](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/janmejayadas/POC_Watson.git)

Click the ``Deploy to IBM Cloud`` button and hit ``Create`` and then jump to step 5.
