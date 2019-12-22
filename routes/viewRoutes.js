const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const Router = express.Router();

// 在所有 render 頁面路由底下套用 isLoggedIn 中間件, 如有登入將可取得 user 資料
Router.get(
  '/',
  // 因為 stripe checkout 頁面付款成功後會跳轉回首頁, 所以將在首頁 '/' 路由加上 createBookingCheckout 中間件
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
Router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

// login
Router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

// 個人頁面 account, 此頁沒登入將不能訪問, 所以改用 protect 中間件邏輯
Router.get('/me', authController.protect, viewController.getAccount);

module.exports = Router;
