import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-brand">
            HeyPico Maps
          </Link>
          <div className="nav-links"></div>
          <button className="hamburger-menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
