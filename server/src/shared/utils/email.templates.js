const emailLayout = ({ heading, description, content }) => `
  <div style="background:#f8fafc;padding:32px 16px;font-family:Arial,sans-serif;">
    <div style="max-width:500px;margin:auto;background:#ffffff;
                border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
      <h2 style="color:#059669;text-align:center;margin-top:0;">
        Haven Stay
      </h2>

      <h3 style="color:#0f172a;text-align:center;">
        ${heading}
      </h3>

      <p style="color:#475569;line-height:1.6;">
        ${description}
      </p>

      ${content}

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;">
        Đây là email tự động từ Haven Stay. Vui lòng không trả lời email này.
      </p>
    </div>
  </div>
`;

const otpContent = otp => `
  <div style="background:#ecfdf5;border:1px dashed #059669;
              border-radius:12px;padding:20px;text-align:center;">
    <strong style="color:#047857;font-size:32px;letter-spacing:6px;">
      ${otp}
    </strong>
  </div>

  <p style="color:#475569;text-align:center;">
    Mã có hiệu lực trong <strong>5 phút</strong>.
  </p>

  <p style="color:#64748b;font-size:13px;line-height:1.6;">
    Không chia sẻ mã này với bất kỳ ai.
    Nếu bạn không thực hiện yêu cầu, hãy bỏ qua email này.
  </p>
`;

const emailTemplates = {
  register: ({ otp }) => ({
    subject: '[Haven Stay] Xác thực đăng ký tài khoản',
    html: emailLayout({
      heading: 'Xác thực tài khoản',
      description: 'Chào mừng bạn đến với Haven Stay! Sử dụng mã dưới đây để hoàn tất đăng ký.',
      content: otpContent(otp),
    }),
  }),

  forgot_password: ({ otp }) => ({
    subject: '[Haven Stay] Đặt lại mật khẩu',
    html: emailLayout({
      heading: 'Đặt lại mật khẩu',
      description:
        'Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn. Sử dụng mã dưới đây để tiếp tục.',
      content: otpContent(otp),
    }),
  }),
};

export default emailTemplates;
