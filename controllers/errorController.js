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

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, res) => {
  // 如果是線上環境, 且錯誤不是 操作錯誤, 沒有跑到自訂封裝的 error handle
  // 就回傳通用 error message 給用戶端, 不傳遞詳細訊息給用戶端
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // 讓部屬環境紀錄 log error
    console.error('ERROR', err);

    // 通用錯誤訊息
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

// express error 中間件
// 傳遞四個參數, express 將會自動識別這是 error handle 方法, 並自動判別發生 error 時執行
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };

    // handle mongoDB error
    // 無效 id
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // 重複名稱
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    // 格式驗證錯誤
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};
