const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PendingTransactionSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    entries: [],
    client_nonce: String,
    server_nonce: String
});

module.exports = mongoose.model(
    'PendingTransaction', 
    PendingTransactionSchema
);