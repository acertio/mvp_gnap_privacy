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
            const consent_nonce = values[values.length - 1].entries[0].response.consent_nonce;
            let url = 'http://localhost:8080/as/consent_handler';
            let method = 'POST'
            fetch(url, {
              method: method,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                consent_handler: utils.generateRandomString(20),
                id: req.user._id,
                name: req.user.name,
                email: req.user.email
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
                    name: req.user.name,
                    callback_url: callback_url
                })
            })
        })
);

module.exports = router;