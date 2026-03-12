// Message type constants
export const MESSAGE_TYPES = {
    TEXT: 0,
    IMAGE: 1,
    VIDEO: 2,
    DOCUMENT: 3,
    AUDIO: 4
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
