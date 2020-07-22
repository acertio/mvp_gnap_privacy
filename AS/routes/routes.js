const express = require('express');
const authServerController = require('../controllers/authServer');

const router = express.Router();

// GET all the Transactions /as
router.get('/', authServerController.getTransactions);

// POST /as/transaction
router.post('/transaction', authServerController.createTransaction);

// POST /as/consent_handler 
router.post('/consent_handler', authServerController.createConsentHandler);

// Protected resources 
router.get('/data', 
    authServerController.authenticateToken,
    authServerController.getProtectedData
)

module.exports = router;