const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// 刪除方法封裝
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    // 自訂 error 未找到
    if (!doc) return next(new AppError('No document found with that ID'), 404);

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
