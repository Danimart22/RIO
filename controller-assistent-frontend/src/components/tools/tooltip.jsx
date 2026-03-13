import React from "react";
import "./Tooltip.css";

const Tooltip = ({ message, children }) => {
  return (
    <div className="tooltip">
      {children}
      <span className="tooltiptext">{message}</span>
    </div>
  );
};

export default Tooltip;
