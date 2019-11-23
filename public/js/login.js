/* eslint-disable */
const inputEmail = document.getElementById('email');
inputEmail.focus();

function login(email, password) {
  axios({
    method: 'post',
    url: 'http://localhost:3000/api/v1/users/login',
    data: {
      email,
      password
    }
  })
    .then(res => {
      console.log(res);
    })
    .catch(err => console.log(err.response.data));
}

function handleLoginSubmit() {
  document.querySelector('.form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

handleLoginSubmit();
