// express error 中間件
// 傳遞四個參數, express 將會自動識別這是 error handle 方法, 並自動判別發生 error 時執行
module.exports = (err, req, res, next) => {
  console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
};
