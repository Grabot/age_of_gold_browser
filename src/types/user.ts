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
