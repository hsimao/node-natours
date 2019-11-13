const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

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

// 取得指定 id 資料方法封裝
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) return next(new AppError('No doc found with that ID'), 404);

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

// 取得所有資料方法封裝, 包含分頁 filter 機制
exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // 取得特定 tour 底下所有的評論
    // 嵌套路由 tour/23455/reviews 使用
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const doc = await features.query.explain(); // 使用 explain() 可印出詳細資料來檢查 mongo 實際查詢筆數
    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
