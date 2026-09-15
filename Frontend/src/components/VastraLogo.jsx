import React from "react";
import logoSvg from "../assets/logo.svg";

/**
 * VASTRA Brand Logo Component
 * Renders the vector SVG logo asset.
 */
export function VastraLogo({
  className = "h-8 w-auto",
  alt = "VASTRA",
  ...props
}) {
  return (
    <img
      src={logoSvg}
      alt={alt}
      className={`select-none object-contain inline-block pointer-events-none ${className}`}
      draggable="false"
      {...props}
    />
  );
}

export default VastraLogo;
