const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const Router = express.Router();

Router.get('/', viewController.getOverview);
Router.get('/tour/:slug', authController.protect, viewController.getTour);

// login
Router.get('/login', viewController.getLoginForm);

module.exports = Router;
