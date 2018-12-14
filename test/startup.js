const should = require('should');
const {server} = require('skill-sdk-nodejs');
const skillManifest = require(process.env.skillSDKResDir + '/assets/manifest');
const capcon = require('capture-console');
const isCI = process.env.isCI;
let output = '';
capcon.startCapture(process.stdout, function(stdout) {
    output += stdout;
});


describe('Index', function() {
    this.timeout(10000);

    after(function(done) {
        capcon.stopCapture(process.stdout);
        done();
    });

    describe('Skill startup', function() {
        let nlus;
        if (skillManifest && skillManifest.nlu) {
            nlus = skillManifest.nlu;
        }
        for(let engine of nlus) {
            if(engine !== 'skill' && !(engine === 'wcs' && isCI === 'true')) {
                it('Successfully creates nlu engine ' + engine, function (done) {
                    let success = output.includes(`Nlu engine ${engine} creation has succeeded`);
                    should.equal(success, true);
                    done();
                })
            }
        }

    });
});