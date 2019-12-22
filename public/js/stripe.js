/* eslint-disable */
const stripe = Stripe('pk_test_rfkuG3cOIO0gxi00olKeEify00x2DJ61wW');
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  try {
    // 1.) Get checkout session from API
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);

    // 2.) 跳轉到 stripe 提供的 checkout 介面
    // Create checkotu form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
