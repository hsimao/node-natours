//  評論 review 資料結構
// 1.) review
// 2.) rating 評分
// 3.) createdAt 創建時間
// 4.) 關聯 Tour
// 5.) 關聯 User
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
      trim: true,
      maxlength: [300, 'A review must have less or equal then 300 characters'],
      minlength: [2, 'A review must have more or equal then 2 characters']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must below 5.0']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.']
    }
  },
  // 設定使用虛擬屬性
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// mongo 中間件
// 所有搜尋評論的 query 使用 populate 顯示關聯的 user 資料
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

// 使用 mongo 靜態屬性 在每次新增評論時重新計算當下 tour 的評價筆數與平均分數
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, // 評價筆數
        avgRating: { $avg: '$rating' } // 平均分數
      }
    }
  ]);

  // 更新 tour 的評價平均分數與筆數
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    // 無資料時將恢復預設值
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

// 新增評論時在儲存後執行計算平均評分方法
reviewSchema.post('save', function() {
  // 使用 constructor 指向當前 models
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
// 在更新、刪除評價前時觸發, 執行 findOne 方法來取得 tour 相關資訊, 並保存後讓下個 post (已儲存) 階段來取得執行更新
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

// 更新完評論時要更新 tour 的評論平均分數與筆數
/*
  因為 更新、刪除的 post 階段無法取得本身資料,
  因此透過使用 this.findOne() 來取得資料,
  但因為 post 階段時無法使用 this.findOne(), 因為 query 已經被執行
  所以需要在儲存前 [pre]上方, 來執行並將 tour 相關資料, 與方法儲存到 [r] 變數內傳遞
  方可在此調用 calcAverageRatings 方法以及 tour id 來更新
*/
reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
