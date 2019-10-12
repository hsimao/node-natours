const express = require('express');
const tourController = require('./../controllers/tourController');

const Router = express.Router();

// 捕捉 /api/v1/tours 路由中有 :id 參數的請求, 統一處理驗證
// Router.param('id', tourController.checkID);

// 找到前五個最便宜的行程, 透過中間件 aliasTopTours 來加上請求網址參數
Router.route('/top-5-cheap').get(
  tourController.aliasTopTours,
  tourController.getAllTours
);

Router.route('/tour-stats').get(tourController.getTourStats);

Router.route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

Router.route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = Router;
