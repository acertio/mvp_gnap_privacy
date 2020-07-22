const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConsentHandlerSchema = new mongoose.Schema({
    consent_handler: String
});

module.exports = mongoose.model(
    'ConsentHandler', 
    ConsentHandlerSchema
);