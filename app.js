const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// Middlewares 中間件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
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
