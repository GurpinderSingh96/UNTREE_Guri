const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate verification token
const generateVerificationToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Send verification email
const sendVerificationEmail = async (user, origin) => {
  try {
    const token = generateVerificationToken(user._id);
    const verificationUrl = `${origin}/verify-email.html?token=${token}`;
    
    const message = {
      from: process.env.EMAIL_FROM || 'noreply@furni-demo.com',
      to: user.email,
      subject: 'Verify Your Email - Furni',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b5d50; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Furni</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e9e9e9; border-top: none;">
            <h2>Welcome to Furni!</h2>
            <p>Thank you for registering. Please verify your email address to complete your registration.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #3b5d50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
            </div>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            &copy; ${new Date().getFullYear()} Furni. All rights reserved.
          </div>
        </div>
      `
    };

    const info = await sgMail.send(message);
    console.log('Verification email sent:', info[0].statusCode);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (user) => {
  try {
    const message = {
      from: process.env.EMAIL_FROM || 'noreply@furni-demo.com',
      to: user.email,
      subject: 'Welcome to Furni!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b5d50; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Furni</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e9e9e9; border-top: none;">
            <h2>Welcome to the Furni Family!</h2>
            <p>Dear ${user.name},</p>
            <p>Thank you for joining Furni! Your account has been successfully verified.</p>
            <p>You now have access to our exclusive collection of furniture and home decor items.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5003'}/shop.html" style="background-color: #3b5d50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Start Shopping</a>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            &copy; ${new Date().getFullYear()} Furni. All rights reserved.
          </div>
        </div>
      `
    };

    const info = await sgMail.send(message);
    console.log('Welcome email sent:', info[0].statusCode);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  generateVerificationToken
};
