const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (to, code, lang = 'en') => {
  const messages = {
    ko: {
      subject: `트라나시아 회원가입 인증 코드: ${code}`,
      html: (code) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>이메일 인증</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container {
              width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ccc;
              background: #f8fafc;
            }
            .logo {
              font-size: 2rem;
              font-weight: 800;
              color: #2563eb;
              letter-spacing: -0.5px;
              text-align: center;
              margin-bottom: 24px;
            }
            .code {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="logo">TRANASIA</h1>
            <p>안녕하세요, 고객님!</p>
            <p>아래의 인증 코드를 확인해 주세요:</p>
            <p class="code">${code}</p>
            <p>감사합니다.</p>
            <p>트라나시아</p>
          </div>
        </body>
        </html>
      `
    },
    en: {
      subject: `Tranaisa Sign-Up Verification Code: ${code}`,
      html: (code) => `
        <div style="font-family: Arial; padding: 20px;">
          <h1 class="logo">TRANASIA</h1>
          <p>Hello!</p>
          <p>Your verification code is:</p>
          <p style="font-size: 24px; font-weight: bold; color: blue;">${code}</p>
          <p>Thank you,<br/>Tranaisa Team</p>
        </div>
      `
    },
    zh: {
      subject: `Tranaisa 注册验证码: ${code}`,
      html: (code) => `
        <div style="font-family: Arial; padding: 20px;">
          <h1 class="logo">TRANASIA</h1>
          <p>您好！</p>
          <p>您的验证码是：</p>
          <p style="font-size: 24px; font-weight: bold; color: blue;">${code}</p>
          <p>谢谢您，<br/>Tranaisa 团队</p>
        </div>
      `
    },
    ja: {
      subject: `Tranaisa 登録確認コード: ${code}`,
      html: (code) => `
        <div style="font-family: Arial; padding: 20px;">
          <h1 class="logo">TRANASIA</h1>
          <p>こんにちは！</p>
          <p>以下の認証コードをご確認ください：</p>
          <p style="font-size: 24px; font-weight: bold; color: blue;">${code}</p>
          <p>ありがとうございます。<br/>Tranaisaチーム</p>
        </div>
      `
    }
  };

  const content = messages[lang] || messages.en;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: content.subject,
    html: content.html(code)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('메일 전송 성공:', info.response);
  } catch (error) {
    console.error('메일 전송 실패:', error);
  }
};

module.exports = { sendVerificationEmail };
