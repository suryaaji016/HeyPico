/**
 * API Service - Handle all API calls (MVC Pattern)
 * This is the Model layer for the frontend
 */
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/maps";

class MapsAPIService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error);
        throw error;
      }
    );
  }

  /**
   * Search for places
   */
  async searchPlaces(query, location = null, radius = null) {
    try {
      const response = await this.api.post("/search", {
        query,
        location,
        radius,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to search places"
      );
    }
  }

  /**
   * Search nearby places
   */
  async nearbySearch(location, type = "", radius = 5000) {
    try {
      const response = await this.api.post("/nearby", {
        location,
        type,
        radius,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to search nearby places"
      );
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId) {
    try {
      const response = await this.api.get(`/place/${placeId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to get place details"
      );
    }
  }

  /**
   * Geocode address
   */
  async geocodeAddress(address) {
    try {
      const response = await this.api.post("/geocode", { address });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to geocode address"
      );
    }
  }

  /**
   * Get API statistics
   */
  async getStats() {
    try {
      const response = await this.api.get("/stats");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get statistics");
    }
  }
}

export default new MapsAPIService();
