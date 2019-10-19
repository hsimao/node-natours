const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// 產生 jwt token
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// 註冊
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

// 登入
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 驗證 email、password 都有值
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 驗證用戶是否存在, 密碼是否正確
  const user = await User.findOne({ email }).select('+password');

  // 調用在 userModel 內的 mongo methods correctPassword 來解碼並判斷密碼是否正確
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});

// 驗證權限中間件
exports.protect = catchAsync(async (req, res, next) => {
  // 1.)  取得 token, 從 headers
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token)
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );

  next();
});
