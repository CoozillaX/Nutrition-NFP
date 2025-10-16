const sgMail = require('@sendgrid/mail');
const { generateConfirmationPDF } = require('./pdf');

sgMail.setApiKey("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");

async function sendConfirmationEmail(toEmail, courseName, startTs, endTs, lngLat) {
  const attachment = await generateConfirmationPDF(courseName, startTs, endTs, lngLat);
  const msg = {
    to: toEmail,
    from: {
        email: 'noreply@coozillax.com',
        name: 'Nutrition NFP'
    },
    subject: 'Booking Confirmation',
    text: 'Your booking is confirmed. Please find the details in the attached PDF.',
    html: '<strong>Your booking is confirmed. Please find the details in the attached PDF.</strong>',
    attachments: [
        {
            content: attachment,
            filename: 'booking-confirmation.pdf',
            type: 'application/pdf',
            disposition: 'attachment',
        },
    ],
  };
  return sgMail.send(msg);
}

module.exports = { sendConfirmationEmail };
