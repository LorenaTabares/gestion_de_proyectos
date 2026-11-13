
const express = require('express');
const router = express.Router();

const DashboardController = require('../controllers/dashboardController');

// ==========================================
// DASHBOARD ADMINISTRATIVO
// ==========================================
router.get('/', DashboardController.mostrarDashboard);

module.exports = router;
