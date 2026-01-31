// Utility function to determine if text should be white or black based on background colour brightness
export function getTextColourForBackground(hexColour: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColour.substring(1, 3), 16);
  const g = parseInt(hexColour.substring(3, 5), 16);
  const b = parseInt(hexColour.substring(5, 7), 16);
  
  // Calculate brightness using the relative luminance formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black for light backgrounds, white for dark backgrounds
  return brightness > 128 ? 'black' : 'white';
}

// Function to update CSS variables based on primary colour
export function updateTextColourForPrimaryColour(primaryColour: string) {
  const textColour = getTextColourForBackground(primaryColour);
  
  // Update CSS variables
  const root = document.documentElement;
  root.style.setProperty('--text-colour-on-primary', textColour);
}

// Initialize with the current primary colour
export function initializeTextColour() {
  const root = document.documentElement;
  const primaryColour = getComputedStyle(root).getPropertyValue('--primary-colour').trim();
  updateTextColourForPrimaryColour(primaryColour);
}

// Function to update the primary colour
export function updatePrimaryColour(hexColour: string) {
  const root = document.documentElement;
  root.style.setProperty('--primary-colour', hexColour);
  updateTextColourForPrimaryColour(hexColour);
}
