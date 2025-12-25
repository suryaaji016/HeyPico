/**
 * MODEL: Place
 * Represents a place/location from Google Maps
 */
class Place {
  constructor(data) {
    this.id = data.place_id || data.id;
    this.name = data.name;
    this.address = data.formatted_address || data.address || data.vicinity;
    this.location = data.geometry?.location || data.location;
    this.rating = data.rating;
    this.userRatingsTotal = data.user_ratings_total || data.userRatingsTotal;
    this.types = data.types || [];
    this.businessStatus = data.business_status || data.businessStatus;
    this.priceLevel = data.price_level || data.priceLevel;
    this.photos = data.photos || [];
    this.phoneNumber = data.formatted_phone_number || data.phoneNumber;
    this.website = data.website;
    this.openingHours = data.opening_hours || data.openingHours;
    this.reviews = data.reviews || [];
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      location: this.location,
      rating: this.rating,
      userRatingsTotal: this.userRatingsTotal,
      types: this.types,
      businessStatus: this.businessStatus,
      priceLevel: this.priceLevel,
      photos: this.photos,
    };
  }

  /**
   * Get Google Maps URL for this place
   */
  getMapUrl() {
    if (this.location) {
      return `https://www.google.com/maps/search/?api=1&query=${this.location.lat},${this.location.lng}&query_place_id=${this.id}`;
    }
    return null;
  }

  /**
   * Get rating emoji
   */
  getRatingEmoji() {
    if (!this.rating) return "";
    if (this.rating >= 4.5) return "⭐⭐⭐⭐⭐";
    if (this.rating >= 4.0) return "⭐⭐⭐⭐";
    if (this.rating >= 3.5) return "⭐⭐⭐";
    if (this.rating >= 3.0) return "⭐⭐";
    return "⭐";
  }

  /**
   * Get price level string
   */
  getPriceString() {
    if (!this.priceLevel) return "";
    return "$".repeat(this.priceLevel);
  }
}

export default Place;
