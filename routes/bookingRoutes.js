const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('../controllers/authController');

const Router = express.Router();

Router.use(authController.protect);

Router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// 身份是 admin, lead-guide 才可訪問以下 API
Router.use(authController.restrictTo('admin', 'lead-guide'));

Router.route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

Router.route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = Router;
