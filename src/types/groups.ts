
export interface Group {
    group_id: number;
    unread_messages: number;
    mute: boolean;
    mute_timestamp: string | null;
    group_version: number;
    message_version: number;
    avatar_version: number;
    last_message_read_id: number;
    user_ids: number[];
    admin_ids: number[];
    group_name: string;
    private: boolean;
    group_description: string;
    group_colour: string;
}
