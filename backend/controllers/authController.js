const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const validEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const registerUser = async (req, res) => {
  try {
    const { name, email, password, organization } = req.body;

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanName || !cleanEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 100 characters"
      });
    }

    if (!validEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password is too long"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      organization: typeof organization === "string" ? organization.trim() : ""
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator access required."
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

const getMe = async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};


const crypto = require("crypto");

const setupAdmin = async (req, res) => {
  try {
    const setupKey = process.env.ADMIN_SETUP_KEY;
    const suppliedKey = req.get("x-admin-setup-key") || "";

    if (!setupKey || !suppliedKey ||
        suppliedKey.length !== setupKey.length ||
        !crypto.timingSafeEqual(Buffer.from(suppliedKey), Buffer.from(setupKey))) {
      return res.status(403).json({
        success: false,
        message: "Invalid administrator setup authorization."
      });
    }

    const oldEmail = "hasheermanegar@gmail.com";
    const adminEmail = "admin@vistaravidyanidhi.org.in";

    const existingAdmin = await User.findOne({
      email: adminEmail,
      role: "admin"
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Administrator setup is already complete."
      });
    }

    const account = await User.findOne({ email: oldEmail });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Existing account not found. No changes made."
      });
    }

    const emailOwner = await User.findOne({ email: adminEmail });

    if (emailOwner && !emailOwner._id.equals(account._id)) {
      return res.status(409).json({
        success: false,
        message: "Administrator email already belongs to another account."
      });
    }

    account.email = adminEmail;
    account.role = "admin";
    await account.save();

    return res.json({
      success: true,
      message: "Administrator account successfully configured.",
      user: {
        email: account.email,
        role: account.role
      }
    });
  } catch (error) {
    console.error("Admin setup error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Administrator setup failed."
    });
  }
};

module.exports = { registerUser, loginUser, getMe, setupAdmin };
