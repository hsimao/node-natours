const express = require('express');
const viewController = require('../controllers/viewController');

const Router = express.Router();

Router.get('/', viewController.getOverview);
Router.get('/tour/:slug', viewController.getTour);

// login
Router.get('/login', viewController.getLoginForm);

module.exports = Router;
