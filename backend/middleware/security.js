import rateLimit from "express-rate-limit";
import config from "../config/config.js";

/**
 * Rate limiter middleware to prevent API abuse
 * Best practice: Protect your API from excessive requests
 */
export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter:
      Math.ceil(config.security.rateLimitWindowMs / 1000 / 60) + " minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
      retryAfter:
        Math.ceil(config.security.rateLimitWindowMs / 1000 / 60) + " minutes",
    });
  },
});

/**
 * Stricter rate limiter for expensive operations
 */
export const strictLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // Max 10 requests per minute
  message: {
    error: "Too many requests for this operation",
    retryAfter: "1 minute",
  },
});

/**
 * API key validation middleware (if using custom API keys)
 * Best practice: Implement authentication for production
 */
export const validateApiKey = (req, res, next) => {
  // For development, skip validation
  if (config.nodeEnv === "development") {
    return next();
  }

  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "API key is required",
    });
  }

  // In production, validate against stored API keys
  // This is a placeholder - implement proper validation
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Invalid API key",
    });
  }

  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  // Google Maps API specific errors
  if (err.message.includes("Google Maps API")) {
    return res.status(502).json({
      error: "External API Error",
      message: "Failed to communicate with Google Maps API",
      details: config.nodeEnv === "development" ? err.message : undefined,
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.name || "Internal Server Error",
    message: err.message || "An unexpected error occurred",
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "❌" : "✅";
    console.log(
      `${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

/**
 * Input validation middleware
 */
export const validateSearchInput = (req, res, next) => {
  const { query, location, radius } = req.body;

  // Validate query
  if (query && typeof query !== "string") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Query must be a string",
    });
  }

  // Validate location
  if (location) {
    if (typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(400).json({
        error: "Validation Error",
        message: "Location must have valid lat and lng coordinates",
      });
    }

    if (location.lat < -90 || location.lat > 90) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Latitude must be between -90 and 90",
      });
    }

    if (location.lng < -180 || location.lng > 180) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Longitude must be between -180 and 180",
      });
    }
  }

  // Validate radius
  if (radius !== undefined) {
    const radiusNum = parseInt(radius);
    if (isNaN(radiusNum) || radiusNum <= 0) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Radius must be a positive number",
      });
    }
  }

  next();
};
