import * as short from 'short-uuid';

export function getShortUuid(): string {
	return short().fromUUID(short.uuid());
}
