const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// mergeParams: true => 允許接收其他 router 上的 params, 例如 tourRoutes 的 :tourId
const Router = express.Router({ mergeParams: true });

// POST /tour/34333/reviews
// GET /tour/34333/reviews
// POST /reviews

// 在此中間件以下的 route 都需要經過登入驗證
Router.use(authController.protect);

Router.route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

Router.route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = Router;
