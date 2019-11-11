const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// mergeParams: true => 允許接收其他 router 上的 params, 例如 tourRoutes 的 :tourId
const Router = express.Router({ mergeParams: true });

// POST /tour/34333/reviews
// GET /tour/34333/reviews
// POST /reviews

Router.route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = Router;
