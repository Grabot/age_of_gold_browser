export interface User {
    id: number;
    username: string;
    avatar_version: number;
    profile_version: number;
    avatar?: string;
}
export interface Friend {
    friend_id: number;
    accepted: boolean;
    friend_version: number;
    user: User;
}