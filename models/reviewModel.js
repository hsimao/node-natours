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
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating
  });
};

// 在儲存之後執行計算平均評分方法
reviewSchema.post('save', function() {
  // 使用 constructor 指向當前 models
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
