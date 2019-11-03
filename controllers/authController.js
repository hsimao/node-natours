const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

// 產生 jwt token
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// 註冊
exports.signup = catchAsync(async (req, res, next) => {
  // prettier-ignore
  const { name, email, role, password, passwordConfirm, passwordChangedAt } = req.body

  const newUser = await User.create({
    name,
    email,
    role,
    password,
    passwordConfirm,
    passwordChangedAt
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

// 驗證權限中間件, 保護需要登入才能查看的 route
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

  // 2.) 驗證 token, 取出解碼完的 user id
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3.) 檢查用戶是否存在, token 有效的這段期間, 如果用戶從資料庫已刪除, 將不可訪問
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does on longer exist.',
        401
      )
    );
  }

  // 4.) 檢查用戶是否有改密碼, 在當前 token 產生之後, 有就需要請用戶重新登入
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again.', 401)
    );
  }

  // 永許用戶訪問受保護 route
  req.user = currentUser;
  next();
});

// 驗證權限身份, 當下登入者身份 role 如未符合 roles 傳遞進來的身份, 將返回
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Yo do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// 忘記密碼, 寄送出重置密碼的 email
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1.)依據 email 找出用戶資料
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2.) 生成重置密碼 token
  const resetToken = user.createPasswordResetToken();
  // 儲存 createPasswordResetToken 的 mongo methods 創建要儲存到用戶資料庫的 token 跟期限
  await user.save({ validateBeforeSave: false });

  // 3.) 送出修改密碼 token 到用戶 email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  // 發送 email 失敗需自訂錯誤處理, 清空用戶 passwordReset 相關資訊
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

// 重置密碼
exports.resetPassword = (req, res, next) => {};
