const Recipient = require("../models/Recipient");

const addRecipient = async (req, res) => {
  try {
    const { name, email, organization } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid name and email are required"
      });
    }

    const recipient = await Recipient.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      organization:
        typeof organization === "string"
          ? organization.trim()
          : req.user.organization || "",
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Recipient added successfully",
      recipient
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email already exists in your recipient list"
      });
    }

    console.error("Add recipient error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not add recipient"
    });
  }
};

const bulkAddRecipients = async (req, res) => {
  try {
    const { recipients } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide a non-empty recipients array"
      });
    }

    if (recipients.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 1000 recipients per import"
      });
    }

    const validRecipients = recipients.filter(
      item =>
        item &&
        typeof item.name === "string" &&
        item.name.trim() &&
        typeof item.email === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email.trim())
    );

    const invalidCount = recipients.length - validRecipients.length;

    const operations = validRecipients.map(item => ({
      updateOne: {
        filter: {
          createdBy: req.user._id,
          email: item.email.trim().toLowerCase()
        },
        update: {
          $setOnInsert: {
            name: item.name.trim(),
            email: item.email.trim().toLowerCase(),
            organization: item.organization || req.user.organization || "",
            createdBy: req.user._id
          }
        },
        upsert: true
      }
    }));

    const result = operations.length
      ? await Recipient.bulkWrite(operations, { ordered: false })
      : { upsertedCount: 0 };

    res.status(200).json({
      success: true,
      message: "Recipient import completed",
      received: recipients.length,
      inserted: result.upsertedCount,
      skippedOrExisting: validRecipients.length - result.upsertedCount,
      invalid: invalidCount
    });
  } catch (error) {
    console.error("Bulk recipient import error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not import recipients"
    });
  }
};

const getRecipients = async (req, res) => {
  try {
    const filter = { createdBy: req.user._id };

    if (req.query.search) {
      const search = req.query.search.trim();
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } }
      ];
    }

    const recipients = await Recipient.find(filter).sort({
      createdAt: -1
    });

    res.json({
      success: true,
      count: recipients.length,
      recipients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch recipients"
    });
  }
};

const updateRecipient = async (req, res) => {
  try {
    const { name, email, organization } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty"
        });
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid email is required"
        });
      }
      updates.email = email.trim().toLowerCase();
    }

    if (organization !== undefined) {
      if (typeof organization !== "string") {
        return res.status(400).json({
          success: false,
          message: "Organization must be text"
        });
      }
      updates.organization = organization.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update"
      });
    }

    const recipient = await Recipient.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found"
      });
    }

    res.json({
      success: true,
      message: "Recipient updated",
      recipient
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email already exists in your recipient list"
      });
    }

    console.error("Update recipient error:", error.message);
    res.status(400).json({
      success: false,
      message: "Could not update recipient"
    });
  }
};

const deleteRecipient = async (req, res) => {
  try {
    const recipient = await Recipient.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found"
      });
    }

    res.json({
      success: true,
      message: "Recipient deleted"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not delete recipient"
    });
  }
};

module.exports = {
  addRecipient,
  bulkAddRecipients,
  getRecipients,
  updateRecipient,
  deleteRecipient
};
