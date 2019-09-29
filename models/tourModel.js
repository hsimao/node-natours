const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true
  },
  // 持續時間
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  // 每團最多人數
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  // 困難度
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty']
  },
  // 平均評價分數
  ratingsAverage: {
    type: Number,
    default: 4.5
  },
  // 評價數量
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  // 優惠價
  priceDiscount: Number,
  // 摘要
  summary: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cove image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false // 資料回傳時不顯示此欄位
  },
  // 旅行開始時間
  startDates: [Date]
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
