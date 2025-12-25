import express from "express";
import mapsController from "../controllers/mapsController.js";
import { validateSearchInput, strictLimiter } from "../middleware/security.js";

const router = express.Router();

/**
 * ROUTES: Maps Routes (MVC Pattern)
 * All business logic is handled in the controller
 */

// Search for places
router.post("/search", validateSearchInput, (req, res, next) =>
  mapsController.searchPlaces(req, res, next)
);

// Search nearby places
router.post("/nearby", validateSearchInput, (req, res, next) =>
  mapsController.nearbySearch(req, res, next)
);

// Get place details
router.get("/place/:placeId", (req, res, next) =>
  mapsController.getPlaceDetails(req, res, next)
);

// Geocode address
router.post("/geocode", (req, res, next) =>
  mapsController.geocodeAddress(req, res, next)
);

// Generate static map
router.post("/static-map", (req, res, next) =>
  mapsController.generateStaticMap(req, res, next)
);

// Get API statistics
router.get("/stats", (req, res) => mapsController.getStats(req, res));

// Clear cache
router.post("/clear-cache", strictLimiter, (req, res) =>
  mapsController.clearCache(req, res)
);

export default router;
