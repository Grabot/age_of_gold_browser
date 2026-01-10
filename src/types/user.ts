export interface User {
    id: number;
    username: string;
    avatar_version: number;
    profile_version: number;
    avatar?: string;
}
export interface Friend {
    friend_id: number;
    accepted: boolean | null; // null = I sent the request, false = they sent it to me, true = we are friends
    friend_version: number;
    user?: User;
}
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
export interface Chat {
    user_ids: number[];
    admin_ids: number[];
    group_name: string;
    private: boolean;
    group_description: string;
    group_colour: string;
}
