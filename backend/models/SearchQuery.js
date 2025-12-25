/**
 * MODEL: SearchQuery
 * Represents a search query with validation
 */
class SearchQuery {
  constructor(data) {
    this.query = data.query;
    this.location = data.location;
    this.radius = data.radius;
    this.type = data.type;
  }

  /**
   * Validate search query
   */
  validate() {
    const errors = [];

    if (this.query && typeof this.query !== "string") {
      errors.push("Query must be a string");
    }

    if (this.location) {
      if (
        typeof this.location.lat !== "number" ||
        typeof this.location.lng !== "number"
      ) {
        errors.push("Location must have valid lat and lng coordinates");
      }

      if (this.location.lat < -90 || this.location.lat > 90) {
        errors.push("Latitude must be between -90 and 90");
      }

      if (this.location.lng < -180 || this.location.lng > 180) {
        errors.push("Longitude must be between -180 and 180");
      }
    }

    if (this.radius !== undefined) {
      const radiusNum = parseInt(this.radius);
      if (isNaN(radiusNum) || radiusNum <= 0) {
        errors.push("Radius must be a positive number");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get validated data
   */
  getData() {
    return {
      query: this.query,
      location: this.location,
      radius: this.radius,
      type: this.type,
    };
  }
}

export default SearchQuery;
