import { useState, useEffect } from "react";

// Custom hook to detect if the device is mobile based on screen width
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if current viewport width indicates a mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Standard breakpoint for mobile devices
    };

    // Set initial value
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Clean up event listener on unmount
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}