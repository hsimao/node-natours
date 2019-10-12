const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

// 取得前五個最評價最好的便宜行程 中間件
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

// mongo 高級查詢 聚合
// 找到評價符合大於或等於 4.5 的資料
// 分類資料, 並算出總數、平均評價、價格, 與最便宜與最貴的價格等..
exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
