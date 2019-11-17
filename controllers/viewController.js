const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

// 首頁
exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res) => {
  // 取得 tour 詳細頁面所需資料
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour',
    tour
  });
});
