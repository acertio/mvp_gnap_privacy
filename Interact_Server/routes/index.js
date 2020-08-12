const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const utils = require('../utils/utils');
const base64url = require('base64url');
const { sha3_512 }  = require('js-sha3');
const fetch = require('node-fetch');
const ConsentModel = require('../models/Consent');

// sha3_512_encode
const sha3_512_encode = function (toHash) {
  return base64url.fromBase64(Buffer.from(sha3_512(toHash), 'hex').toString('base64'));
};

// Welcome Page
router.get('/', (req, res) => res.render('welcome'));

// Consent Page
router.get('/consent', ensureAuthenticated, (req, res) => 
    ConsentModel
        .find()
        .then(values => {
            const uri = values[values.length - 1].entries[0].request.uri;
            const client_nonce = values[values.length - 1].entries[0].request.client_nonce;
            const server_nonce = values[values.length - 1].entries[0].request.server_nonce;
            const resources = values[values.length - 1].entries[0].request.resources;
            const consent_nonce = values[values.length - 1].entries[0].response.consent_nonce;

            async function start(){
              let casbin=require('casbin');
              const e = await casbin.newEnforcer('./model.conf', './policy.csv');
              
              const sub = req.user.didkey; // the user that wants to access a resource.
              let obj1 = 'room1'; // the resource that is going to be accessed.
              let act1_room1 = resources.token1[0].action[0]; // the operation that the user performs on the resource.
              let act2_room1 = resources.token1[0].action[1];
              room1_open_check=await e.enforce(sub, obj1, act1_room1);
              room1_checkAvailabilty=await e.enforce(sub, obj1, act2_room1);

              // console.log("result", await e.enforce(sub, obj, act) )
              let obj2 = 'room2'; // the resource that is going to be accessed.
              if (typeof resources.token2 !== 'undefined') {
                let act1_room2 = resources.token2[0].action[0];
                let act2_room2 = resources.token2[0].action[1];
                room2_open_check=await e.enforce(sub, obj2, act1_room2); 
                room2_checkAvailabilty=await e.enforce(sub, obj2, act2_room2);
              } else {
                room2_open_check= false;
                room2_checkAvailabilty= false
              }
              const roles = await e.getRolesForUser(req.user.didkey);
              console.log('roles', roles)
              let url = 'http://localhost:8080/as/consent_handler';
              let method = 'POST'
              fetch(url, {
                method: method,
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  consent_handler: utils.generateRandomString(20),
                  id: req.user.didkey,
                  name: req.user.name,
                  email: req.user.email,
                  room1_open_check: room1_open_check,
                  room2_open_check: room2_open_check,
                  room1_checkAvailabilty: room1_checkAvailabilty,
                  room2_checkAvailabilty: room2_checkAvailabilty

                })
            }).then(response => {
              return response.json()
              // Use the data
            }).then(resultData => {
                const interact_handle = resultData.interact_handle;
                const interact_nonce = sha3_512_encode(
                    [server_nonce, consent_nonce].join('\n')
                );
                const hash = sha3_512_encode(
                    [client_nonce, interact_nonce, interact_handle].join('\n')
                );
                const callback_url = uri + '?hash=' + hash + '&interact=' + interact_handle ;
                res.render('consent', {
                    room1_open:room1_open_check,
                    room2_open:room2_open_check,
                    room1_Check:room1_checkAvailabilty,
                    room2_Check:room2_checkAvailabilty,
                    name: req.user.name,
                    callback_url: callback_url
                })

            })
          }
          start();
        })
);

module.exports = router;