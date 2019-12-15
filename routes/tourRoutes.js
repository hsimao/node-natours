const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRouters');

const Router = express.Router();

// 與 reviewRouter 嵌套
// POST /tour/34333/reviews
Router.use('/:tourId/reviews', reviewRouter);

// 捕捉 /api/v1/tours 路由中有 :id 參數的請求, 統一處理驗證
// Router.param('id', tourController.checkID);

// 找到前五個最便宜的行程, 透過中間件 aliasTopTours 來加上請求網址參數
Router.route('/top-5-cheap').get(
  tourController.aliasTopTours,
  tourController.getAllTours
);

Router.route('/tour-stats').get(tourController.getTourStats);
Router.route('/monthly-plan/:year').get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'user'),
  tourController.getMonthlyPlan
);

// 查詢距離 user 多少距離內的所有 tours
/*
  == 兩種 router 設計方法
  1.) 使用 query string
  /tours-within?distance=233&center=34.140441,-118.356070&unit=mi

  2.) 使用網址 params 解析
  /tours-within/233/center/34.140441,-118.356070/unit/mi
*/
Router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(
  tourController.getToursWithin
);

Router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

Router.route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

Router.route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = Router;
