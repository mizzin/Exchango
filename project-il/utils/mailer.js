// utils/mail.js
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: String(process.env.EMAIL_SECURE) === 'true',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
})

async function sendMail(to, subject, html) {
  return transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html })

}

async function sendVerificationEmail(to, code, lang='en') {
  const messages = {
    ko: {
      subject: `트라나시아 회원가입 인증 코드: ${code}`,
      html: `
        <div style="font-family:Arial;padding:20px;background:#f8fafc">
          <h1 style="color:#2563eb;margin:0 0 16px">TRANASIA</h1>
          <p>안녕하세요!</p>
          <p>아래의 인증 코드를 확인해 주세요:</p>
          <p style="font-size:24px;font-weight:700;color:#2563eb">${code}</p>
          <p>감사합니다.<br/>트라나시아</p>
        </div>`
    },
    en: {
      subject: `Tranaisa Sign-Up Verification Code: ${code}`,
      html: `
        <div style="font-family:Arial;padding:20px;background:#f8fafc">
          <h1 style="color:#2563eb;margin:0 0 16px">TRANASIA</h1>
          <p>Hello!</p>
          <p>Your verification code is:</p>
          <p style="font-size:24px;font-weight:700;color:#2563eb">${code}</p>
          <p>Thank you,<br/>Tranaisa Team</p>
        </div>`
    },
    zh: {
      subject: `Tranaisa 注册验证码: ${code}`,
      html: `
        <div style="font-family:Arial;padding:20px;background:#f8fafc">
          <h1 style="color:#2563eb;margin:0 0 16px">TRANASIA</h1>
          <p>您好！</p>
          <p>您的验证码是：</p>
          <p style="font-size:24px;font-weight:700;color:#2563eb">${code}</p>
          <p>谢谢您，<br/>Tranaisa 团队</p>
        </div>`
    },
    ja: {
      subject: `Tranaisa 登録確認コード: ${code}`,
      html: `
        <div style="font-family:Arial;padding:20px;background:#f8fafc">
          <h1 style="color:#2563eb;margin:0 0 16px">TRANASIA</h1>
          <p>こんにちは！</p>
          <p>以下の認証コードをご確認ください：</p>
          <p style="font-size:24px;font-weight:700;color:#2563eb">${code}</p>
          <p>ありがとうございます。<br/>Tranaisaチーム</p>
        </div>`
    }
  }

  const { subject, html } = messages[lang] || messages.en
  await sendMail(to, subject, html)
}

async function sendPasswordResetEmail(to, resetUrl, lang='en') {
  const messages = {
    ko: {
      subject: '[트라나시아] 비밀번호 재설정 안내',
      html: `
        <div style="font-family:Arial;padding:20px;background:#ffffff">
          <h2 style="margin:0 0 12px">비밀번호 재설정</h2>
          <p>아래 링크에서 새 비밀번호를 설정하세요 (15분 이내, 1회용).</p>
<p>
  <a href="${resetUrl}" 
     style="
       display:inline-block;
       background:#2563eb;
       color:#fff;
       font-weight:bold;
       padding:12px 20px;
       border-radius:6px;
       text-decoration:none;
       font-size:14px;
     ">
    비밀번호 재설정하기
  </a>
</p>          <hr/>
          <p style="color:#666;font-size:12px">본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.</p>
        </div>`
    },
    en: {
      subject: '[Tranaisa] Reset your password',
      html: `
        <div style="font-family:Arial;padding:20px;background:#ffffff">
          <h2 style="margin:0 0 12px">Reset your password</h2>
          <p>Click the link below to set a new password (valid for 15 minutes, one-time use).</p>
<p>
  <a href="${resetUrl}" 
     style="
       display:inline-block;
       background:#2563eb;
       color:#fff;
       font-weight:bold;
       padding:12px 20px;
       border-radius:6px;
       text-decoration:none;
       font-size:14px;
     ">
    Reset your password
  </a>
</p>          <hr/>
          <p style="color:#666;font-size:12px">If you didn’t request this, you can ignore this email.</p>
        </div>`
    },
    zh: {
      subject: '[Tranaisa] 重置密码',
      html: `
        <div style="font-family:Arial;padding:20px;background:#ffffff">
          <h2 style="margin:0 0 12px">重置密码</h2>
          <p>点击下面的链接设置新密码（15分钟内有效，仅限一次）。</p>
          <p>
  <a href="${resetUrl}" 
     style="
       display:inline-block;
       background:#2563eb;
       color:#fff;
       font-weight:bold;
       padding:12px 20px;
       border-radius:6px;
       text-decoration:none;
       font-size:14px;
     ">
    重置密码
  </a>
</p>

          <hr/>
          <p style="color:#666;font-size:12px">如果您没有请求此操作，请忽略此邮件。</p>
        </div>`
    },
    ja: {
      subject: '[Tranaisa] パスワード再設定',
      html: `
        <div style="font-family:Arial;padding:20px;background:#ffffff">
          <h2 style="margin:0 0 12px">パスワード再設定</h2>
          <p>以下のリンクから新しいパスワードを設定してください。（15分以内・1回限り有効）</p>
          <p>
  <a href="${resetUrl}" 
     style="
       display:inline-block;
       background:#2563eb;
       color:#fff;
       font-weight:bold;
       padding:12px 20px;
       border-radius:6px;
       text-decoration:none;
       font-size:14px;
     ">
    パスワード再設定
  </a>
</p>
          <hr/>
          <p style="color:#666;font-size:12px">このリクエストに覚えがない場合は、このメールを無視してください。</p>
        </div>`
    }
  }

  const { subject, html } = messages[lang] || messages.en
  await sendMail(to, subject, html)
}

module.exports = { sendMail, sendVerificationEmail, sendPasswordResetEmail }
