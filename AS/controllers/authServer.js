require('dotenv').config();
const PendingTransactionModel = require('../models/pendingTransaction');
const ConsentHandlerModel = require('../models/consentHandler');
const utils = require('../utils/utils');
const base64url = require('base64url');
const { sha3_512 }  = require('js-sha3');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

if (typeof localStorage === "undefined" || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
const sha3_512_encode = function (toHash) {
  return base64url.fromBase64(Buffer.from(sha3_512(toHash), 'hex').toString('base64'));
};

// Create a Transaction 
exports.createTransaction = (req, res, next) => {
  if (req.body.handle && req.body.interact_ref) {
    // Get the server handle from DB 
    PendingTransactionModel.find({}, {
      _id : 1,
      entries: 1,
    })
      .then(result => {
        PendingTransactionModel.updateOne(
          {
            _id: result[result.length - 1]._id
          }, 
          {
            $addToSet : {
              entries: [{
                txContinue: {
                  handle: req.body.handle,
                  interact_ref: req.body.interact_ref
                }
              }]
            },
          },
          function(err, res) {
            if (err) throw err;
          }
        )
          .then(() => {
            // Issuing the Token
            // Get the interact_handle given by the AS
            const interact_handle = localStorage.getItem('interact_handle');
            console.log('interact_handle', interact_handle)
            // Create Token 
            const user = { name: "UserName"}
            const token = {
              access_token: {
                value: jwt.sign(user, process.env.ACCESS_TOKEN_SECRET),
                type: "bearer"
              }
            }
            handle_server = result[result.length - 1].entries[0].response.handle.value
            console.log('handle_server', handle_server)
            // Get the client handle and the interact_ref from DB 
            PendingTransactionModel.find({}, {
              _id : 0,
              entries: 1
            })
            .then((data) => {
              interact_ref = data[data.length - 1].entries[2].txContinue.interact_ref
              handle_client = data[data.length - 1].entries[2].txContinue.handle
              //handle_client = "hamidmassaoudyesichangedthatvalue"
              console.log('interact_ref', interact_ref)
              console.log('handle_client', handle_client)
              // User informations 
              name = data[data.length - 1].entries[1].name
              email = data[data.length - 1].entries[1].email
              if (interact_ref == interact_handle && handle_client == handle_server) {
                console.log(true)
                res.status(201).json({
                  token: token,
                  name: name,
                  email: email
                });
              } else {
                console.log(false)
                res.sendStatus(404);
              }
            })
            .catch(err => {
              if (!err.statusCode) {
                err.statusCode = 500;
              }
            next(err);
            })
          })
          .catch(err => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          })
        })
        .catch(err => {
          res.json({
          message: err
        })
      })
  } else {
  const txtransaction = new PendingTransactionModel({
    entries: [{
      request : {
        display: {
          name: req.body.display.name,
          uri: req.body.display.uri
        },
        interact: {
          redirect: req.body.interact.redirect,
          callback: {
            uri: req.body.interact.callback.uri,
            nonce: req.body.interact.callback.nonce
          }
        },
        resources : [
          {
            action : req.body.resources[0].action,
            locations : req.body.resources[0].locations,
            data : req.body.resources[0].data
          }
        ],
        claims: {
          subject: req.body.claims.subject,
          email: req.body.claims.email
        },
        user: {
          assertion: req.body.user.assertion,
          type: req.body.user.type
        },
        keys: {
          proof : req.body.keys.proof,
          jwk : req.body.keys.jwk
        }
      }
    }]
  }); 
  txtransaction
    .save()
    .then(() => {
      // Elements for the transaction Response 
      const interaction_url_id = utils.generateRandomString(20); // Save in DB
      const server_nonce = utils.generateRandomString(20); // Save in DB 
      const response = ({
        interaction_url : "http://localhost:5000/"  + interaction_url_id,
        server_nonce : server_nonce,
        handle : {
          value : utils.generateRandomString(64),
          type : "bearer"
        }
      });
      PendingTransactionModel.find({}, {
        _id: 1
      })
      .then(result => {
        PendingTransactionModel.updateOne(
          {
            _id: result[result.length - 1]._id
          }, 
          {
            entries:[{
              request: txtransaction.entries[0].request,
              response: response
            }],
            client_nonce: txtransaction.entries[0].request.interact.callback.nonce,
            server_nonce: response.server_nonce,
          },
          function(err, res) {
            if (err) throw err;
          }
        )
        .then(() => {
          let url = 'http://localhost:5000/users/consent';
          let method = 'POST'
          fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uri: txtransaction.entries[0].request.interact.callback.uri,
              client_nonce: txtransaction.entries[0].request.interact.callback.nonce,
              server_nonce: response.server_nonce,
            })
          })
          .then(data => {
            return data.json();
          })
          .then(result => {
            console.log('consent_nonce', result.consent_nonce)
            const interact_nonce = sha3_512_encode(
              [response.server_nonce, result.consent_nonce].join('\n')
            );
            // Add a Response to the transaction  
            res.status(201).json({
              interaction_url: response.interaction_url,
              interact_nonce: interact_nonce,
              handle: {
                value: response.handle.value,
                type: response.handle.type
              }
            })
          })
          .catch(err => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          })
        })
        .catch(err => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        })
      })
    })
  }
}

// Get all the Transactions 
exports.getTransactions = (req, res, next) => {
  PendingTransactionModel.find()
    .then(tx => {
      res
        .status(200)
        .json({ 
          Transactions: tx
        });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

// Create Consent Handler 
exports.createConsentHandler = (req, res, next) => {
  PendingTransactionModel.find({}, {
    _id : 1,
    entries: 1,
  })
    .then(result => {
      PendingTransactionModel.updateOne(
        {
          _id: result[result.length - 1]._id
        }, 
        {
          $addToSet : {
            entries: [{
              consent_handler: req.body.consent_handler,
              name: req.body.name,
              email: req.body.email
            }]
          },
        },
        function(err, res) {
          if (err) throw err;
        }
      )
      .then(() => {
        PendingTransactionModel.find({}, {
          _id : 1,
          entries: 1
        })
        .then(data => {
          const secret_AS = utils.generateRandomString(30);
          const consent_handler = data[data.length - 1].entries[1].consent_handler
          const interact_handle = sha3_512_encode(
            [consent_handler, secret_AS].join('\n')
          );
          localStorage.setItem('interact_handle', interact_handle);
          // Add a Response to the transaction  
          res.status(201).json({
            interact_handle: interact_handle
          });
        })
        })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
    })
}

// GET Consent Handler 
exports.getConsentHandler = (req, res, next) => {
  ConsentHandlerModel.find()
    .then(values => {
      res
        .status(200)
        .json({ 
          Consent: values
        });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

// Get protected resource 
exports.getProtectedData = (req, res, next) => {
  res.json({
    message: 'This is Protected Data'
  });
}

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}
