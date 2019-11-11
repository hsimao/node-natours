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

// 更新方法封裝
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true // 啟用在 model 設置的驗證功能
    });

    // 自訂 error 未找到
    if (!doc) return next(new AppError('No tour found with that ID'), 404);

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

// 新增方法封裝
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });
