const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: `${__dirname}/../../config/dev.env` });

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

// 抓取 json 資料
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// 將本地 json 檔案資料儲存到資料庫
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false }); // 關閉驗證功能, 避開 passwordConfirm 的驗證
    await Review.create(reviews);
    console.log('本地測試資料已成功注入!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// 刪除資料庫所有資料
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('資料庫資料已清空');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

/*
判斷 process.argv 執行腳本
注入本地 json 資料
node dev-data/data/import-dev-data.js --import

清空資料庫
node dev-data/data/import-dev-data.js --delete
*/
if (process.argv[2] === '--import') importData();
if (process.argv[2] === '--delete') deleteData();

console.log(process.argv);
