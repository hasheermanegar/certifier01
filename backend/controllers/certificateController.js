const Certificate = require("../models/Certificate");

const createCertificate = async (req, res) => {
  try {
    const { title, description, design, organization } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Certificate title is required"
      });
    }

    const certificate = await Certificate.create({
      title,
      description,
      design,
      organization: organization || req.user.organization,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Certificate template created",
      certificate
    });
  } catch (error) {
    console.error("Create certificate error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not create certificate"
    });
  }
};

const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({
      createdBy: req.user._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch certificates"
    });
  }
};

const getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    res.json({ success: true, certificate });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid certificate ID"
    });
  }
};

const updateCertificate = async (req, res) => {
  try {
    const { title, description, design, organization, status } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Certificate title cannot be empty"
        });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) updates.description = description;
    if (design !== undefined) updates.design = design;
    if (organization !== undefined) updates.organization = organization;
    if (status !== undefined) updates.status = status;

    const certificate = await Certificate.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    return res.json({
      success: true,
      message: "Certificate updated",
      certificate
    });
  } catch (error) {
    console.error("Update certificate error:", error.message);
    return res.status(400).json({
      success: false,
      message: "Could not update certificate"
    });
  }
};

const deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    res.json({
      success: true,
      message: "Certificate deleted"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not delete certificate"
    });
  }
};

module.exports = {
  createCertificate,
  getCertificates,
  getCertificate,
  updateCertificate,
  deleteCertificate
};
