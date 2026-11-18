const crypto = require("crypto");
const QRCode = require("qrcode");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const Certificate = require("../models/Certificate");
const Recipient = require("../models/Recipient");
const IssuedCertificate = require("../models/IssuedCertificate");

const issueCertificate = async (req, res) => {
  try {
    const { templateId, recipientId } = req.body;

    if (!templateId || !recipientId) {
      return res.status(400).json({
        success: false,
        message: "Template ID and recipient ID are required"
      });
    }

    const validObjectId = id => /^[a-fA-F0-9]{24}$/.test(String(id));

    if (!validObjectId(templateId) || !validObjectId(recipientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template or recipient ID"
      });
    }

    const template = await Certificate.findOne({
      _id: templateId,
      createdBy: req.user._id
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Certificate template not found"
      });
    }

    const recipient = await Recipient.findOne({
      _id: recipientId,
      createdBy: req.user._id
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found"
      });
    }

    const certificateId =
      "CP-" + crypto.randomBytes(8).toString("hex").toUpperCase();

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const verificationUrl =
      `${frontendUrl}/verify/${certificateId}`;

    const qrCode = await QRCode.toDataURL(verificationUrl);

    const issuedCertificate = await IssuedCertificate.create({
      certificateId,
      template: template._id,
      recipient: recipient._id,
      createdBy: req.user._id,
      verificationUrl,
      qrCode
    });

    res.status(201).json({
      success: true,
      message: "Certificate issued successfully",
      certificate: {
        id: issuedCertificate._id,
        certificateId,
        template: template.title,
        recipient: recipient.name,
        recipientEmail: recipient.email,
        issuedAt: issuedCertificate.issuedAt,
        verificationUrl,
        qrCode,
        status: issuedCertificate.status
      }
    });
  } catch (error) {
    console.error("Issue certificate error:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not issue certificate"
    });
  }
};

const getIssuedCertificates = async (req, res) => {
  try {
    const certificates = await IssuedCertificate.find({
      createdBy: req.user._id
    })
      .populate("template", "title")
      .populate("recipient", "name email")
      .sort({ issuedAt: -1 });

    res.json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch issued certificates"
    });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const certificate = await IssuedCertificate.findOne({
      certificateId: req.params.certificateId
    })
      .populate("template", "title organization")
      .populate("recipient", "name email");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: "Certificate not found"
      });
    }

    if (!certificate.template || !certificate.recipient) {
      return res.status(410).json({
        success: false,
        verified: false,
        message: "Certificate data is incomplete and cannot be verified"
      });
    }

    if (certificate.status === "revoked") {
      return res.json({
        success: true,
        verified: false,
        message: "This certificate has been revoked",
        certificateId: certificate.certificateId,
        status: certificate.status
      });
    }

    res.json({
      success: true,
      verified: true,
      message: "Certificate is authentic and valid",
      certificate: {
        certificateId: certificate.certificateId,
        recipientName: certificate.recipient.name,
        certificateTitle: certificate.template.title,
        organization: certificate.template.organization,
        issuedAt: certificate.issuedAt,
        status: certificate.status
      }
    });
  } catch (error) {
    console.error("Verification error:", error.message);
    res.status(500).json({
      success: false,
      verified: false,
      message: "Could not verify certificate"
    });
  }
};

const revokeCertificate = async (req, res) => {
  try {
    const certificate = await IssuedCertificate.findOneAndUpdate(
      {
        certificateId: req.params.certificateId,
        createdBy: req.user._id
      },
      { status: "revoked" },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Issued certificate not found"
      });
    }

    res.json({
      success: true,
      message: "Certificate revoked successfully",
      certificateId: certificate.certificateId,
      status: certificate.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not revoke certificate"
    });
  }
};


const downloadCertificatePDF = async (req, res) => {
  try {
    const certificate = await IssuedCertificate.findOne({
      certificateId: req.params.certificateId,
      createdBy: req.user._id
    })
      .populate("template")
      .populate("recipient");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    if (certificate.status !== "valid") {
      return res.status(400).json({
        success: false,
        message: "Revoked certificates cannot be downloaded"
      });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Certificate border
    page.drawRectangle({
      x: 24,
      y: 24,
      width: width - 48,
      height: height - 48,
      borderColor: rgb(0.12, 0.25, 0.45),
      borderWidth: 3
    });

    page.drawRectangle({
      x: 34,
      y: 34,
      width: width - 68,
      height: height - 68,
      borderColor: rgb(0.75, 0.62, 0.30),
      borderWidth: 1
    });

    const centerText = (text, y, size, selectedFont, color = rgb(0.12, 0.16, 0.23)) => {
      const textWidth = selectedFont.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y,
        size,
        font: selectedFont,
        color
      });
    };

    centerText(
      certificate.template.organization || "CertifyPro",
      510,
      18,
      bold,
      rgb(0.12, 0.25, 0.45)
    );

    centerText("CERTIFICATE OF ACHIEVEMENT", 455, 28, bold);

    centerText("This certificate is proudly presented to", 410, 15, font);

    centerText(
      certificate.recipient.name,
      355,
      34,
      bold,
      rgb(0.12, 0.25, 0.45)
    );

    centerText("For successfully completing", 315, 16, font);

    centerText(
      certificate.template.title,
      280,
      22,
      bold
    );

    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(
      "en-IN",
      { day: "2-digit", month: "long", year: "numeric" }
    );

    centerText("Issued on " + issuedDate, 235, 14, font);

    centerText(
      "Certificate ID: " + certificate.certificateId,
      195,
      12,
      bold
    );

    // Embed verification QR code
    const qrDataUrl = await QRCode.toDataURL(certificate.verificationUrl);
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, "base64"));

    page.drawImage(qrImage, {
      x: (width - 92) / 2,
      y: 82,
      width: 92,
      height: 92
    });

    centerText("Scan to verify authenticity", 65, 10, font);

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="' + certificate.certificateId + '.pdf"'
    );
    res.setHeader("Content-Length", pdfBytes.length);

    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("PDF generation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not generate certificate PDF"
    });
  }
};

module.exports = {
  issueCertificate,
  getIssuedCertificates,
  verifyCertificate,
  revokeCertificate,
  downloadCertificatePDF
};
