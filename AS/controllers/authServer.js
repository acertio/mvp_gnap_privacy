require('dotenv').config();
const PendingTransactionModel = require('../models/pendingTransaction');
const utils = require('../utils/utils');
const base64url = require('base64url');
const { sha3_512 }  = require('js-sha3');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const jwt_decode = require('jwt-decode');

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
              id =  data[data.length - 1].entries[1].id
              name = data[data.length - 1].entries[1].name
              email = data[data.length - 1].entries[1].email
              room1_open_check = data[data.length - 1].entries[1].resources.action[0].room1_open_check
              room2_open_check = data[data.length - 1].entries[1].resources.action[0].room2_open_check
              room1_checkAvailabilty = data[data.length - 1].entries[1].resources.action[0].room1_checkAvailabilty
              room2_checkAvailabilty = data[data.length - 1].entries[1].resources.action[0].room2_checkAvailabilty
              if (interact_ref == interact_handle && handle_client == handle_server) {
                console.log(true)
                if (room1_open_check == true && room2_open_check == true) {
                  // Create two Tokens 
                  const payload_room1 = {
                    concealed_target_identifier_room1 : data[data.length - 1].entries[0].request.resources.token1[0].concealed_target_identifier
                  }
                  const payload_room2 = {
                    concealed_target_identifier_room2 : data[data.length - 1].entries[0].request.resources.token2[0].concealed_target_identifier
                  }
                  const tokenRoom1 = {
                    access_token: {
                      value: jwt.sign(payload_room1, process.env.ACCESS_TOKEN_SECRET_ROOM1),
                      type: "bearer"
                    }
                  }
                  const tokenRoom2 = {
                    access_token: {
                      value: jwt.sign(payload_room2, process.env.ACCESS_TOKEN_SECRET_ROOM2),
                      type: "bearer"
                    }
                  }
                  res.status(201).json({
                    tokenRoom1: tokenRoom1,
                    tokenRoom2: tokenRoom2,
                    id: id,
                    name: name,
                    email: email
                  });
                } else {
                    // Create one Token 
                    const payload = {
                      concealed_target_identifier_room1 : data[data.length - 1].entries[0].request.resources.token1[0].concealed_target_identifier
                    }
                    const tokenRoom1 = {
                      access_token: {
                        value: jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_ROOM1),
                        type: "bearer"
                      }
                    }
                    const tokenRoom2 = {
                      access_token: {
                        value: null,
                        type: "bearer"
                      }
                    }
                    res.status(201).json({
                      tokenRoom1: tokenRoom1,
                      tokenRoom2: tokenRoom2,
                      id: id,
                      name: name,
                      email: email
                    });
                }
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
          },
          interact_server: req.body.interact.interact_server
        },
        resources: req.body.resources,
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
      let interact_server_url = null;
      if (typeof req.body.interact.interact_server === 'undefined' || req.body.interact.interact_server === '' ) {
        interact_server_url = "http://localhost:5000/" 
      } else {
        interact_server_url = req.body.interact.interact_server
      }
      console.log("interact_server_url", interact_server_url)
      const interaction_url_id = utils.generateRandomString(20); // Save in DB
      const server_nonce = utils.generateRandomString(20); // Save in DB 
      const response = ({
        interaction_url : interact_server_url  + interaction_url_id,
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
              resources: txtransaction.entries[0].request.resources
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
              id: req.body.id,
              name: req.body.name,
              email: req.body.email,
              resources: {
                action : [{
                  room1_open_check: req.body.room1_open_check,
                  room2_open_check: req.body.room2_open_check,
                  room1_checkAvailabilty: req.body.room1_checkAvailabilty,
                  room2_checkAvailabilty: req.body.room2_checkAvailabilty
                }]
              }
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
          const consent_handler = data[data.length - 1].entries[1].consent_handler;
          const ressources = data[data.length - 1].entries[0].request.resources;
          const interact_handle = sha3_512_encode(
            [consent_handler, secret_AS].join('\n')
          );
          localStorage.setItem('interact_handle', interact_handle);
          // Add a Response to the transaction  
          res.status(201).json({
            interact_handle: interact_handle,
            resources: ressources
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

// Get access to Room 1 
exports.getProtectedDataRoom1 = (req, res, next) => {
  res.json({
    message: 'This is Room 1'
  });
}

// Get access to Room 2
exports.getProtectedDataRoom2 = (req, res, next) => {
  res.json({
    message: 'This is Room 2'
  });
}

// Simulated RS endpoint. This is for demo purposes, in reality would be external to the AS --> ROOM1
exports.authenticateTokenRoom1 = (req, res, next) => {
  const resourcesLocation = ["http://localhost:8080/as/room1"];
  const authHeader = req.headers['authorization'];
  const target_identifier_random_number = req.headers['target_identifier_random_number'];
  const token = authHeader && authHeader.split(' ')[1]
  const concealed_target_identifier = sha3_512_encode(
    [target_identifier_random_number, resourcesLocation[0]].join('\n')
  );
  const concealed_target_identifier_room1 = jwt_decode(token).concealed_target_identifier_room1;
  if ( concealed_target_identifier === concealed_target_identifier_room1) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_ROOM1, (err, user) => {
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  } else {
    return res.sendStatus(401)
  }
  //if (token == null) return res.sendStatus(401)
}

// Simulated RS endpoint. This is for demo purposes, in reality would be external to the AS --> ROOM2
exports.authenticateTokenRoom2 = (req, res, next) => {
  const resourcesLocation = ["http://localhost:8080/as/room2"];
  const authHeader = req.headers['authorization'];
  const target_identifier_random_number = req.headers['target_identifier_random_number'];
  const token = authHeader && authHeader.split(' ')[1]
  const concealed_target_identifier = sha3_512_encode(
    [target_identifier_random_number, resourcesLocation[0]].join('\n')
  );
  const concealed_target_identifier_room2 = jwt_decode(token).concealed_target_identifier_room2;
  if ( concealed_target_identifier === concealed_target_identifier_room2) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_ROOM2, (err, user) => {
      if (err) return res.sendStatus(403)
      req.user = user
      next()
    })
  } else {
    return res.sendStatus(401)
  }
  //if (token == null) return res.sendStatus(401)
}
