const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const { startExpiryJob } = require("./jobs/expiryJob");
const authRoutes = require("./routes/authRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const recipientRoutes = require("./routes/recipientRoutes");
const issuedCertificateRoutes = require("./routes/issuedCertificateRoutes");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://certifier01-git-vercel-frontend-deploy-h-7104.vercel.app",
  ...(process.env.NODE_ENV === "production" ? [] : [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ])
].filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." }
}));

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
app.use(express.json({ limit: "10mb" }));
app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false
}), authRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/issued-certificates", issuedCertificateRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to VistaraCertifications Backend!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "VistaraCertifications API is running!",
    status: "Healthy"
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  startExpiryJob();

  app.listen(PORT, () => {
    console.log(`VistaraCertifications server running on port ${PORT}`);
  });
};

startServer();
