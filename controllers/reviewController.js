const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

/* == 新增評論 - 封裝前 ==
exports.createReview = catchAsync(async (req, res, next) => {
  // 藉由嵌套路由取得 tourId  /tour/12345678/reviews
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  });
});
== */

// 新增評論 - 使用中間件抽離不同邏輯, 在使用更新工廠函式封裝
// 中間件 藉由嵌套路由取得 tourId  /tour/12345678/reviews
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
