const Tour = require('./../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    // 1.) 過濾 query: 刪除需另外處理的 query 參數, 例如 分頁、排序、資料筆數上限
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 2.) 特殊條件過濾
    // 網址參數 ?duration[gte]=5
    // req.query 接收變成 { duration: { gte: '5' } }
    // 需轉成 mongo query 格式 { duration: { $gte: 5 } }
    // 轉換關鍵字 gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    console.log(JSON.parse(queryStr));

    let query = Tour.find(JSON.parse(queryStr));

    // 3.) 排序
    if (req.query.sort) {
      // 重組多個 sort 判斷網址
      // 原本 price,ratingsAverage
      // 改成 -price ratingsAverage
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // 4.) 指定回傳顯示欄位 fields
    if (req.query.fields) {
      // 原本 price,ratingsAverage
      // 改成 price ratingsAverage
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // 過濾掉 mongo 自動產生的 __v 屬性資料
      query = query.select('-__v');
    }

    const tours = await query;

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
