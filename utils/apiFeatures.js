// API 通用方法封裝
// query 接收 mongo Model 的建構子
// queryString 接收網址 query 參數
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // 過濾 query
  filter() {
    // 刪除需另外處理的 query 參數, 例如 分頁、排序、資料筆數上限
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 特殊條件過濾
    // 網址參數 ?duration[gte]=5
    // req.query 接收變成 { duration: { gte: '5' } }
    // 需轉成 mongo query 格式 { duration: { $gte: 5 } }
    // 轉換關鍵字 gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  // 排序
  sort() {
    if (this.queryString.sort) {
      // 重組多個 sort 判斷網址
      // 原本 price,ratingsAverage
      // 改成 -price ratingsAverage
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  // 指定要回傳顯示的欄位 fields
  limitFields() {
    if (this.queryString.fields) {
      // 原本 price,ratingsAverage
      // 改成 price ratingsAverage
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // 過濾掉 mongo 自動產生的 __v 屬性資料
      this.query = this.query.select('-__v');
    }

    return this;
  }

  // 分頁機制
  paginate() {
    // 收到的 query 網址: page=2&limit=10
    // 利用 * 1, 將字串轉成數字, 若空值則 page 預設第 1 頁,  limit 預設 30 筆
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 30;

    // 資料起始搜尋位置
    // 轉換邏輯: page 1 => 1 - 10 | page 2 => 11 - 20 | page 3 => 21 - 30
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
