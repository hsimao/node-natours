const mongoose = require('mongoose');
const { slugify } = require('transliteration');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true
    },
    slug: String,
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
  },
  // 設定使用虛擬屬性
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual 虛擬屬性: 用於不想將資料儲存到資料庫, 可用現有資料來換算出來的資訊, 比較不會佔資料庫儲存空間
// 應用場景, 以週為單位的行程時間, 直接用現有的 duration 來換算即可
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// document middleware 中間件
// [pre] 當 mongo 執行 .save() .create() [之前]觸發
// 在儲存 tour 資料之前, 自動將 name 轉成網址, 並儲存到 slug 屬性內
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lowercase: true });
  next();
});

// // [post] 當 mongo 執行 .save() .create() 儲存完資料[之後]觸發
// tourSchema.post('save', function(doc, next) {
//   console.log('儲存成功');
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
