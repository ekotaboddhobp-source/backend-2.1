import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Ekotaboddho B.P" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Registration OTP - Ekotaboddho B.P',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Welcome to Ekotaboddho B.P!</h2>
        <p>আপনার রেজিস্ট্রেশন নিশ্চিত করার জন্য নিচের OTP কোডটি ব্যবহার করুন:</p>
        <h1 style="color: #6C63FF; font-size: 40px; letter-spacing: 5px;">${otp}</h1>
        <p>এই কোডটি ১০ মিনিটের জন্য বৈধ।</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
