const express = require('express');
const viewController = require('../controllers/viewController');

const Router = express.Router();

Router.get('/', viewController.getOverview);
Router.get('/tour/:slug', viewController.getTour);

module.exports = Router;
