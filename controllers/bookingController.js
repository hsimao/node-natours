const stripe = require('stripe')(process.env.STRIPE_SECTRET_KEY);
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 取得當前 booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError('No Tour found with that ID'), 404);

  // 創建 checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
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
