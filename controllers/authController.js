const crypto = require('crypto');
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

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // 將 token 轉成 cookie 傳遞到 client 瀏覽器
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; // 避免創建帳號成功時時回傳密碼到用戶端

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user
    }
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

  createSendToken(newUser, 201, res);
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

  createSendToken(user, 200, res);
});

// 驗證權限中間件, 保護需要登入才能查看的 route
exports.protect = catchAsync(async (req, res, next) => {
  // 1.)  取得 token
  let token;
  // 從 headers 取得 token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // 如果 headers 沒有 token, 改從 cookies.jwt 取得
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
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
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

// 重置密碼
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.) 取得 token, 並加密 (用來跟資料庫加密過的 token 比對)
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2.) 使用 token 來搜尋用戶, 直接搜尋符合 token 並且尚未過期
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2.) 如果有該用戶且 resetPassword token 沒有過期, 就重置新密碼
  if (!user) return next(new AppError('Token in invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3.) 更新 passwordChangedAt 時間
  // 已在 models/userModel.js mongo 中間件自動處理

  // 4.) 登入, 並發送一組新的 jwt
  createSendToken(user, 200, res);
});

// 更新密碼
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.) 從資料庫取得用戶
  const user = await User.findById(req.user.id).select('+password');

  // 2.) 驗證密碼是否正確
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3.) 更新密碼
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  // User.findByIdAndUpdate 會無法使用 mongo models 自訂的 passwordConfirm 驗證功能, 以及 mongo save 中間件內的密碼加密功能
  // 所以要用 user.save() 方式來更新用戶資料
  await user.save();

  // 4.) 登入, 並發送一組新的 jwt
  createSendToken(user, 200, res);
});
