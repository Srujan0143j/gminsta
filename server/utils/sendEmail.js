import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const isSMTPConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (isSMTPConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 2525,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const message = {
        from: `"${process.env.FROM_NAME || 'GMinsta'}" <${process.env.FROM_EMAIL || 'noreply@gminsta.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `<p>${options.message}</p>`,
      };

      const info = await transporter.sendMail(message);
      console.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('SMTP Email dispatch failed, printing to console:', error);
    }
  }

  // Local/Terminal fallback:
  console.log('\n==================================================');
  console.log('📬 DEVELOPMENT EMAIL SIMULATION');
  console.log(`To: ${options.email}`);
  console.log(`Subject: ${options.subject}`);
  console.log('Message Body:');
  console.log(options.message);
  console.log('==================================================\n');
  return { simulated: true };
};

export default sendEmail;
