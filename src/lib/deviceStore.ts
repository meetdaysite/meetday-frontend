import { openDB, type IDBPDatabase } from "idb"

// ─── DB setup ─────────────────────────────────────────────────────────────────

const DB_NAME = "meetday-dm"
const DB_VERSION = 1
const STORE = "kv"

type DMSchema = {
	kv: {
		key: string
		value: Uint8Array | string
	}
}

let _db: IDBPDatabase<DMSchema> | null = null

async function getDB(): Promise<IDBPDatabase<DMSchema>> {
	if (_db) return _db
	_db = await openDB<DMSchema>(DB_NAME, DB_VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE)
			}
		},
	})
	return _db
}

// ─── Module-level cache ───────────────────────────────────────────────────────

let _masterKeyCache: Uint8Array | null = null

// ─── Device identity ──────────────────────────────────────────────────────────

export async function getOrCreateDeviceIdentity(): Promise<{
	deviceId: string
	publicKey: Uint8Array
	privateKey: Uint8Array
}> {
	const db = await getDB()

	const existingDeviceId = (await db.get(STORE, "dm.deviceId")) as string | undefined
	const existingPub = (await db.get(STORE, "dm.identityPub")) as Uint8Array | undefined
	const existingPriv = (await db.get(STORE, "dm.identityPriv")) as Uint8Array | undefined

	if (existingDeviceId && existingPub && existingPriv) {
		return { deviceId: existingDeviceId, publicKey: existingPub, privateKey: existingPriv }
	}

	// First call on this device — generate and persist
	const { generateIdentityKeypair } = await import("./e2ee")
	const { publicKey, privateKey } = await generateIdentityKeypair()
	const deviceId = crypto.randomUUID()

	await db.put(STORE, deviceId, "dm.deviceId")
	await db.put(STORE, publicKey, "dm.identityPub")
	await db.put(STORE, privateKey, "dm.identityPriv")

	return { deviceId, publicKey, privateKey }
}

// ─── Master key ───────────────────────────────────────────────────────────────

export async function getMasterKey(): Promise<Uint8Array | null> {
	if (_masterKeyCache) return _masterKeyCache
	const db = await getDB()
	const mk = (await db.get(STORE, "dm.masterKey")) as Uint8Array | undefined
	if (mk) {
		_masterKeyCache = mk
		return mk
	}
	return null
}

export async function setMasterKey(MK: Uint8Array): Promise<void> {
	_masterKeyCache = MK
	const db = await getDB()
	await db.put(STORE, MK, "dm.masterKey")
}

// ─── Conversation keys ────────────────────────────────────────────────────────

export async function getConversationKey(
	conversationId: string,
	epoch: number,
): Promise<Uint8Array | null> {
	const db = await getDB()
	const k = (await db.get(STORE, `dm.convKey:${conversationId}:${epoch}`)) as Uint8Array | undefined
	return k ?? null
}

export async function setConversationKey(
	conversationId: string,
	epoch: number,
	K: Uint8Array,
): Promise<void> {
	const db = await getDB()
	await db.put(STORE, K, `dm.convKey:${conversationId}:${epoch}`)
}

// ─── Clear on logout ──────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
	_masterKeyCache = null
	const db = await getDB()
	await db.clear(STORE)
}
