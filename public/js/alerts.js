/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// 兩種樣式 type is 'success' or 'error'
export const showAlert = (type, msg) => {
  hideAlert();

  const markup = `<div class='alert alert--${type}'>${msg}</div>`;
  // 在 body 標籤下方最開始插入 markup
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  window.setTimeout(hideAlert, 5000);
};
