/**
 * Converts a UTC/ISO timestamp to local time and formats it
 * @param timestamp - UTC/ISO timestamp string from the server (e.g., "2024-01-15T10:30:00+00:00")
 * @returns Formatted local time string
 */
export function formatUTCToLocalTime(timestamp: string): string {
	if (!timestamp) {
		return '';
	}

	// Parse the timestamp - Date constructor automatically handles ISO format with timezone
	const date = new Date(timestamp);

	// Check if date is valid
	if (isNaN(date.getTime())) {
		console.warn('Invalid timestamp:', timestamp);
		return '';
	}

	// toLocaleTimeString automatically converts to local timezone
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Converts a UTC timestamp to local date and time
 * @param timestamp - UTC timestamp string from the server
 * @returns Formatted local date and time string
 */
export function formatUTCToLocalDateTime(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleString([], {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Checks if a timestamp is valid
 * @param timestamp - Timestamp string to validate
 * @returns boolean indicating if timestamp is valid
 */
export function isValidTimestamp(timestamp: string): boolean {
	const date = new Date(timestamp);
	return !isNaN(date.getTime());
}

/**
 * Gets the current UTC timestamp as an ISO string
 * Use this when saving new messages to ensure consistency with server timestamps
 * @returns UTC timestamp string in ISO format (e.g., "2024-01-15T10:30:00.000Z")
 */
export function saveAsUTC(): string {
	// toISOString() always returns UTC time with 'Z' suffix
	return new Date().toISOString();
}
