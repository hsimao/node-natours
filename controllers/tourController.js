const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// 取得前五個最評價最好的便宜行程 中間件
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews');

  // 自訂 error 未找到
  if (!tour) return next(new AppError('No tour found with that ID'), 404);

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true // 啟用在 model 設置的驗證功能
  });

  // 自訂 error 未找到
  if (!tour) return next(new AppError('No tour found with that ID'), 404);

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = factory.deleteOne(Tour);

// mongo 高級查詢 聚合
// 找到評價符合大於或等於 4.5 的資料
// 分類資料, 並算出總數、平均評價、價格, 與最便宜與最貴的價格等..
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // 過濾: 找到評價符合大於或等於 4.5 的
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    // 資料分組, 針對符合上方的所有資料組出一個 group
    // 高級用法, 針對困難度分組, 將 difficulty 寫入 _id 內, mongo 將自動分組統計
    {
      $group: {
        // _id: null, // _id 設定為 null 將不分組, 會依據上方 match 資料回傳一包以下分析資料
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' }, // 使用 $toUpper, 可將名稱全轉大寫
        numTours: { $sum: 1 }, // 統計資料總筆數
        numRatings: { $sum: '$ratingsAverage' }, // 評價加總
        avgRating: { $avg: '$ratingsAverage' }, // 平均評價
        avgPrice: { $avg: '$price' }, // 平均價格
        minPrice: { $min: '$price' }, // 最便宜價格
        maxPrice: { $max: '$price' } // 最貴價格
      }
    },
    // 排列, 依據平均價格排序, (小 > 大)
    {
      $sort: { avgPrice: 1 }
    },

    // 第二個過濾, 將上方搜尋完結果, 排除掉 困難度為 easy 的分類
    // $ne => Not Equal, 不等於
    {
      $match: { _id: { $ne: 'EASY' } }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
});

// 計算某年的每個月的行程數量
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    // $unwind, 依據 startDates 資料筆數, 對應複製出多個物件整包資料
    {
      $unwind: '$startDates'
    },
    // 依據 year 年份過濾出資料 2021-01-01 ~ 2021-12-31
    {
      $match: {
        startDates: {
          // 大於或等於 2021-01-01
          $gte: new Date(`${year}-01-01`),
          // 小於或等於 2021-12-31
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    // 依據月份分組
    {
      $group: {
        // 使用 $month, 可自動找出相同月份資料
        _id: { $month: '$startDates' },
        // 該月份行程數量
        numTourStarts: { $sum: 1 },
        // 顯示該月份所有行程的名稱與價格, 使用 $push, 陣列呈現
        tours: { $push: { name: '$name', price: '$price' } }
      }
    },
    // 新增月份資料欄位
    {
      $addFields: { month: '$_id' }
    },
    // 使用 $project 指定要顯示或隱藏某欄位, 以下隱藏(0 / false) _id
    {
      $project: { _id: 0 }
    },
    // 依據每月行程數量排序 (大 > 小)
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  });
});
