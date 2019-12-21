const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// setting multer storage - 不使用 sharp 重新裁切圖片的方法
// const multerStorage = multer.diskStorage({
//   // 設置上傳圖片儲存位置
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   // 設定圖片名稱
//   filename: (req, file, cb) => {
//     // user-用戶ID-上傳時間搓.檔案格式
//     // user-76767abc65abd-33232343544.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// setting multer memory storage 儲存到記憶體
const multerStorage = multer.memoryStorage();

// setting multer filter, 只允許 image 檔案格式
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// 上傳圖片中間件, 單張
exports.uploadUserPhoto = upload.single('photo');

// 圖片尺寸調整中間件, 調整成正方形
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // user-用戶ID-上傳時間搓.檔案格式
  // user-76767abc65abd-33232343544.jpeg
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // 使用 sharp 重新裁切圖片大小
  await sharp(req.file.buffer)
    // 將照片裁切成 500px(寬) 500px(高)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    // 圖片儲存位置
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// 過濾物件參數, 只回傳允許的參數 [...allowedFields]
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

// 取得自己的會員資料
// 在 route 內使用中間件組合, 先將 user id 存放到 params.id, 在使用已封裝好的 getOne 方法取得資料
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// 停用帳號
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// 更新當前用戶資料
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);
  // 1.) 如果有密碼參數就返回
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2.) 過濾出允許更新的參數
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser
    }
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead'
  });
};

// 不可在此路由更新用戶密碼
exports.updateUser = factory.updateOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.deleteUser = factory.deleteOne(User);
