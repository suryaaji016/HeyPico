/**
 * Open WebUI Function Tools - Full JavaScript Version
 *
 * USAGE INSTRUCTIONS IN OPEN WEBUI:
 * 1. Open Open WebUI Admin Panel
 * 2. Go to Functions/Tools
 * 3. Create New Function
 * 4. Copy paste this code
 * 5. Update BASE_URL with your server URL
 * 6. Save and enable function
 *
 * Supported LLMs:
 * - GPT-4 (OpenAI)
 * - Claude (Anthropic)
 * - Llama 3/3.1 (Ollama)
 * - Mistral (Ollama)
 * - All LLMs that support function calling
 */

// Configuration
const BASE_URL = "http://localhost:3000/api/maps";
const TIMEOUT = 30000;

/**
 * Helper function untuk HTTP requests
 */
async function fetchAPI(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: TIMEOUT,
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Function 1: Search Places
 * Cari tempat seperti restoran, kafe, hotel, dll
 */
async function search_places(query, location = null, radius = null) {
  try {
    const body = { query };

    if (location) {
      body.location = location;
    }

    if (radius) {
      body.radius = radius;
    }

    const data = await fetchAPI("/search", "POST", body);

    if (data.success && data.results && data.results.length > 0) {
      const results = data.results.slice(0, 5); // Top 5 results

      let formattedResults = `Found ${results.length} places for "${query}":\n\n`;

      results.forEach((place, idx) => {
        formattedResults += `${idx + 1}. **${place.name}**\n`;
        formattedResults += `   - Address: ${place.address}\n`;
        formattedResults += `   - Rating: ${place.rating || "N/A"} ⭐`;

        if (place.userRatingsTotal) {
          formattedResults += ` (${place.userRatingsTotal} reviews)`;
        }
        formattedResults += "\n";

        if (place.priceLevel) {
          formattedResults += `   - Price: ${"$".repeat(place.priceLevel)}\n`;
        }

        // Add map link
        const lat = place.location.lat;
        const lng = place.location.lng;
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${place.id}`;
        formattedResults += `   - [View on Map](${mapLink})\n\n`;
      });

      return formattedResults;
    } else {
      return `No places found for query: ${query}`;
    }
  } catch (error) {
    return `Error searching for places: ${error.message}`;
  }
}

/**
 * Function 2: Find Nearby Places
 * Search for places around specific coordinates
 */
async function find_nearby_places(
  latitude,
  longitude,
  placeType = "",
  radius = 5000
) {
  try {
    const body = {
      location: { lat: latitude, lng: longitude },
      radius: radius,
    };

    if (placeType) {
      body.type = placeType;
    }

    const data = await fetchAPI("/nearby", "POST", body);

    if (data.success && data.results && data.results.length > 0) {
      const results = data.results.slice(0, 5);

      const placeTypeText = placeType || "various places";
      let formattedResults = `Found ${results.length} ${placeTypeText} nearby:\n\n`;

      results.forEach((place, idx) => {
        formattedResults += `${idx + 1}. **${place.name}**\n`;
        formattedResults += `   - Address: ${place.address}\n`;
        formattedResults += `   - Rating: ${place.rating || "N/A"} ⭐\n`;

        const lat = place.location.lat;
        const lng = place.location.lng;
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        formattedResults += `   - [View on Map](${mapLink})\n\n`;
      });

      return formattedResults;
    } else {
      return "No places found near this location";
    }
  } catch (error) {
    return `Error searching for nearby places: ${error.message}`;
  }
}

/**
 * Function 3: Get Place Details
 * Get detailed information about a place
 */
async function get_place_details(placeId) {
  try {
    const data = await fetchAPI(`/place/${placeId}`, "GET");

    if (data.success && data.place) {
      const place = data.place;

      let result = `**${place.name}**\n\n`;
      result += `📍 Address: ${place.address}\n`;

      if (place.rating) {
        result += `⭐ Rating: ${place.rating}/5\n`;
      }

      if (place.phoneNumber) {
        result += `📞 Phone: ${place.phoneNumber}\n`;
      }

      if (place.website) {
        result += `🌐 Website: ${place.website}\n`;
      }

      if (place.openingHours && place.openingHours.weekday_text) {
        result += `\n⏰ Opening Hours:\n`;
        place.openingHours.weekday_text.forEach((day) => {
          result += `   - ${day}\n`;
        });
      }

      if (place.reviews && place.reviews.length > 0) {
        result += `\n📝 Recent Reviews:\n`;
        place.reviews.slice(0, 3).forEach((review) => {
          const text = review.text || "";
          result += `   - ${text.substring(0, 100)}...\n`;
        });
      }

      if (place.mapUrl) {
        result += `\n[View on Google Maps](${place.mapUrl})`;
      }

      return result;
    } else {
      return "Place details not found";
    }
  } catch (error) {
    return `Error getting place details: ${error.message}`;
  }
}

/**
 * Function 4: Geocode Address
 * Convert address to coordinates
 */
async function geocode_address(address) {
  try {
    const data = await fetchAPI("/geocode", "POST", { address });

    if (data.success && data.result) {
      const result = data.result;
      const location = result.location;

      let output = `📍 **Location Found**\n\n`;
      output += `Address: ${result.formattedAddress}\n`;
      output += `Coordinates: ${location.lat}, ${location.lng}\n`;

      const mapLink = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
      output += `\n[View on Google Maps](${mapLink})`;

      return output;
    } else {
      return `Unable to find address: ${address}`;
    }
  } catch (error) {
    return `Error geocoding address: ${error.message}`;
  }
}

/**
 * Function 5: Generate Map with Multiple Locations
 * Create map with multiple locations
 */
async function generate_map_with_locations(places) {
  try {
    if (!places || places.length === 0) {
      return "No places to display on map";
    }

    // Generate Google Maps URL with multiple points
    const baseUrl = "https://www.google.com/maps/dir/";
    const coordinates = places
      .filter((p) => p.lat && p.lng)
      .map((p) => `${p.lat},${p.lng}`)
      .join("/");

    const mapUrl = baseUrl + coordinates;

    let result = `🗺️ **Map with ${places.length} locations**\n\n`;

    places.forEach((place, idx) => {
      const name = place.name || `Location ${idx + 1}`;
      result += `${idx + 1}. ${name}\n`;
    });

    result += `\n[Open Interactive Map](${mapUrl})`;

    return result;
  } catch (error) {
    return `Error creating map: ${error.message}`;
  }
}

/**
 * Export functions for Open WebUI
 * Copy ALL code above to Open WebUI Function Editor
 */

// Metadata for Open WebUI
const TOOLS_METADATA = {
  search_places: {
    name: "search_places",
    description:
      "Search for places like restaurants, cafes, hotels, or tourist attractions",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Search query (example: "restaurants in Jakarta", "hotels in Bali")',
        },
        location: {
          type: "object",
          description: "Optional location for search",
          properties: {
            lat: { type: "number", description: "Latitude" },
            lng: { type: "number", description: "Longitude" },
          },
        },
        radius: {
          type: "integer",
          description: "Search radius in meters (default: 5000)",
        },
      },
      required: ["query"],
    },
  },
  find_nearby_places: {
    name: "find_nearby_places",
    description: "Find places around specific coordinates",
    parameters: {
      type: "object",
      properties: {
        latitude: {
          type: "number",
          description: "Latitude coordinate",
        },
        longitude: {
          type: "number",
          description: "Longitude coordinate",
        },
        placeType: {
          type: "string",
          description: "Place type (restaurant, cafe, hotel, etc)",
        },
        radius: {
          type: "integer",
          description: "Radius in meters",
        },
      },
      required: ["latitude", "longitude"],
    },
  },
  get_place_details: {
    name: "get_place_details",
    description: "Get detailed information about a place",
    parameters: {
      type: "object",
      properties: {
        placeId: {
          type: "string",
          description: "Google Place ID",
        },
      },
      required: ["placeId"],
    },
  },
  geocode_address: {
    name: "geocode_address",
    description: "Convert address to geographic coordinates",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Full address or place name",
        },
      },
      required: ["address"],
    },
  },
};

// Export for testing (not needed in Open WebUI)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    search_places,
    find_nearby_places,
    get_place_details,
    geocode_address,
    generate_map_with_locations,
    TOOLS_METADATA,
  };
}
