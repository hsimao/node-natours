const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

// 刪除本地 tours 圖片
const removeImage = async (Model, id, type, index) => {
  const tour = await Model.findById(id);
  if (!tour || !tour[type]) return;

  if (type === 'images' && tour[type][index]) {
    fs.unlinkSync(`public/img/tours/${tour[type][index]}`);
  }
  if (type === 'imageCover') {
    fs.unlinkSync(`public/img/tours/${tour[type]}`);
  }
};

// setting multer memory storage 儲存到記憶體
const multerStorage = multer.memoryStorage();

// setting multer filter, 只允許 image 檔案格式
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// 上傳圖片中間件, 多張設置
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

// 圖片尺寸調整中間件, 調整成橫式
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // Cover image
  if (req.files.imageCover) {
    // 先將本地圖片刪除
    await removeImage(Tour, req.params.id, 'imageCover');

    // 將圖片路徑儲存到 body.imageCover, 後續將可更新到資料庫
    req.body.imageCover = `tour-${req.params.id}-cover-${Date.now()}.jpeg`;

    // 重新裁切圖片大小
    await sharp(req.files.imageCover[0].buffer)
      // 將照片裁切成3/2比例, 1000px(寬) 666px(高)
      .resize(1000, 666)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      // 圖片儲存位置
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  // Images
  if (req.files.images) {
    req.body.images = [];

    // 使用 promise.all 強制等待所有 map 迴圈執行完後才執行 next()
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-image-${i +
          1}-${Date.now()}.jpeg`;

        // 先將本地圖片刪除
        await removeImage(Tour, req.params.id, 'images', i);

        // 重新裁切圖片大小
        await sharp(file.buffer)
          .resize(1000, 666)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    );
  }

  next();
});

// 取得前五個最評價最好的便宜行程 中間件
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
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

// 搜尋距離自己 xx 內的所有 tours
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.140441,-118.356070/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  // 解析座標
  const [lat, lng] = latlng.split(',');

  // 半徑範圍, 如果單位是 mi 就用英里計算公式, 否則為預設公里為單位計算
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat, lng.',
        400
      )
    );
  }

  // mongo geoJson 地圖搜尋方法
  // {startLocation: {$geoWithin: { $centerSphere: [ [ -118.35607, 34.140441 ], 0.10275400000000012 ]}}}
  // 搜尋從 latlng 中心座標 開始計算 distance 的半徑範圍內的座標
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

// 依據座標中心點算出與每個 tour 之間的距離
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // 單位轉換 公尺 => 英里 or 公尺 => 公里
  const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat, lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      // 依據座標中心點算出每個 tour 的距離
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier // 單位轉換 公尺 => (英里/公里)
      }
    },
    {
      // 只顯示距離跟 tour 名稱
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
