import sgMail from "@sendgrid/mail";
import { Timestamp } from "firebase-admin/firestore";
import { generateConfirmationPDF } from "./pdf";
import { SENDGRID_API_KEY } from "./secrets";

/**
 * Send a booking confirmation email with PDF attachment.
 * @param toEmail Recipient's email address
 * @param courseName Name of the course
 * @param startTs Start time as Firestore Timestamp
 * @param endTs End time as Firestore Timestamp
 * @param lngLat Location as [longitude, latitude] or null for online
 * @returns SendGrid response
 */
async function sendConfirmationEmail(
  toEmail: string,
  courseName: string,
  startTs: Timestamp,
  endTs: Timestamp,
  lngLat: number[] | null
): Promise<[sgMail.ClientResponse, {}]> {
  const attachment = await generateConfirmationPDF(
    courseName,
    startTs,
    endTs,
    lngLat
  );
  const msg = {
    to: toEmail,
    from: {
      email: "noreply@coozillax.com",
      name: "Nutrition NFP"
    },
    subject: "Booking Confirmation",
    text: "Your booking is confirmed. Please find the details in the attached PDF.",
    html: "<strong>Your booking is confirmed. Please find the details in the attached PDF.</strong>",
    attachments: [
      {
        content: attachment,
        filename: "booking-confirmation.pdf",
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };

  sgMail.setApiKey(SENDGRID_API_KEY.value());
  return sgMail.send(msg);
}

export { sendConfirmationEmail };
