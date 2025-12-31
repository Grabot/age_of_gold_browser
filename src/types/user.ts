export interface User {
    id: number;
    username: string;
    avatar?: string;
    profile_version: number;
    avatar_version: number;
}

export interface Friend {
    friend_id: number;
    accepted: boolean;
    requested: boolean;
}