const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1.) 新增 transporter (gmail, yahoo...)
  // gmail 每天只能發送 500 封, 並容易被歸類為垃圾信件
  // 推薦用 sendGrid 或 mailgun
  const transporter = nodemailer.createTransport({
    // service: 'Gamil',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2.) 設定 email options
  const mailOptions = {
    from: 'Mars <mars@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3.) 發送 email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
