const mongoose = require('mongoose');
const { slugify } = require('transliteration');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [2, 'A tour name must have more or equal then 2 characters']
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
      required: [true, 'A tour must have a difficulty'],
      // 困難度僅能接收以下三個字串其一 'easy', 'medium', 'difficult'
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    // 平均評價分數
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must below 5.0']
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
    priceDiscount: {
      type: Number,
      // 自訂驗證, 優惠價需要小於原價
      validate: {
        validator: function(val) {
          // 此驗證只在新增時有作用, 在更新時無效, this 會無法抓到原本的 price
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
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
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    // 嵌入式 少量級關聯模式 (Embedding)
    startLocation: {
      // GeoJSON 格式
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // 嵌入式 少量級關聯模式 (Embedding)
    locations: [
      {
        // GeoJSON 格式
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // 導遊, 存放關聯用戶 id
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  // 設定使用虛擬屬性
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 優化資料查詢速度, 新增 index 索引
// 針對比較多人常搜尋的類型使用 index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// virtual 虛擬屬性: 用於不想將資料儲存到資料庫, 可用現有資料來換算出來的資訊, 比較不會佔資料庫儲存空間
// 應用場景, 以週為單位的行程時間, 直接用現有的 duration 來換算即可
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// 虛擬填充該 tour 底下的所有評論, 不將所有評論 id 儲存到資料庫
// 在 tour 搜尋時使用 .populate('reviews') 即可顯示關聯的評論資訊
tourSchema.virtual('reviews', {
  ref: 'Review', // 關聯評論 model
  foreignField: 'tour', // 評論 model 內的 tour
  localField: '_id' // tour 本身的 id
});

// == mongo 中間件 ==
// document 中間件
// [pre] 當 mongo 執行 .save() .create() [之前]觸發
// 在儲存 tour 資料之前, 自動將 name 轉成網址, 並儲存到 slug 屬性內
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lowercase: true });
  next();
});

// == 嵌入式範例中間件 start == 每次儲存時對 guides 的用戶 id 進行搜尋, 並將用戶完整資料嵌入到 tours 內
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
// });
// == 嵌入式範例中間件 end ==

// // [post] 當 mongo 執行 .save() .create() 儲存完資料[之後]觸發
// tourSchema.post('save', function(doc, next) {
//   console.log('儲存成功');
//   next();
// });

// Query 查詢中間件
// 應用場景: 某些秘密行程不能被用查詢查到
// 除了 find 方法之外 findOne 也要預防, 使用正規表達式 find 開頭的都執行
tourSchema.pre(/^find/, function(next) {
  // 新增一個 mongo query, 只要找到 secretTour 不等於 true 的資料
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// 所有 find query 使用 populate 顯示關聯的 guides 完整 user 資料, 並過濾掉 __v, passwordChangedAt
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// 搜尋完之後觸發, 可以跟 pre 搭配來計算出搜尋時間
tourSchema.post(/^find/, function(docs, next) {
  console.log(`搜尋時間: ${Date.now() - this.start} 毫秒`);
  next();
});

// aggregate 聚合中間件
tourSchema.pre('aggregate', function(next) {
  // 使用 unshift 將以下 match 方法放在 pipeline 最前面
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
