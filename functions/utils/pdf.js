const { jsPDF } = require("jspdf");
const { formatDate } = require("./date");
const { formatLocation } = require("./location");

async function generateConfirmationPDF(courseName, startTs, endTs, lngLat) {
  const doc = new jsPDF();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Booking Confirmation", 105, 25, { align: "center" });
  doc.setDrawColor(150);
  doc.line(20, 35, 190, 35);

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const leftMargin = 25;
  let y = 50;

  doc.text("Dear User,", leftMargin, y);
  y += 10;
  doc.text("We are pleased to confirm your booking. Below are your details:", leftMargin, y);

  // Booking Details (indented)
  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Booking Details:", leftMargin, y);

  doc.setFont("helvetica", "normal");
  y += 10;
  doc.text(`Course Name: ${courseName}`, leftMargin + 10, y);
  y += 8;
  doc.text(`Start Time: ${formatDate(startTs)}`, leftMargin + 10, y);
  y += 8;
  doc.text(`End Time: ${formatDate(endTs)}`, leftMargin + 10, y);
  y += 8;
  doc.text(`Location: ${await formatLocation(lngLat)}`, leftMargin + 10, y);

  // Footer
  y += 20;
  doc.text("Thank you for your booking!", leftMargin, y);
  y += 10;
  doc.setFont("helvetica", "italic");
  doc.text("- Nutrition NFP", leftMargin, y);

  return doc.output("datauristring").split(',')[1]; // return base64 string
}

module.exports = { generateConfirmationPDF };
