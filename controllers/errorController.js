const AppError = require('./../utils/appError');

// mongoDB 無效 id
const handleCastErrorDB = err => {
  // 無效 id
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// mongoDB 重複名稱
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// mongoDB 格式錯誤
const handleValidationErrorDB = err => {
  // loop all Validation
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // 判斷是 api route 還是 render page route
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }
  // 不是 api route error, 顯示 error 樣板
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

// 如果是線上環境 error handle
const sendErrorProd = (err, req, res) => {
  // 判斷是 api route 還是 render page route
  if (req.originalUrl.startsWith('/api')) {
    // 操作錯誤, 且是已知有處理過的 error message
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // 讓部屬環境紀錄 log error
    console.error('ERROR', err);

    // 未知錯誤, 顯示通用錯誤訊息
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

  // 不是 api route error, 顯示 error 樣板
  // 操作錯誤, 且是已知有處理過的 error message
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }

  // 未知錯誤, 顯示通用錯誤訊息
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

// express error 中間件
// 傳遞四個參數, express 將會自動識別這是 error handle 方法, 並自動判別發生 error 時執行
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // console.log('err', err);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message; // fix 上面解構無法正常將 message copy 到 error
    // handle mongoDB error
    // 無效 id
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // 重複名稱
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    // 格式驗證錯誤
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    sendErrorProd(error, req, res);
  }
};
