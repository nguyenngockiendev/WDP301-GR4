import nodemailer from 'nodemailer';
import { AppError } from '../../shared/utils/errors.js';

export async function sendOtpEmail({ to, code, purpose }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS)
    throw new AppError('Email verification is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.', 503);

  const port = Number(SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  const isReset = purpose === 'RESET_PASSWORD';
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || SMTP_USER,
      to,
      subject: isReset ? 'Mã xác nhận đặt lại mật khẩu' : 'Xác nhận tài khoản Smart Rental',
      text: `Mã xác nhận của bạn là ${code}. Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#24352c"><h2>${isReset ? 'Đặt lại mật khẩu' : 'Xác nhận tài khoản'}</h2><p>Nhập mã sau trong Smart Rental để tiếp tục:</p><div style="font-size:30px;font-weight:700;letter-spacing:8px;padding:18px;background:#f1f7f3;border-radius:10px;text-align:center">${code}</div><p>Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p></div>`,
    });
  } catch {
    throw new AppError('Unable to send the email. Check the SMTP settings and try again.', 503);
  } finally {
    transporter.close();
  }
}
