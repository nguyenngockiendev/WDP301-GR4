import env from 'dotenv';
env.config();
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ServiceEmail = async data => {
  try {
    const result = await resend.emails.send({
      from: 'Haven Stay<noreply@learnova.top>',
      to: data.email,
      subject: data.subject,
      html: data.html,
    });
    return result;
  } catch (error) {
    throw error;
  }
};
export { ServiceEmail };
