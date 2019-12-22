const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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

  if (!tour) return next(new AppError('There is no tour with that name', 404));

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

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: `${req.user.name} Account`
  });
};

// 個人已預訂的所有 tours 頁面
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1.) Find all bookings, 找到自己所有的 booking 資料
  const bookings = await Booking.find({ user: req.user.id });

  // 2.) Find tours with the retured Ids, 將 booking 整理成一包 tourIDs 陣列
  const tourIDs = bookings.map(item => item.tour);

  // 使用 tourIDs 陣列搜出所有 tours
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
