import nodemailer from 'nodemailer';

export async function sendOtpEmail({ to, code, purpose }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw { status: 503, message: 'Chưa cấu hình SMTP để gửi mã xác thực.' };
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  const subject = purpose === 'register' ? 'Xác thực tài khoản Haven Stay' : 'Mã xác thực Haven Stay';
  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text: `Mã xác thực của bạn là ${code}. Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.`,
  });
}
