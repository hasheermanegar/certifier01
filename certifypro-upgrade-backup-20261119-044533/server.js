const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const recipientRoutes = require("./routes/recipientRoutes");
const issuedCertificateRoutes = require("./routes/issuedCertificateRoutes");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/issued-certificates", issuedCertificateRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to CertifyPro Backend!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CertifyPro API is running!",
    status: "Healthy"
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`CertifyPro server running on port ${PORT}`);
  });
};

startServer();
