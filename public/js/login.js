/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'post',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'get',
      url: 'http://localhost:3000/api/v1/users/logout'
    });

    // 如果成功, 將頁面刷新: 設置 true 將強制瀏覽器從服務器重新獲取當前頁面資源，而不是從瀏覽器的緩存中讀取
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! try again.');
  }
};
