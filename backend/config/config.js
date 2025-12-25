import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Application configuration
 * Centralizes all configuration values with validation
 */
const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Google Maps API configuration
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    // Best practice: Use different keys for different environments
    baseUrl: "https://maps.googleapis.com/maps/api",
  },

  // Security configuration
  security: {
    rateLimitWindowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests:
      parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:8080",
    ],
  },

  // Cache configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour in seconds
    checkPeriod: 600, // Check for expired keys every 10 minutes
  },

  // Google Maps API specific limits (best practices)
  googleMapsLimits: {
    // Free tier: 28,500 requests per month
    maxResultsPerQuery: 20, // Limit results to reduce quota usage
    maxRadius: 50000, // Maximum search radius in meters (50km)
    defaultRadius: 5000, // Default search radius (5km)
  },
};

/**
 * Validate required configuration
 */
export function validateConfig() {
  const errors = [];

  if (!config.googleMaps.apiKey) {
    errors.push(
      "GOOGLE_MAPS_API_KEY is required. Please set it in your .env file."
    );
  }

  if (config.googleMaps.apiKey === "your_google_maps_api_key_here") {
    errors.push(
      "Please replace the placeholder GOOGLE_MAPS_API_KEY with your actual API key."
    );
  }

  if (errors.length > 0) {
    console.error("❌ Configuration validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error(
      "\n📝 Please check your .env file and ensure all required values are set."
    );
    process.exit(1);
  }

  console.log("✅ Configuration validated successfully");
}

export default config;
