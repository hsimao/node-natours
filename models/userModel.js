const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    // guide 嚮導, lead-guide 領隊
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false // 預設不會顯示密碼
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        // 此驗證只在新增時有作用, 在更新時無效(不能使用 findByIdAndUpdate 來更新資料), this 會無法抓到原本的 password
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

// 儲存 user 資料前先加密密碼
userSchema.pre('save', async function(next) {
  // 如果 password 沒有修改過, 就返回不重新加密
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  // 不儲存 passwordConfirm 到資料庫
  this.passwordConfirm = undefined;

  next();
});

// 當密碼更新時, 自動更新 passwordChangedAt 時間
userSchema.pre('save', function(next) {
  // 如果 password 沒有修改過, 或是新註冊的用戶就返回
  if (!this.isModified('password') || this.isNew) return next();

  // 需注意, 因為保護路由中間間有判斷用戶是否有修改密碼, 並比對 token 產生時間,
  // 因為 token 產生比較慢, 所以這邊直接將修改密碼時間扣除一秒, 讓上方判斷需要用戶重登入的機會降低一些
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//  解碼後判斷用戶密碼是否正確
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 檢查密碼是否有改變, false 表示沒改變
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// 生成用戶重置密碼 token, crypto 是 node 內建的加密方法
userSchema.methods.createPasswordResetToken = function() {
  // 1.) 使用 crypto 生成 token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 2.) 將 token 加密儲存到用戶資料庫
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  // 3.) token 有效期限為 10 分鐘
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // 4.) 回傳未加密 resetToken
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
