const express = require('express');
const authServerController = require('../controllers/authServer');

const router = express.Router();

// GET all the Transactions /as
router.get('/', authServerController.getTransactions);

// POST /as/transaction
router.post('/transaction', authServerController.createTransaction);

// POST /as/consent_handler 
router.post('/consent_handler', authServerController.createConsentHandler);

// Protected resources Room 1
router.get('/room1', 
    authServerController.authenticateTokenRoom1,
    authServerController.getProtectedDataRoom1
)

// Protected resources Room 2
router.get('/room2', 
    authServerController.authenticateTokenRoom2,
    authServerController.getProtectedDataRoom2
)

module.exports = router;