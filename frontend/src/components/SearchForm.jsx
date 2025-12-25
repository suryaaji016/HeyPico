import "./SearchForm.css";

function SearchForm({
  query,
  setQuery,
  category,
  setCategory,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  loading,
  onSubmit,
  onGetLocation,
}) {
  const categories = [
    { value: "restaurant", label: "Restaurant", icon: "🍽️" },
    { value: "cafe", label: "Cafe", icon: "☕" },
    { value: "hotel", label: "Hotel", icon: "🏨" },
    { value: "tourist attraction", label: "Tourist", icon: "🎭" },
    { value: "mall", label: "Mall", icon: "🛍️" },
    { value: "hospital", label: "Hospital", icon: "🏥" },
  ];

  return (
    <form onSubmit={onSubmit}>
      <div className="input-group">
        <label>Category</label>
        <div className="category-grid">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`category-btn ${
                category === cat.value ? "active" : ""
              }`}
              onClick={() => {
                setCategory(category === cat.value ? "" : cat.value);
                if (category !== cat.value) {
                  setQuery("");
                }
              }}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label>What are you looking for?</label>
        <div className="input-with-icon">
          <span className="input-icon"></span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search restaurant in Jakarta"
            className="search-input"
          />
        </div>
      </div>

      <div className="input-row">
        <div className="input-group" style={{ flex: 1 }}>
          <label>Latitude (optional)</label>
          <input
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="-6.2088"
            className="form-input"
          />
        </div>

        <div className="input-group" style={{ flex: 1 }}>
          <label>Longitude (optional)</label>
          <input
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="106.8456"
            className="form-input"
          />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={onGetLocation}
        disabled={loading}
        style={{ width: "100%", marginBottom: "12px" }}
      >
        📍 Use My Location
      </button>

      <button
        type="submit"
        className="btn btn-primary search-btn"
        disabled={loading}
      >
        {loading ? " Searching..." : " Search"}
      </button>
    </form>
  );
}

export default SearchForm;
