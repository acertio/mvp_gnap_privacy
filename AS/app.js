const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authServerRoutes = require('./routes/routes');

const app = express();

app.use(bodyParser.json()); //application/json

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods', 
        'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/as', authServerRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({message: message});
});

mongoose.connect(
    'mongodb+srv://' + process.env.YOUR_USERNAME + ':' + process.env.YOUR_PASSWORD + '@cluster0-dif37.mongodb.net/as_server?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
    ).then(result => {
        app.listen(8080, () => console.log('Server started on port 8080'));
    })
    .catch(err => console.log(err))

