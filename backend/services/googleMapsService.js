import axios from "axios";
import NodeCache from "node-cache";
import config from "../config/config.js";

/**
 * Google Maps Service
 * Handles all interactions with Google Maps API with security best practices
 */
class GoogleMapsService {
  constructor() {
    this.apiKey = config.googleMaps.apiKey;
    this.baseUrl = config.googleMaps.baseUrl;

    // Initialize cache to reduce API calls and costs
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: config.cache.checkPeriod,
    });

    // Track API usage for monitoring
    this.apiCallCounter = {
      places: 0,
      geocoding: 0,
      details: 0,
      total: 0,
    };
  }

  /**
   * Generate cache key for requests
   */
  generateCacheKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Log API usage for monitoring quota
   */
  logApiCall(endpoint) {
    this.apiCallCounter[endpoint] = (this.apiCallCounter[endpoint] || 0) + 1;
    this.apiCallCounter.total += 1;

    if (this.apiCallCounter.total % 10 === 0) {
      console.log("📊 API Usage:", this.apiCallCounter);
    }
  }

  /**
   * Search for places using Google Places API (New)
   * @param {string} query - Search query (e.g., "restaurants in New York")
   * @param {object} options - Additional search options
   */
  async searchPlaces(query, options = {}) {
    const cacheKey = this.generateCacheKey("places", { query, ...options });

    // Check cache first
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      console.log("✅ Cache hit for:", query);
      return cachedResult;
    }

    try {
      // Using Places API Text Search
      const params = {
        query: query,
        key: this.apiKey,
      };

      // Add optional parameters
      if (options.location) {
        params.locationBias = `circle:${
          options.radius || config.googleMapsLimits.defaultRadius
        }@${options.location}`;
      }

      const response = await axios.get(
        `${this.baseUrl}/place/textsearch/json`,
        { params }
      );

      this.logApiCall("places");

      if (
        response.data.status !== "OK" &&
        response.data.status !== "ZERO_RESULTS"
      ) {
        throw new Error(
          `Google Maps API error: ${response.data.status} - ${
            response.data.error_message || "Unknown error"
          }`
        );
      }

      const results = {
        status: response.data.status,
        places: (response.data.results || [])
          .slice(0, config.googleMapsLimits.maxResultsPerQuery)
          .map((place) => ({
            id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            location: place.geometry.location,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            types: place.types,
            businessStatus: place.business_status,
            priceLevel: place.price_level,
            photos:
              place.photos?.map((photo) => ({
                reference: photo.photo_reference,
                width: photo.width,
                height: photo.height,
              })) || [],
          })),
      };

      // Cache the results
      this.cache.set(cacheKey, results);

      return results;
    } catch (error) {
      console.error("❌ Error searching places:", error.message);
      throw new Error(`Failed to search places: ${error.message}`);
    }
  }

  /**
   * Search for nearby places
   * @param {object} location - {lat, lng}
   * @param {string} type - Place type (restaurant, cafe, etc.)
   * @param {number} radius - Search radius in meters
   */
  async nearbySearch(
    location,
    type = "",
    radius = config.googleMapsLimits.defaultRadius
  ) {
    // Validate radius
    const validRadius = Math.min(radius, config.googleMapsLimits.maxRadius);

    const cacheKey = this.generateCacheKey("nearby", {
      location,
      type,
      radius: validRadius,
    });

    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      console.log("✅ Cache hit for nearby search");
      return cachedResult;
    }

    try {
      const params = {
        location: `${location.lat},${location.lng}`,
        radius: validRadius,
        key: this.apiKey,
      };

      if (type) {
        params.type = type;
      }

      const response = await axios.get(
        `${this.baseUrl}/place/nearbysearch/json`,
        { params }
      );

      this.logApiCall("places");

      if (
        response.data.status !== "OK" &&
        response.data.status !== "ZERO_RESULTS"
      ) {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const results = {
        status: response.data.status,
        places: (response.data.results || [])
          .slice(0, config.googleMapsLimits.maxResultsPerQuery)
          .map((place) => ({
            id: place.place_id,
            name: place.name,
            address: place.vicinity,
            location: place.geometry.location,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            types: place.types,
            businessStatus: place.business_status,
            priceLevel: place.price_level,
          })),
      };

      this.cache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error("❌ Error in nearby search:", error.message);
      throw new Error(`Failed to search nearby places: ${error.message}`);
    }
  }

  /**
   * Get place details by place ID
   * @param {string} placeId - Google Place ID
   */
  async getPlaceDetails(placeId) {
    const cacheKey = this.generateCacheKey("details", { placeId });

    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      console.log("✅ Cache hit for place details");
      return cachedResult;
    }

    try {
      const params = {
        place_id: placeId,
        fields:
          "name,formatted_address,geometry,rating,formatted_phone_number,opening_hours,website,price_level,reviews,photos",
        key: this.apiKey,
      };

      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params,
      });

      this.logApiCall("details");

      if (response.data.status !== "OK") {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const result = response.data.result;
      const details = {
        id: placeId,
        name: result.name,
        address: result.formatted_address,
        location: result.geometry.location,
        rating: result.rating,
        phoneNumber: result.formatted_phone_number,
        website: result.website,
        priceLevel: result.price_level,
        openingHours: result.opening_hours,
        reviews: result.reviews?.slice(0, 5),
        photos: result.photos?.slice(0, 5).map((photo) => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
        })),
      };

      this.cache.set(cacheKey, details);
      return details;
    } catch (error) {
      console.error("❌ Error getting place details:", error.message);
      throw new Error(`Failed to get place details: ${error.message}`);
    }
  }

  /**
   * Geocode an address to coordinates
   * @param {string} address - Address to geocode
   */
  async geocodeAddress(address) {
    const cacheKey = this.generateCacheKey("geocoding", { address });

    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      console.log("✅ Cache hit for geocoding");
      return cachedResult;
    }

    try {
      const params = {
        address: address,
        key: this.apiKey,
      };

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params,
      });

      this.logApiCall("geocoding");

      if (response.data.status !== "OK") {
        throw new Error(`Geocoding error: ${response.data.status}`);
      }

      const result = {
        location: response.data.results[0].geometry.location,
        formattedAddress: response.data.results[0].formatted_address,
        placeId: response.data.results[0].place_id,
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("❌ Error geocoding address:", error.message);
      throw new Error(`Failed to geocode address: ${error.message}`);
    }
  }

  /**
   * Generate a static map URL
   * @param {array} markers - Array of {lat, lng, label} objects
   * @param {object} options - Map options (width, height, zoom)
   */
  generateStaticMapUrl(markers, options = {}) {
    const width = options.width || 600;
    const height = options.height || 400;
    const zoom = options.zoom || 13;

    let url = `${this.baseUrl}/staticmap?size=${width}x${height}&zoom=${zoom}`;

    markers.forEach((marker, index) => {
      const label = marker.label || String.fromCharCode(65 + index); // A, B, C...
      url += `&markers=color:red%7Clabel:${label}%7C${marker.lat},${marker.lng}`;
    });

    url += `&key=${this.apiKey}`;
    return url;
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    return {
      ...this.apiCallCounter,
      cacheStats: this.cache.getStats(),
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.flushAll();
    console.log("🗑️  Cache cleared");
  }
}

// Export singleton instance
export default new GoogleMapsService();
