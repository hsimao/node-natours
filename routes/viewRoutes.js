const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const Router = express.Router();

// 在所有 render 頁面路由底下套用 isLoggedIn 中間件, 如有登入將可取得 user 資料
Router.use(authController.isLoggedIn);

Router.get('/', viewController.getOverview);
Router.get('/tour/:slug', viewController.getTour);

// login
Router.get('/login', viewController.getLoginForm);

module.exports = Router;
