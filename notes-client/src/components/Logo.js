import React from "react";
import { useMediaQuery } from "@mantine/hooks";

function Logo() {
  // useMediaQuery returns true if the viewport width is less than 768px
  const isSmallScreen = useMediaQuery("(max-width: 393px)");

  if (isSmallScreen) {
    // Don't render the image if the screen is too small
    return null;
  }

  return <img src="logo.svg" style={{ maxWidth: 150 }} />;
}

export default Logo;
