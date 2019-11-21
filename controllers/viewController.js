const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

// home page
exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

// Tour Detail page
exports.getTour = catchAsync(async (req, res, next) => {
  // 取得 tour 詳細頁面所需資料
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

// Login page
exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into yout account'
  });
});
