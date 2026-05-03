const Spinner = ({ size = 24, className = '' }) => (
  <div
    className={`spinner ${className}`}
    style={{ width: size, height: size }}
  />
);
export default Spinner;