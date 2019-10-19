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
        // 此驗證只在新增時有作用, 在更新時無效, this 會無法抓到原本的 password
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  }
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

//  解碼後判斷用戶密碼是否正確
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
