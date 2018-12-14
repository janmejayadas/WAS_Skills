/*
© Copyright IBM Corp. 2017
*/


'use strict';

// Initialize handler
const {handler} = require('skill-sdk-nodejs');
const manifest = require('./res/assets/manifest.json');
const factory = require('skill-sdk-nodejs').factory;

// Expertise configuration
require('dotenv').config();

console.log("Index1")
//initialize wcs in handler
if(manifest.nlu.indexOf('wcs') > -1) {
	console.log("Index Started")
    handler.initialize();
  console.log("Index End...")
}
let localManifest = JSON.parse(JSON.stringify(manifest));
let index = localManifest.nlu.indexOf('skill');

console.log("Index check~"+index)
if(index !== -1) {
	console.log("Index check~"+index)
	
    localManifest.nlu.splice(index, 1);
}
if (localManifest.nlu.length < 1) {
    console.error('No Nlu engines selected, you need to add the nlu engines you want to use to manifest.json nlu field')
} else {
    factory.getNLUs(localManifest).then(updatedManifest => {
        if (updatedManifest.nlu.regexp) {
            updatedManifest.intents = require('./res/nlu/intents');
        }
        handler.manifest = updatedManifest;
		console.log("Index call factory.createAll started:"+handler.manifest)
		
        factory.createAll(updatedManifest).then(function (engines) {
            handler.engines = engines;
        });
		console.log("Index call factory.createAll End:"+handler.manifest)
    });
}

// The expertise handler
require('./actions')();
