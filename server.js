const mongoose = require('mongoose');
const dotenv = require('dotenv');

const configName = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
dotenv.config({ path: `${__dirname}/config/${configName}.env` });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB conection successful!'));

// Start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App start on port ${port}...`);
});

// 全域監聽事件 - 處理未 handle 的 promise 錯誤 (Unhandled promise rejection)
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Unhandler Rejection! Shutting down...');
  // 將 server 關閉
  server.close(() => {
    process.exit(1); // 0 表示成功, 1 表示失敗
  });
});
