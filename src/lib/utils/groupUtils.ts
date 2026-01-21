// Shared utility functions for group-related components

/**
 * Generate a random color for groups based on a seed
 * @param seed - String to use for generating consistent random color
 * @returns Hex color code
 */
export function getRandomColor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = seed.charCodeAt(i) + ((hash << 5) - hash);
	}
	const colors = [
		'#FF6B6B',
		'#FF8E53',
		'#FFC154',
		'#48CF85',
		'#4299E1',
		'#5677FC',
		'#9013FE',
		'#ED64A6',
		'#F6AD55',
		'#FC8181',
		'#667EEA',
		'#764BA2',
		'#F093FB',
		'#4FACFE',
		'#00C9A7',
		'#8BD3DD',
		'#A5DD9B',
		'#F9D71C'
	];
	return colors[Math.abs(hash) % colors.length];
}

/**
 * Get initials from a username for avatar display
 * @param username - Username to extract initials from
 * @returns First letter or first letters of each word
 */
export function getInitial(username: string): string {
	if (!username || username.length === 0) return '?';

	// Get first letter of each word, up to 2 letters
	const words = username.trim().split(' ');
	if (words.length === 1) {
		return username.charAt(0).toUpperCase();
	} else {
		return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
	}
}

/**
 * Determine text color based on background color brightness for accessibility
 * @param bgColor - Background color in hex format
 * @returns 'white' for dark backgrounds, 'black' for light backgrounds
 */
export function getTextColorForBackground(bgColor: string): string {
	// Remove # if present
	const color = bgColor.startsWith('#') ? bgColor.substring(1) : bgColor;

	// Parse hex color
	const r = parseInt(color.substring(0, 2), 16) / 255;
	const g = parseInt(color.substring(2, 4), 16) / 255;
	const b = parseInt(color.substring(4, 6), 16) / 255;

	// Calculate relative luminance using the formula:
	// L = 0.2126*R + 0.7152*G + 0.0722*B
	const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

	// Use white text for dark backgrounds, black text for light backgrounds
	// Threshold of 0.5 is commonly used for accessibility
	return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Get button/style string based on group color
 * @param groupColor - Group color in hex format
 * @param fallbackColor - Fallback color if groupColor is not provided
 * @returns CSS style string for background and text color
 */
export function getGroupItemStyle(
	groupColor: string | undefined,
	fallbackColor: string = '#0b9476'
): string {
	if (groupColor) {
		const textColor = getTextColorForBackground(groupColor);
		return `background-color: ${groupColor}; color: ${textColor};`;
	} else {
		return `background-color: ${fallbackColor}; color: white;`;
	}
}
