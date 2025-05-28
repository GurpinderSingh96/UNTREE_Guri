require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create test function
async function testEmailService() {
  console.log('Starting SendGrid email test...');
  console.log('Using SendGrid API key:', process.env.SENDGRID_API_KEY ? 'API key is set' : 'API key is missing');
  
  try {
    // Send test email
    console.log('Sending test email...');
    const msg = {
      to: 'work.gurpinder@gmail.com', // Change to your email
      from: process.env.EMAIL_FROM || 'noreply@furni-demo.com', // Use verified sender
      subject: 'SendGrid Test Email',
      text: 'This is a test email from SendGrid',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Service Test</h2>
          <p>This is a test email to verify that the SendGrid email service is working correctly.</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    const response = await sgMail.send(msg);
    console.log('Test email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('Headers:', response[0].headers);
    
    return true;
  } catch (error) {
    console.error('Error in email test:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return false;
  }
}

// Run the test
testEmailService()
  .then(success => {
    if (success) {
      console.log('Email test completed successfully!');
    } else {
      console.log('Email test failed. Please check the error logs above.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
