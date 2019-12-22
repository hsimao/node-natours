const stripe = require('stripe')(process.env.STRIPE_SECTRET_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 取得當前 booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError('No Tour found with that ID'), 404);

  // 創建 checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // 因為要從 stripe 的 checkout 頁面取得相關資料, 以下透過 url 傳遞, 之後在從 createBookingCheckout 中間件將帶有資料的 url 清除
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // 產品資訊
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `https://natours-tour.herokuapp.com/img/tours/${tour.imageCover}`
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  // 回傳 session
  res.status(200).json({
    status: 'success',
    session
  });
});

// 將 booking 資訊儲存到資料庫
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  // 將 url string 參數清除後重新導頁
  // https://natours-tour.herokuapp.com/?tour=xxxx&user=xxxx&price=xxx => https://natours-tour.herokuapp.com/
  res.redirect(req.originalUrl.split('?')[0]);
});
