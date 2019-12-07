const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const Router = express.Router();

Router.post('/signup', authController.signup);
Router.post('/login', authController.login);
Router.get('/logout', authController.logout);
Router.post('/forgotPassword', authController.forgotPassword);
Router.patch('/resetPassword/:token', authController.resetPassword);

// 在此中間件以下的 route 都需要經過登入驗證
Router.use(authController.protect);

Router.patch('/updateMyPassword', authController.updatePassword);
Router.get('/me', userController.getMe, userController.getUser);
Router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.updateMe
);
Router.delete('/deleteMe', userController.deleteMe);

// 在此中間件以下的 route 身份需要是 admin
Router.use(authController.restrictTo('admin'));

Router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

Router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = Router;
