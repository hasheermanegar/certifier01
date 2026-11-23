const crypto = require("crypto");
const QRCode = require("qrcode");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const Certificate = require("../models/Certificate");
const Recipient = require("../models/Recipient");
const IssuedCertificate = require("../models/IssuedCertificate");
const { sendCertificateEmail } = require("../services/certificateMailer");

const issueCertificate = async (req, res) => {
  try {
    const { templateId, recipientId, title, expiresAt, sendEmail = true } = req.body;

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

    let parsedExpiry = null;
    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
      if (Number.isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
        return res.status(400).json({ success: false, message: "Expiry date must be a valid future date" });
      }
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
      designSnapshot: template.design || {},
      recipientSnapshot: {
        name: recipient.name,
        email: recipient.email,
        organization: recipient.organization || ""
      },
      expiresAt: parsedExpiry,
      templateSnapshot: {
        title: typeof title === "string" && title.trim() ? title.trim().slice(0, 180) : template.title,
        description: template.description || "",
        organization: template.organization || ""
      },
      verificationUrl,
      qrCode
    });

    let emailStatus = "not_configured";
    if (sendEmail !== false) {
      try {
        const pdfBuffer = await createCertificatePdfAttachment(
          issuedCertificate.certificateId,
          req.user._id
        );
        const delivery = await sendCertificateEmail({
          to: recipient.email,
          recipientName: recipient.name,
          certificateTitle: issuedCertificate.templateSnapshot.title,
          verificationUrl,
          certificateId: issuedCertificate.certificateId,
          pdfBuffer
        });
        emailStatus = delivery.status;
        if (emailStatus === "sent") issuedCertificate.emailSentAt = new Date();
      } catch (mailError) {
        emailStatus = "failed";
        console.error("Certificate email delivery failed:", mailError.message);
      }
      issuedCertificate.emailStatus = emailStatus;
      await issuedCertificate.save();
    }

    res.status(201).json({
      success: true,
      message: "Certificate issued successfully",
      certificate: {
        id: issuedCertificate._id,
        certificateId,
        template: issuedCertificate.templateSnapshot.title,
        title: issuedCertificate.templateSnapshot.title,
        recipient: recipient.name,
        recipientEmail: recipient.email,
        issuedAt: issuedCertificate.issuedAt,
        verificationUrl,
        qrCode,
        status: issuedCertificate.status,
        expiresAt: issuedCertificate.expiresAt,
        emailStatus: issuedCertificate.emailStatus,
        emailSentAt: issuedCertificate.emailSentAt
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
      .populate("template", "title organization description")
      .populate("recipient", "name email organization");

    if (!certificate) {
      return res.status(404).json({
        success: true,
        verified: false,
        message: "Certificate not found"
      });
    }

    const recipientName =
      certificate.recipientSnapshot?.name ||
      certificate.recipient?.name;

    const certificateTitle =
      certificate.templateSnapshot?.title ||
      certificate.template?.title;

    const organization =
      certificate.templateSnapshot?.organization ||
      certificate.recipientSnapshot?.organization ||
      certificate.template?.organization ||
      certificate.recipient?.organization ||
      "";

    const certificateDetails = {
      certificateId: certificate.certificateId,
      recipientName: recipientName || "Not available",
      certificateTitle: certificateTitle || "Not available",
      organization,
      issuedAt: certificate.issuedAt,
      status: certificate.status
    };

    if (certificate.status === "revoked") {
      return res.json({
        success: true,
        verified: false,
        message: "This certificate has been revoked",
        status: certificate.status,
        certificate: certificateDetails
      });
    }

    if (certificate.expiresAt && certificate.expiresAt <= new Date()) {
      if (certificate.status !== "expired") {
        certificate.status = "expired";
        await certificate.save();
      }
      return res.json({
        success: true,
        verified: false,
        message: "This certificate has expired",
        certificateId: certificate.certificateId,
        status: "expired",
        expiresAt: certificate.expiresAt
      });
    }

    if (!recipientName || !certificateTitle) {
      return res.status(410).json({
        success: true,
        verified: false,
        message: "Certificate data is incomplete and cannot be verified"
      });
    }

    return res.json({
      success: true,
      verified: true,
      message: "Certificate is authentic and valid",
      certificate: certificateDetails
    });
  } catch (error) {
    console.error("Verification error:", error.message);
    return res.status(500).json({
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


const resendCertificateEmail = async (req, res) => {
  try {
    const certificate = await IssuedCertificate.findOne({
      certificateId: req.params.certificateId,
      createdBy: req.user._id
    }).populate("recipient", "name email");

    if (!certificate) return res.status(404).json({ success: false, message: "Issued certificate not found" });
    if (certificate.status !== "valid") return res.status(409).json({ success: false, message: "Only valid certificates can be emailed" });

    if (certificate.expiresAt && certificate.expiresAt <= new Date()) {
      certificate.status = "expired";
      await certificate.save();
      return res.status(409).json({ success: false, message: "Expired certificates cannot be emailed" });
    }

    const recipientName = certificate.recipientSnapshot?.name || certificate.recipient?.name;
    const recipientEmail = certificate.recipientSnapshot?.email || certificate.recipient?.email;
    const certificateTitle = certificate.templateSnapshot?.title || "Certificate";
    const pdfBuffer = await createCertificatePdfAttachment(
      certificate.certificateId,
      req.user._id
    );
    const delivery = await sendCertificateEmail({
      to: recipientEmail,
      recipientName,
      certificateTitle,
      verificationUrl: certificate.verificationUrl,
      certificateId: certificate.certificateId,
      pdfBuffer
    });

    certificate.emailStatus = delivery.status;
    if (delivery.status === "sent") certificate.emailSentAt = new Date();
    await certificate.save();

    return res.json({ success: true, emailStatus: certificate.emailStatus, emailSentAt: certificate.emailSentAt });
  } catch (error) {
    console.error("Resend certificate email error:", error.message);
    return res.status(500).json({ success: false, message: "Could not send certificate email. Check Gmail API configuration." });
  }
};

const setCertificateExpiry = async (req, res) => {
  try {
    const { expiresAt } = req.body;
    let parsedExpiry = null;

    if (expiresAt !== null && expiresAt !== "") {
      parsedExpiry = new Date(expiresAt);
      if (Number.isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
        return res.status(400).json({ success: false, message: "Expiry date must be a valid future date, or empty to remove expiry" });
      }
    }

    const certificate = await IssuedCertificate.findOne({
      certificateId: req.params.certificateId,
      createdBy: req.user._id
    });

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Issued certificate not found" });
    }
    if (certificate.status === "revoked") {
      return res.status(409).json({ success: false, message: "A revoked certificate cannot be changed" });
    }

    certificate.expiresAt = parsedExpiry;
    certificate.status = "valid";
    await certificate.save();

    return res.json({
      success: true,
      message: "Certificate expiry updated",
      certificate: {
        certificateId: certificate.certificateId,
        expiresAt: certificate.expiresAt,
        status: certificate.status
      }
    });
  } catch (error) {
    console.error("Set certificate expiry error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update certificate expiry" });
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
        message: "Expired or revoked certificates cannot be downloaded"
      });
    }

    if (certificate.expiresAt && certificate.expiresAt <= new Date()) {
      certificate.status = "expired";
      await certificate.save();
      return res.status(400).json({
        success: false,
        message: "Expired certificates cannot be downloaded"
      });
    }

    const design =
      certificate.designSnapshot ||
      certificate.template?.design ||
      {};

    const recipient = certificate.recipientSnapshot || {
      name: certificate.recipient?.name || "",
      email: certificate.recipient?.email || "",
      organization: certificate.recipient?.organization || ""
    };

    const template = certificate.templateSnapshot || {
      title: certificate.template?.title || "Certificate",
      organization: certificate.template?.organization || ""
    };

    if (!recipient.name || !template.title) {
      return res.status(410).json({
        success: false,
        message: "Certificate design or recipient data is incomplete"
      });
    }

    const pdfDoc = await PDFDocument.create();

    const width = Math.max(100, Number(design.width) || 1120);
    const height = Math.max(100, Number(design.height) || 790);
    const page = pdfDoc.addPage([width, height]);

    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const boldItalicFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

    const parseColor = (value, fallback = "#000000") => {
      const color = String(value || fallback).trim();
      const match = color.match(/^#?([0-9a-f]{6})$/i);

      if (!match) return rgb(0, 0, 0);

      const hex = match[1];
      return rgb(
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255
      );
    };

    const embedDataImage = async (data) => {
      if (typeof data !== "string") return null;

      const match = data.match(
        /^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=\s]+)$/i
      );

      if (!match) return null;

      const buffer = Buffer.from(match[2], "base64");

      if (match[1].toLowerCase() === "png") {
        return pdfDoc.embedPng(buffer);
      }

      return pdfDoc.embedJpg(buffer);
    };

    const drawImage = async (data, x, y, w, h) => {
      try {
        const image = await embedDataImage(data);
        if (!image) return false;

        const scale = Math.min(
          w / image.width,
          h / image.height
        );

        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;

        page.drawImage(image, {
          x: x + (w - drawWidth) / 2,
          y: y + (h - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight
        });

        return true;
      } catch (error) {
        console.warn("Skipping unsupported certificate image:", error.message);
        return false;
      }
    };

    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString(
      "en-IN",
      { day: "2-digit", month: "long", year: "numeric" }
    );

    const replacePlaceholders = (value) =>
      String(value ?? "")
        .replace(/\{\{\s*recipient_name\s*\}\}/gi, recipient.name || "")
        .replace(/\{\{\s*recipient_email\s*\}\}/gi, recipient.email || "")
        .replace(/\{\{\s*organization\s*\}\}/gi, template.organization || "")
        .replace(/\{\{\s*certificate_title\s*\}\}/gi, template.title || "")
        .replace(/\{\{\s*issue_date\s*\}\}/gi, issuedDate)
        .replace(/\{\{\s*certificate_id\s*\}\}/gi, certificate.certificateId)
        .replace(/\{\{\s*verification_url\s*\}\}/gi, certificate.verificationUrl);

    // Background colour.
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: parseColor(design.background, "#ffffff")
    });

    // Background image, if saved with the design.
    if (design.backgroundImage) {
      try {
        const image = await embedDataImage(design.backgroundImage);

        if (image) {
          page.drawImage(image, {
            x: 0,
            y: 0,
            width,
            height
          });
        }
      } catch (error) {
        console.warn("Background image could not be embedded:", error.message);
      }
    }

    for (const element of (Array.isArray(design.elements) ? design.elements : [])) {
      const x = Number(element.x) || 0;
      const top = Number(element.y) || 0;
      const w = Math.max(0, Number(element.width) || 0);
      const h = Math.max(0, Number(element.height) || 0);
      const y = height - top - h;

      if (element.type === "image") {
        await drawImage(element.src, x, y, w, h);
        continue;
      }

      if (element.type === "qr") {
        const qrValue =
          element.qrMode === "automatic"
            ? certificate.verificationUrl
            : replacePlaceholders(element.text || certificate.verificationUrl);

        const qrData = await QRCode.toDataURL(qrValue);
        await drawImage(qrData, x, y, w, h);
        continue;
      }

      if (element.type === "shape") {
        const fill = element.fill && element.fill !== "transparent"
          ? parseColor(element.fill)
          : undefined;

        const stroke = element.stroke
          ? parseColor(element.stroke)
          : undefined;

        const shape = String(element.shape || "rectangle").toLowerCase();

        if (shape === "circle" || shape === "ellipse") {
          page.drawEllipse({
            x: x + w / 2,
            y: y + h / 2,
            xScale: w / 2,
            yScale: h / 2,
            color: fill,
            borderColor: stroke,
            borderWidth: Number(element.strokeWidth) || 0
          });
        } else {
          page.drawRectangle({
            x,
            y,
            width: w,
            height: h,
            color: fill,
            borderColor: stroke,
            borderWidth: Number(element.strokeWidth) || 0
          });
        }

        continue;
      }

      if (element.type === "text" || element.type === "attribute") {
        const text = replacePlaceholders(element.text || "");
        if (!text || !w || !h) continue;

        const fontSize = Math.max(1, Number(element.fontSize) || 18);
        const isBold = Boolean(element.bold);
        const isItalic = Boolean(element.italic);

        const selectedFont = isBold && isItalic
          ? boldItalicFont
          : isBold
            ? boldFont
            : isItalic
              ? italicFont
              : standardFont;

        let displayText = text;

        if (element.textTransform === "uppercase") {
          displayText = displayText.toUpperCase();
        } else if (element.textTransform === "lowercase") {
          displayText = displayText.toLowerCase();
        }

        // Replace characters unsupported by PDF standard fonts without
        // changing the saved certificate design.
        displayText = Array.from(displayText).map(character => {
          if (character === "\n" || character === "\r") return character;
          try {
            selectedFont.encodeText(character);
            return character;
          } catch {
            return "*";
          }
        }).join("");

        const lines = displayText.split(/\r?\n/);
        const lineHeight = fontSize * (Number(element.lineHeight) || 1.25);
        const padding = Number(element.padding) || 3;
        const align = element.align || "left";

        lines.forEach((line, index) => {
          const lineWidth = selectedFont.widthOfTextAtSize(line, fontSize);
          let textX = x + padding;

          if (align === "center") {
            textX = x + (w - lineWidth) / 2;
          } else if (align === "right") {
            textX = x + w - lineWidth - padding;
          }

          const textY = y + h - fontSize - padding - index * lineHeight;

          if (textY >= y - fontSize && textX < x + w) {
            page.drawText(line, {
              x: textX,
              y: textY,
              size: fontSize,
              font: selectedFont,
              color: parseColor(element.color, "#000000"),
              maxWidth: w
            });
          }
        });
      }
    }

    // Ensure an automatic verification QR exists even if the design has no QR element.
    const hasQrElement = (design.elements || []).some(
      element => element.type === "qr"
    );

    if (!hasQrElement) {
      const qrData = await QRCode.toDataURL(certificate.verificationUrl);
      await drawImage(qrData, width - 110, 20, 85, 85);
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="' + certificate.certificateId + '.pdf"'
    );
    res.setHeader("Content-Length", pdfBytes.length);

    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("PDF generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not generate certificate PDF"
    });
  }
};


const createCertificatePdfAttachment = async (certificateId, userId) => {
  let pdfBuffer = null;
  let statusCode = 200;
  let generationError = null;

  const mockResponse = {
    setHeader() { return this; },
    status(code) {
      statusCode = code;
      return this;
    },
    send(data) {
      pdfBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      return this;
    },
    json(data) {
      generationError = data?.message || "PDF generation failed";
      return this;
    }
  };

  await downloadCertificatePDF(
    { params: { certificateId }, user: { _id: userId } },
    mockResponse
  );

  if (statusCode !== 200 || !pdfBuffer || !pdfBuffer.length) {
    throw new Error(generationError || "Could not generate certificate PDF attachment");
  }

  return pdfBuffer;
};

module.exports = {
  issueCertificate,
  getIssuedCertificates,
  verifyCertificate,
  revokeCertificate,
  setCertificateExpiry,
  resendCertificateEmail,
  downloadCertificatePDF
};
