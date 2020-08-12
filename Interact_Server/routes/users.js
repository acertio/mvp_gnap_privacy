const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const utils = require('../utils/utils');

// User model + Consent model 
const User = require('../models/User');
const ConsentModel = require('../models/Consent');

// Login Page 
router.get('/login', (req, res) => res.render('login'));

// Register Page 
router.get('/register', (req, res) => res.render('register'));

// Register Handle 
router.post('/register', (req, res) => {
    console.log(req.body)
    const { name,didkey,email, password, password2 } = req.body;
    let errors = [];

    // Check required fields 
    if (!name || !email || !password || !password2 || !didkey ) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    // Check passwords match 
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Check pass length 
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            didkey,
            email,
            password,
            password2
        });
    } else {
        // Validation passed 
        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    // User exists 
                    errors.push({ msg:'Email is already registered' })
                    res.render('register', {
                        errors,
                        name,
                        didkey,
                        email,
                        password,
                        password2
                    });
                } else {
                    const newUser = new User({
                        name,
                        didkey, 
                        email,
                        password
                    });
                    
                    // Hash Password 
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            // Set password to hashed 
                            newUser.password = hash;
                            // Save user 
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registered and can log in');
                                    res.redirect('/users/login')
                                })
                                .catch(err => console.log(err))
                        });
                    });
                }
            });

    }
});

// Login Handle 
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/login/consent',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success_msg', 'You are logged out');
    res.redirect('http://localhost:3000/');
});

router.post('/consent', (req, res, next) => {
    const txConsent = new ConsentModel({
        entries: [{
            request : {
                uri: req.body.uri,
                client_nonce: req.body.client_nonce,
                server_nonce: req.body.server_nonce,
                resources: req.body.resources
            }
        }]
    }); 
    txConsent
        .save()
        .then(() => {
            const consent_nonce = utils.generateRandomString(20);
            ConsentModel.find({}, {
                _id: 1
            })
            .then(result => {
                ConsentModel.updateOne(
                {
                    _id: result[result.length - 1]._id
                },
                {
                    entries:[{
                        request: txConsent.entries[0].request,
                        response: {
                            consent_nonce: consent_nonce
                        }
                    }]
                },
                function(err, res) {
                    if (err) throw err;
                }
                )
            })
            res.status(201).json({
                consent_nonce: consent_nonce,
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
      
});


module.exports = router;