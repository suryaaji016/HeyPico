# HeyPico - Local Place Discovery Application

## 1. What Was Built

HeyPico is a full-stack web application for discovering local places using Google Maps integration. The system consists of:

**Frontend (React + Vite)**

- Single-page application with modern UI/UX (glassmorphism design)
- Interactive Google Maps with custom markers and info windows
- Category-based search (Restaurant, Cafe, Hotel, Tourist, Mall, Hospital)
- Geolocation support ("Use My Location" feature)
- Real-time search results with ratings, reviews, and thumbnails
- Responsive design for mobile and desktop

**Backend (Express.js)**

- RESTful API with MVC architecture
- Google Places API integration through secure backend proxy
- Search endpoints for text-based and category-based queries
- MongoDB models for place data and search query logging
- Security middleware (Helmet, CORS, rate limiting)

**Key Features:**

- 🔍 Smart search by keyword or category
- 📍 Automatic GPS location detection
- 🗺️ Interactive map with clickable markers
- ⭐ Display ratings, reviews, and photos
- 🔒 Secure API key handling

---

## 2. How to Run It

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Google Maps API Key with Places API enabled

### Setup Backend

```bash
cd backend
npm install

# Create .env file in config/ folder
# config/.env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NODE_ENV=development

npm start
# Backend runs on http://localhost:5000
```

### Setup Frontend

```bash
cd frontend
npm install

# Create .env file
# .env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_for_client

npm run dev
# Frontend runs on http://localhost:5173
```

### Access the Application

Open browser to `http://localhost:5173`

**Quick Start (Development):**

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## 3. Where LLM is Used

**Open WebUI Integration** (`openwebui-functions/maps_tools.js`)

This project provides an LLM tool function for Open WebUI that allows users to search places through natural language conversations:

```javascript
// Users can ask in natural language:
"Find cafes near me";
"Find restaurants in Jakarta";
"Where can I shop around Sudirman?";
```

**How LLM Tool Works:**

1. LLM receives natural language query from user
2. Tool function `maps_tools.js` parses intent (place type, location, radius)
3. Tool calls HeyPico backend API (`/api/maps/search`)
4. Response is formatted into conversational reply
5. User receives results in natural chat format + structured data

**Integration Point:**

```javascript
// openwebui-functions/maps_tools.js
async function search_places({ query, lat, lng, radius }) {
  const response = await fetch(`${BACKEND_URL}/api/maps/search`, {
    method: "POST",
    body: JSON.stringify({ query, latitude: lat, longitude: lng }),
  });

  // Format results for LLM response
  return formatPlacesForLLM(response.data);
}
```

**Use Case:**

- Voice assistant for place search
- Customer service chatbot for location recommendations
- AI travel planner with maps integration

---

## 4. How Google Maps is Integrated (Securely)

### Security Architecture

**1. Backend API Proxy Pattern**

```
User → Frontend → Backend API → Google Maps API
       (public)    (server)       (protected)
```

- Frontend NEVER exposes the main API key
- All Google Places API calls go through Express backend
- Backend validates requests before forwarding to Google

**2. API Key Protection**

```javascript
// backend/config/config.js
require("dotenv").config();

module.exports = {
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY, // Server-side only
  port: process.env.PORT || 5000,
};
```

**Environment Variables:**

- `.env` files are in `.gitignore` (never committed to Git)
- `GOOGLE_MAPS_API_KEY` stored securely on server
- Use different keys for client (restricted) vs server (full access)

**3. API Key Restrictions (Google Cloud Console)**

**Server-side key (for backend):**

- ✅ IP restriction - only production server IP can use it
- ✅ API restrictions - only Places API, Geocoding API enabled
- ✅ No HTTP referrer restriction (not exposed to browser)
- ✅ Full quota access

**Client-side key (for Maps JavaScript API):**

- ✅ HTTP referrer restrictions - only domain `yourdomain.com/*`
- ✅ Only Maps JavaScript API enabled
- ❌ CANNOT call Places API or backend-only services
- ✅ Limited quota per domain

**4. Security Middleware**

```javascript
// backend/middleware/security.js
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});

app.use(helmet()); // Security headers
app.use(limiter); // Rate limiting
```

**5. CORS Configuration**

```javascript
const cors = require("cors");
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  })
);
```

**6. Request Validation**

```javascript
// backend/controllers/mapsController.js
exports.searchPlaces = async (req, res) => {
  // Validate input
  if (!req.body.query && !req.body.type) {
    return res.status(400).json({ error: "Query or type required" });
  }

  // Sanitize input (prevent injection)
  const query = sanitize(req.body.query);

  // Call Google API with server key
  const results = await googleMapsService.search(query);
  res.json(results);
};
```

**7. Cost Control**

```javascript
// Optional: Implement caching with Redis
const redis = require("redis");
const cache = redis.createClient();

// Cache popular searches for 1 hour
const cacheKey = `search:${query}:${lat}:${lng}`;
const cached = await cache.get(cacheKey);
if (cached) return JSON.parse(cached);

// Call Google API only if not cached
const results = await googleMapsService.search(query);
await cache.setex(cacheKey, 3600, JSON.stringify(results));
```

### Security Checklist

- [x] API key not committed to Git
- [x] Backend proxy for all API calls
- [x] Rate limiting per IP address
- [x] CORS restriction to specific domains
- [x] API key restrictions in Google Cloud Console
- [x] Input validation and sanitization
- [x] HTTPS in production (SSL/TLS)
- [x] Environment-based configuration
- [ ] Redis caching (optional, for cost control)
- [ ] API usage monitoring and alerts

---

## 5. Technical Assumptions & Decisions

### Architecture Decisions

**1. Single-Page Application (SPA)**

- **Reason:** Better UX with instant navigation, no page reloads
- **Trade-off:** Larger initial bundle size vs faster perceived performance
- **Decision:** React Router with single HomePage route (simple, sufficient for current scope)

**2. Backend API Proxy**

- **Reason:** Security (hide API keys), cost control (rate limiting), caching potential
- **Alternative:** Direct client-to-Google API calls (rejected due to security risk)
- **Decision:** Express.js middleware layer as proxy

**3. Component Architecture**

```
Layout (Navbar + Footer wrapper)
  └── HomePage
        ├── SearchForm (categories, text input, geolocation)
        ├── SearchResultItem (individual place cards)
        ├── FeatureCard (info display)
        └── Google Maps (external library @googlemaps/js-api-loader)
```

- **Reason:** Separation of concerns, reusability, easier testing
- **CSS Strategy:** Component-scoped CSS files + global design system in index.css

**4. State Management**

- **Decision:** React Hooks (useState, useEffect, useRef) without Redux/Zustand
- **Reason:** Application scope is still simple, no need for complex global state yet
- **When to upgrade:** If adding user auth, favorites, shopping cart, or complex flows

**5. Database Choice**

- **Decision:** MongoDB for search query logging
- **Reason:** Flexible schema for place data, easy scaling, good for analytics
- **Alternative:** PostgreSQL (more strict schema, overkill for this scope)

### Technical Assumptions

**1. User Location Permissions**

- **Assumption:** Users will grant geolocation access for "Use My Location"
- **Fallback:** Manual coordinate entry or default location (Jakarta)
- **Reality:** 60-70% of users typically grant permission

**2. Google Maps API Quotas**

- **Assumption:** $200/month free tier is sufficient for development and small-scale production
- **Calculation:**
  - Places API: $17 per 1000 requests
  - Free tier: ~11,000 requests/month
  - Target user: 500 searches/day = 15,000/month → needs monitoring
- **Action:** Implement caching and rate limiting

**3. Browser Compatibility**

- **Target:** Modern browsers (Chrome, Firefox, Safari, Edge last 2 versions)
- **Assumption:** Support for ES6+, Fetch API, Geolocation API
- **Trade-off:** No IE11 support (Vite limitation, but IE11 is already deprecated)

**4. Data Persistence**

- **Currently:** MongoDB only for search query logging (analytics)
- **Not included:** User accounts, favorites storage, search history per user
- **Future:** If personalization is needed, add user authentication

**5. Performance Expectations**

- **Assumption:** Search response < 2 seconds (including Google API call)
- **Map rendering:** < 1 second on fast connection
- **Target:** Smooth 60fps animations on mid-range devices
- **Not optimized yet:** Lazy loading, code splitting, image CDN

### Key Technical Choices

| Decision            | Choice                    | Rationale                                               |
| ------------------- | ------------------------- | ------------------------------------------------------- |
| Frontend Framework  | React 18 + Vite           | Fast HMR, modern tooling, large ecosystem, good DX      |
| Backend Framework   | Express.js                | Lightweight, flexible, perfect for API proxy            |
| Database            | MongoDB                   | Flexible schema, easy scaling, good for analytics       |
| Maps Library        | Google Maps JS API        | Best coverage globally, rich Places API                 |
| Styling Approach    | CSS + Variables           | No build overhead, easy theming, browser native         |
| API Client          | Axios                     | Better error handling, interceptors, timeout support    |
| Deployment Strategy | Separate frontend/backend | Independent scaling, easier debugging, CDN for frontend |
| Module Bundler      | Vite                      | 10x faster than Webpack, native ESM, instant HMR        |

### Known Limitations

1. **Search Radius:** Fixed 5000m (can be changed in backend, but no UI yet)
2. **Result Limit:** 20 places per search (Google API default, needs pagination)
3. **No Authentication:** Public API, anyone can access
4. **No Caching:** Every search hits Google API (quota-intensive, can add Redis)
5. **Mobile Map UX:** Touch gestures can still be improved
6. **No Offline Mode:** Requires internet connection
7. **Single Language:** Hardcoded to English, no i18n yet

### Trade-offs & Future Enhancements

**Immediate needs (if going to production):**

- [ ] Add Redis caching for popular searches
- [ ] Implement error boundary for better error handling
- [ ] Add loading skeleton for better perceived performance
- [ ] Setup monitoring (Sentry for errors, Google Analytics for usage)
- [ ] Add HTTPS and domain setup

**Future features (nice to have):**

- [ ] User authentication (JWT) and saved favorites
- [ ] Search history per user
- [ ] Route planning with Google Directions API
- [ ] Progressive Web App (PWA) with offline support
- [ ] Admin dashboard for analytics and quota monitoring
- [ ] Multi-language support (i18n)
- [ ] Dark mode toggle

### Cost Considerations

**Google Maps API Pricing (per 1000 requests):**

- Places API Search: $17
- Maps JavaScript API: $7 (per 1000 loads)
- Static Maps API (thumbnails): $2

**Estimation for 10,000 active users/month:**

- Avg 5 searches per user = 50,000 searches
- Cost: (50,000/1000) × $17 = $850/month
- **Mitigation:** Caching can reduce by 50-70% → ~$300/month

---

## Project Structure

```
HeyPico/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── config/
│   │   ├── config.js          # Environment configuration
│   │   └── .env               # API keys (gitignored)
│   ├── controllers/
│   │   └── mapsController.js  # Request handling logic
│   ├── middleware/
│   │   └── security.js        # Security (helmet, rate limit, CORS)
│   ├── models/
│   │   ├── Place.js           # Place schema
│   │   └── SearchQuery.js     # Search logging schema
│   ├── routes/
│   │   └── maps.js            # API routes
│   └── services/
│       └── googleMapsService.js  # Google API integration
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # React Router setup
│   │   ├── main.jsx           # React entry point
│   │   ├── index.css          # Global styles + design system
│   │   ├── components/
│   │   │   ├── Layout.jsx     # App wrapper (Navbar + Footer)
│   │   │   ├── Navbar.jsx     # Navigation bar
│   │   │   ├── Footer.jsx     # Footer component
│   │   │   ├── SearchForm.jsx # Category buttons + text input
│   │   │   ├── SearchResultItem.jsx  # Place card
│   │   │   └── FeatureCard.jsx       # Info cards
│   │   ├── pages/
│   │   │   └── HomePage.jsx   # Main page (search + map + results)
│   │   └── services/
│   │       └── apiService.js  # Backend API calls
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── openwebui-functions/
    └── maps_tools.js          # LLM tool for Open WebUI

```

## Tech Stack Summary

**Frontend:**

- React 18 (UI library)
- Vite 5 (build tool)
- React Router 6 (routing)
- Axios (HTTP client)
- @googlemaps/js-api-loader (Maps integration)

**Backend:**

- Node.js 16+
- Express.js 4 (web framework)
- Mongoose (MongoDB ODM)
- Helmet (security headers)
- express-rate-limit (DDoS protection)
- CORS (cross-origin)

**External APIs:**

- Google Maps JavaScript API
- Google Places API
- Google Static Maps API (thumbnails)

---

## License

MIT License - Free to use and modify
# HeyPico
