import type { Chat } from './user';

export interface Group {
    id: number;
    group_id: number;
    unread_messages: number;
    mute: boolean;
    mute_timestamp: string | null;
    group_version: number;
    message_version: number;
    avatar_version: number;
    last_message_read_id: number;
    chat?: Chat;
}