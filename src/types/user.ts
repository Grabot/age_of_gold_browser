export interface User {
    id: number;
    username: string;
    avatar_version: number;
    profile_version: number;
    avatar?: string;
}
export interface Friend {
    friendId: number;
    username: string;
    accepted: boolean;
    updated: boolean;
}