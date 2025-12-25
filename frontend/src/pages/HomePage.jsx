import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import apiService from "../services/apiService";
import PlaceModel from "../models/PlaceModel";
import SearchForm from "../components/SearchForm";
import SearchResultItem from "../components/SearchResultItem";
import FeatureCard from "../components/FeatureCard";
import "../pages/SearchPage.css";

function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);

  const features = [
    {
      icon: "🤖",
      title: "LLM Integration",
      description:
        "Connect to Open WebUI and chat using GPT-4, Claude, Llama, or Mistral.",
    },
    {
      icon: "⚡",
      title: "Vite + React",
      description:
        "Fast frontend development with Vite and React for responsive UI.",
    },
    {
      icon: "🏗️",
      title: "MVC Pattern",
      description:
        "Backend uses MVC pattern for clean and organized structure.",
    },
    {
      icon: "🗺️",
      title: "Google Maps API",
      description:
        "Uses Google Maps API for place search and geocoding with caching to save costs.",
    },
    {
      icon: "🔒",
      title: "Secure & Fast",
      description:
        "Built with rate limiting, CORS, and input validation to prevent abuse.",
    },
    {
      icon: "📦",
      title: "Full JavaScript",
      description:
        "100% JavaScript stack with no Python or other dependencies.",
    },
  ];

  // Initialize Google Maps
  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY",
      version: "weekly",
    });

    loader.load().then(() => {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: -6.2088, lng: 106.8456 },
        zoom: 12,
      });
    });
  }, []);

  // Clear markers
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };

  // Add markers to map
  const addMarkersToMap = (placesData) => {
    clearMarkers();

    if (!googleMapRef.current || placesData.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    placesData.forEach((place, index) => {
      const marker = new google.maps.Marker({
        position: place.location,
        map: googleMapRef.current,
        title: place.name,
        label: String.fromCharCode(65 + index),
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0;">${place.name}</h3>
            <p style="margin: 4px 0;">${place.address}</p>
            ${
              place.rating
                ? `<p style="margin: 4px 0;">Rating: ${place.rating}</p>`
                : ""
            }
            <a href="${place.getMapUrl()}" target="_blank" style="color: #667eea;">
              View on Google Maps
            </a>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(googleMapRef.current, marker);
        setSelectedPlace(place);
      });

      markersRef.current.push(marker);
      bounds.extend(place.location);
    });

    googleMapRef.current.fitBounds(bounds);
  };

  // Handle text search
  const handleTextSearch = async (e) => {
    e.preventDefault();
    const searchQuery = category || query;
    if (!searchQuery.trim()) {
      setError("Please enter a search query or select a category");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const location =
        latitude && longitude
          ? {
              lat: parseFloat(latitude),
              lng: parseFloat(longitude),
            }
          : null;

      const result = await apiService.searchPlaces(searchQuery, location, 5000);

      const placesModels = result.results.map((p) => new PlaceModel(p));
      setPlaces(placesModels);
      addMarkersToMap(placesModels);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4));
          setLongitude(position.coords.longitude.toFixed(4));
          setLoading(false);

          // Center map on current location
          if (googleMapRef.current) {
            googleMapRef.current.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            googleMapRef.current.setZoom(14);
          }
        },
        (error) => {
          setError(
            "Unable to get your location. Please enter coordinates manually."
          );
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  return (
    <>
      <div className="hero-search">
        <div className="container">
          <div className="title-with-icon">
            <div className="search-icon"></div>
            <h1>Search Places</h1>
          </div>
          <p>Find restaurants, cafes, hotels, and other interesting places</p>
        </div>
      </div>

      <div className="content-section">
        <div className="container">
          <div className="search-layout">
            {/* Sidebar */}
            <div className="sidebar">
              <div className="card search-card">
                <h3 className="card-title">Search Places</h3>

                <SearchForm
                  query={query}
                  setQuery={setQuery}
                  category={category}
                  setCategory={setCategory}
                  latitude={latitude}
                  setLatitude={setLatitude}
                  longitude={longitude}
                  setLongitude={setLongitude}
                  loading={loading}
                  onSubmit={handleTextSearch}
                  onGetLocation={getCurrentLocation}
                />

                {error && (
                  <div className="error" style={{ marginTop: "20px" }}>
                    {error}
                  </div>
                )}
              </div>

              {places.length > 0 && (
                <div className="card results-card">
                  <h3 className="card-title">Search Results</h3>
                  <div className="results-list">
                    {places.map((place, index) => (
                      <SearchResultItem
                        key={place.id}
                        place={place}
                        index={index}
                        selected={selectedPlace?.id === place.id}
                        onClick={() => {
                          setSelectedPlace(place);
                          const marker = markersRef.current[index];
                          if (marker) {
                            google.maps.event.trigger(marker, "click");
                            googleMapRef.current.setCenter(place.location);
                            googleMapRef.current.setZoom(16);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="map-section">
              <div className="map-container" ref={mapRef}></div>
            </div>
          </div>{" "}
        </div>
      </div>
    </>
  );
}

export default HomePage;
