const express = require('express');
const morgan = require('morgan');
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

module.exports = app;
