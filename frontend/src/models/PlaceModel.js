/**
 * Place Model (Frontend)
 * Represents a place with helper methods
 */
class PlaceModel {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.location = data.location;
    this.rating = data.rating;
    this.userRatingsTotal = data.userRatingsTotal;
    this.types = data.types || [];
    this.businessStatus = data.businessStatus;
    this.priceLevel = data.priceLevel;
    this.phoneNumber = data.phoneNumber;
    this.website = data.website;
    this.openingHours = data.openingHours;
    this.reviews = data.reviews || [];
  }

  /**
   * Get Google Maps URL
   */
  getMapUrl() {
    if (this.location) {
      return `https://www.google.com/maps/search/?api=1&query=${this.location.lat},${this.location.lng}&query_place_id=${this.id}`;
    }
    return null;
  }

  /**
   * Get rating display
   */
  getRatingDisplay() {
    if (!this.rating) return "Belum ada rating";
    return `⭐ ${this.rating.toFixed(1)} (${
      this.userRatingsTotal || 0
    } reviews)`;
  }

  /**
   * Get price level display
   */
  getPriceDisplay() {
    if (!this.priceLevel) return "";
    return "$".repeat(this.priceLevel);
  }

  /**
   * Get business status color
   */
  getStatusColor() {
    if (this.businessStatus === "OPERATIONAL") return "green";
    if (this.businessStatus === "CLOSED_TEMPORARILY") return "orange";
    if (this.businessStatus === "CLOSED_PERMANENTLY") return "red";
    return "gray";
  }

  /**
   * Get first photo reference
   */
  getPhotoReference() {
    if (this.photos && this.photos.length > 0) {
      return this.photos[0].reference;
    }
    return null;
  }
}

export default PlaceModel;
