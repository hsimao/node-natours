const express = require('express');
const Router = express.Router();
const tourController = require('./../controllers/tourController');

// 捕捉 /api/v1/tours 路由中有 :id 參數的請求, 統一處理驗證
Router.param('id', tourController.checkID);

Router.route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

Router.route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = Router;
