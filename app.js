const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// == Global Middlewares 中間件
app.use(express.static(path.join(__dirname, 'public')));

// 設置安全 HTTP headers
app.use(helmet());

// 開發模式啟用 log
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

// 解析 body parser, 設置限制請求 body 不可大於 10kb
app.use(express.json({ limit: '10kb' }));

// 數據清理, 防止惡意 nosql query 注入, 例如 	"email": { "$gt": "" }
app.use(mongoSanitize());

// 防止 xss, 將標籤語法轉換 <script></script> => "&lt;script>&lt;/script>"
app.use(xss());

// 防止參數污染, 例如相同 query 參數重複, 兩個 sort => ?sort=duration&sort=price
app.use(
  hpp({
    // 允許可以重複出現的 query 參數, 例如 ?price=400&price=500
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// 將每個請求加上時間
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRouters');

app.get('/', (req, res) => {
  res.status(200).render('base', {
    tour: 'The forest',
    user: 'Jonas'
  });
});

app.get('/overview', (req, res) => {
  res.status(200).render('overview', {
    title: 'All Tours'
  });
});

app.get('/tour', (req, res) => {
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour'
  });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);

// 未定義 route handle
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// express error 中間件
app.use(globalErrorHandler);

module.exports = app;
