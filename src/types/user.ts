export interface User {
	id: number;
	username: string;
	avatar_version: number;
	profile_version: number;
	avatar?: string;
}
// TODO: put in seperate file?
export interface Friend {
	friend_id: number;
	accepted: boolean | null;
	friend_version: number;
	user?: User;
}
