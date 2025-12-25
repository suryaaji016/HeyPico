import "./SearchResultItem.css";

function SearchResultItem({ place, index, selected, onClick }) {
  return (
    <div
      className={`result-item ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="result-content">
        <div className="result-title">
          {index + 1}. {place.name}
        </div>
        <div className="result-address">{place.address}</div>
        <div className="result-rating">
          <span className="stars">⭐⭐⭐⭐☆</span>
          <span className="rating-value">{place.rating || "4.5"}</span>
          <span className="divider">|</span>
          <span className="review-count">
            {place.userRatingsTotal || "120"} reviews
          </span>
        </div>
        <a
          href={place.getMapUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="maps-link"
          onClick={(e) => e.stopPropagation()}
        >
          View on Google Maps
        </a>
      </div>
      <div className="result-thumbnail">
        <img
          src={`https://maps.googleapis.com/maps/api/staticmap?center=${
            place.location.lat
          },${place.location.lng}&zoom=14&size=160x160&markers=color:red%7C${
            place.location.lat
          },${place.location.lng}&key=${
            import.meta.env.VITE_GOOGLE_MAPS_API_KEY
          }`}
          alt="Map preview"
        />
      </div>
    </div>
  );
}

export default SearchResultItem;
