const nodemailer = require('nodemailer');

// Create a reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: `"Food Ordering System" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });
    
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send order delivery status update email
 * @param {string} email - Recipient email
 * @param {string} orderId - Order ID
 * @param {string} status - Delivery status
 * @param {string} deliveryPersonName - Delivery person's name
 */
const sendOrderStatusEmail = async (email, orderId, status, deliveryPersonName) => {
  // Generate subject based on status
  let subject = '';
  let headline = '';
  let detail = '';
  
  switch (status) {
    case 'Accepted':
      subject = `Your Order #${orderId.substring(0, 8)} has been accepted`;
      headline = 'Your order has been accepted!';
      detail = `${deliveryPersonName || 'Your delivery person'} has accepted your order and will be picking it up soon.`;
      break;
    case 'Picked Up':
      subject = `Your Order #${orderId.substring(0, 8)} is on the way`;
      headline = 'Your order is on the way!';
      detail = `${deliveryPersonName || 'Your delivery person'} has picked up your order and is on the way to deliver it.`;
      break;
    case 'Delivered':
      subject = `Your Order #${orderId.substring(0, 8)} has been delivered`;
      headline = 'Your order has been delivered!';
      detail = `${deliveryPersonName || 'Your delivery person'} has delivered your order. Enjoy your meal!`;
      break;
    default:
      subject = `Update on your Order #${orderId.substring(0, 8)}`;
      headline = `Your order status has been updated to ${status}`;
      detail = 'Check the app for more details.';
  }
  
  // Create text and HTML versions of the email
  const text = `
    ${headline}
    
    ${detail}
    
    Order ID: ${orderId}
    Current Status: ${status}
    
    Thank you for using our Food Ordering System!
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #e53935;">${headline}</h1>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="font-size: 16px; line-height: 1.5; color: #333;">${detail}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #333;">Order Details:</h3>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 5px 0;"><strong>Current Status:</strong> 
          <span style="padding: 2px 8px; border-radius: 3px; background-color: ${status === 'Accepted' ? '#4caf50' : status === 'Picked Up' ? '#2196f3' : '#8bc34a'}; color: white;">
            ${status}
          </span>
        </p>
        ${status === 'Accepted' ? '<p>We\'ll notify you again when your order is picked up.</p>' : ''}
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 15px; text-align: center; color: #666; font-size: 14px;">
        <p>Thank you for using our Food Ordering System!</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, text, html);
};

module.exports = {
  sendEmail,
  sendOrderStatusEmail
}; 