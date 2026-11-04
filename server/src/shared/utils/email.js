import env from 'dotenv';
env.config();
import { Resend } from 'resend';

const ServiceEmail = async data => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Thiếu RESEND_API_KEY; hãy cấu hình để gửi email OTP.');
  }

  const resend = new Resend(apiKey);
  return resend.emails.send({
    from: 'Haven Stay<noreply@learnova.top>',
    to: data.email,
    subject: data.subject,
    html: data.html,
  });
};
export { ServiceEmail };
