const express = require('express');
const { getRecommendation } = require('../controllers/smartArrivalController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/recommendation', protect, getRecommendation);

module.exports = router;
