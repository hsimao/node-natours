const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// Global Middlewares 中間件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 限制同一個 ip 在時間內僅能發送多少請求
const limiter = rateLimit({
  max: 100, // 最大請求數量
  windowMs: 60 * 60 * 100, // 1 小時
  message: 'Too many requests from this IP, please try again in an hour!'
});
// 僅在 /api 路由套用此限制
app.use('/api', limiter);

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// 將每個請求加上時間
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);

// 未定義 route handle
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// express error 中間件
app.use(globalErrorHandler);

module.exports = app;
