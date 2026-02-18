import type { Group } from './groups';
import type { Friend } from './friend';

export type Contact = Group | Friend;

export function isGroup(contact: Contact): contact is Group {
	return 'group_version' in contact;
}

export function isFriend(contact: Contact): contact is Friend {
	return 'friend_version' in contact;
}

export function getContactPrivate(contact: Contact): boolean {
	if (isGroup(contact)) {
		return false;
	}
	return true;
}

export function getContactName(contact: Contact): string {
	if (isGroup(contact)) {
		return contact.name || 'Unnamed Group';
	}
	return contact.user?.username || 'Unknown User';
}

export function getContactAvatar(contact: Contact): string | undefined {
	if (isGroup(contact)) {
		return contact.avatar;
	}
	return contact.user?.avatar;
}

export function getContactColour(contact: Contact): string | undefined {
	if (isGroup(contact)) {
		return contact.colour;
	}
	return contact.user?.colour;
}

export function getContactInitial(contact: Contact): string {
	const name = getContactName(contact);
	return name.charAt(0).toUpperCase();
}

export function getContactUnreadCount(contact: Contact): number {
	if (isGroup(contact)) {
		return contact.unread_messages || 0;
	}
	return 0;
}

export function getContactChatId(contact: Contact): number {
	return contact.chat_id;
}

export function getContactMessages(contact: Contact, messageStore: Map<number, any>): any[] {
	const chatId = contact.chat_id;
	const messages = messageStore.get(chatId) || [];
	console.log("messages");
	console.log(messages);
	return messageStore.get(chatId) || [];
}