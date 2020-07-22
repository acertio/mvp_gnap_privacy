const mongoose = require('mongoose');

const ConsentSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    entries: []
});

const Consent = mongoose.model('Consent', ConsentSchema);

module.exports = Consent;