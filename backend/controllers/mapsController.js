import googleMapsService from "../services/googleMapsService.js";
import Place from "../models/Place.js";
import SearchQuery from "../models/SearchQuery.js";

class MapsController {
  // search places
  async searchPlaces(req, res, next) {
    try {
      const searchQuery = new SearchQuery(req.body);
      const validation = searchQuery.validate();

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          errors: validation.errors,
        });
      }

      if (!searchQuery.query) {
        return res.status(400).json({
          success: false,
          error: "Query is required",
        });
      }

      const options = {};
      if (searchQuery.location) {
        options.location = `${searchQuery.location.lat},${searchQuery.location.lng}`;
        options.radius = searchQuery.radius;
      }

      const results = await googleMapsService.searchPlaces(
        searchQuery.query,
        options
      );

      // convert to model
      const places = results.places.map((place) => new Place(place));

      res.json({
        success: true,
        query: searchQuery.query,
        count: places.length,
        results: places.map((p) => p.toJSON()),
      });
    } catch (error) {
      next(error);
    }
  }

  // nearby search
  async nearbySearch(req, res, next) {
    try {
      const searchQuery = new SearchQuery(req.body);
      const validation = searchQuery.validate();

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: "Validation Error",
          errors: validation.errors,
        });
      }

      if (
        !searchQuery.location ||
        !searchQuery.location.lat ||
        !searchQuery.location.lng
      ) {
        return res.status(400).json({
          success: false,
          error: "Location with lat/lng is required",
        });
      }

      const results = await googleMapsService.nearbySearch(
        searchQuery.location,
        searchQuery.type,
        searchQuery.radius
      );

      const places = results.places.map((place) => new Place(place));

      res.json({
        success: true,
        location: searchQuery.location,
        type: searchQuery.type || "all",
        count: places.length,
        results: places.map((p) => p.toJSON()),
      });
    } catch (error) {
      next(error);
    }
  }

  // place details
  async getPlaceDetails(req, res, next) {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        return res.status(400).json({
          success: false,
          error: "Place ID is required",
        });
      }

      const details = await googleMapsService.getPlaceDetails(placeId);
      const place = new Place(details);

      res.json({
        success: true,
        place: {
          ...place.toJSON(),
          phoneNumber: place.phoneNumber,
          website: place.website,
          openingHours: place.openingHours,
          reviews: place.reviews,
          mapUrl: place.getMapUrl(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // geocode
  async geocodeAddress(req, res, next) {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: "Address is required",
        });
      }

      const result = await googleMapsService.geocodeAddress(address);

      res.json({
        success: true,
        address,
        result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate static map
   * POST /api/maps/static-map
   */
  async generateStaticMap(req, res, next) {
    try {
      const { markers, options } = req.body;

      if (!markers || !Array.isArray(markers) || markers.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Bad Request",
          message: "Markers array is required",
        });
      }

      const mapUrl = googleMapsService.generateStaticMapUrl(markers, options);

      res.json({
        success: true,
        mapUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get API statistics
   * GET /api/maps/stats
   */
  getStats(req, res) {
    const stats = googleMapsService.getUsageStats();
    res.json({
      success: true,
      stats,
      message: "Monitor your API usage to stay within free tier limits",
    });
  }

  /**
   * Clear cache
   * POST /api/maps/clear-cache
   */
  clearCache(req, res) {
    googleMapsService.clearCache();
    res.json({
      success: true,
      message: "Cache cleared successfully",
    });
  }
}

// Export singleton instance
export default new MapsController();
