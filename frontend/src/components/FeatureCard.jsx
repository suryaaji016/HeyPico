function FeatureCard({ icon, title, description }) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: "16px", color: "var(--primary-color)" }}>
        {icon} {title}
      </h3>
      <p style={{ color: "#6b7280" }}>{description}</p>
    </div>
  );
}

export default FeatureCard;
