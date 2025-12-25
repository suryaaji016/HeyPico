import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import config, { validateConfig } from "./config/config.js";
import mapsRouter from "./routes/maps.js";
import {
  apiLimiter,
  errorHandler,
  requestLogger,
} from "./middleware/security.js";

validateConfig();

const app = express();

// security stuff
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
        ],
        scriptSrc: ["'self'", "https://maps.googleapis.com"],
        connectSrc: ["'self'", "https://maps.googleapis.com"],
        frameSrc: ["https://www.google.com"],
      },
    },
  })
);

// CORS config
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (config.security.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// logging
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}
app.use(requestLogger);

// rate limiting
app.use("/api/", apiLimiter);

// health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

// routes
app.use("/api/maps", mapsRouter);

// Serve static files (for map viewer)
app.use(express.static("public"));

// root
app.get("/", (req, res) => {
  res.json({
    name: "HeyPico Maps API",
    version: "1.0",
    endpoints: [
      "POST /api/maps/search",
      "POST /api/maps/nearby",
      "POST /api/maps/geocode",
      "GET /health",
    ],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      "GET /",
      "GET /health",
      "POST /api/maps/search",
      "POST /api/maps/nearby",
      "GET /api/maps/place/:placeId",
      "POST /api/maps/geocode",
    ],
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log("🚀 HeyPico Maps LLM API Server Started");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(
    `🗺️  Google Maps API: ${
      config.googleMaps.apiKey ? "✅ Configured" : "❌ Not configured"
    }`
  );
  console.log(`⏱️  Cache TTL: ${config.cache.ttl} seconds`);
  console.log(
    `🔒 Rate Limit: ${config.security.rateLimitMaxRequests} requests per ${
      config.security.rateLimitWindowMs / 1000 / 60
    } minutes`
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📚 API Documentation available at: http://localhost:" + PORT);
  console.log(
    "🗺️  Map Viewer available at: http://localhost:" + PORT + "/map-viewer"
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n💡 Next steps:");
  console.log("   1. Ensure your .env file has a valid GOOGLE_MAPS_API_KEY");
  console.log(
    "   2. Test the API: POST http://localhost:" + PORT + "/api/maps/search"
  );
  console.log("   3. Integrate with Open WebUI using the function definitions");
  console.log(
    "   4. Monitor usage at: http://localhost:" + PORT + "/api/maps/stats\n"
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received, shutting down gracefully");
  process.exit(0);
});

export default app;
