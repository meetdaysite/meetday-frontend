import _sodium from "libsodium-wrappers"

// ─── Lazy singleton ───────────────────────────────────────────────────────────

let _ready = false

export async function getSodium() {
	if (!_ready) {
		await _sodium.ready
		_ready = true
	}
	return _sodium
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function b64(u8: Uint8Array): string {
	return _sodium.to_base64(u8, _sodium.base64_variants.ORIGINAL)
}

export function unb64(s: string): Uint8Array {
	return _sodium.from_base64(s, _sodium.base64_variants.ORIGINAL)
}

// ─── Identity keypair ─────────────────────────────────────────────────────────

export async function generateIdentityKeypair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
	const sodium = await getSodium()
	const kp = sodium.crypto_box_keypair()
	return { publicKey: kp.publicKey, privateKey: kp.privateKey }
}

// ─── Conversation key ─────────────────────────────────────────────────────────

export async function generateConversationKey(): Promise<Uint8Array> {
	const sodium = await getSodium()
	return sodium.crypto_aead_xchacha20poly1305_ietf_keygen()
}

// ─── Encrypt / decrypt messages ───────────────────────────────────────────────

export type EncryptedPayload = {
	ciphertext: string
	nonce: string
	keyEpoch: number
	messageType: "TEXT" | "IMAGE"
}

export async function encryptMessage(
	K: Uint8Array,
	plaintext: string,
	epoch = 1,
): Promise<EncryptedPayload> {
	const sodium = await getSodium()
	const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES)
	const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
		sodium.from_string(plaintext),
		null,
		null,
		nonce,
		K,
	)
	return { ciphertext: b64(ct), nonce: b64(nonce), keyEpoch: epoch, messageType: "TEXT" }
}

export async function decryptMessage(K: Uint8Array, m: EncryptedPayload): Promise<string> {
	const sodium = await getSodium()
	const pt = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
		null,
		unb64(m.ciphertext),
		null,
		unb64(m.nonce),
		K,
	)
	return sodium.to_string(pt)
}

// ─── Device key wrapping ──────────────────────────────────────────────────────

export async function wrapKeyToDevice(K: Uint8Array, devicePublicKey: Uint8Array): Promise<string> {
	const sodium = await getSodium()
	return b64(sodium.crypto_box_seal(K, devicePublicKey))
}

export async function unwrapDeviceKey(
	wrappedBase64: string,
	pub: Uint8Array,
	priv: Uint8Array,
): Promise<Uint8Array> {
	const sodium = await getSodium()
	return sodium.crypto_box_seal_open(unb64(wrappedBase64), pub, priv)
}

// ─── Master key wrapping (secretbox) ─────────────────────────────────────────

export async function wrapKeyToMaster(K: Uint8Array, MK: Uint8Array): Promise<string> {
	const sodium = await getSodium()
	const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
	const box = sodium.crypto_secretbox_easy(K, nonce, MK)
	return b64(new Uint8Array([...nonce, ...box]))
}

export async function unwrapMasterKey(wrappedBase64: string, MK: Uint8Array): Promise<Uint8Array> {
	const sodium = await getSodium()
	const blob = unb64(wrappedBase64)
	const nonce = blob.slice(0, sodium.crypto_secretbox_NONCEBYTES)
	return sodium.crypto_secretbox_open_easy(blob.slice(sodium.crypto_secretbox_NONCEBYTES), nonce, MK)
}

// ─── KEK derivation (Argon2id) ────────────────────────────────────────────────

export type KdfParams = {
	algo: "argon2id"
	salt: string
	ops: number
	mem: number
}

export async function deriveKEK(
	passphrase: string,
	params?: KdfParams,
): Promise<{ kek: Uint8Array; kdfParams: KdfParams }> {
	const sodium = await getSodium()
	const salt = params
		? unb64(params.salt)
		: sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES)
	const ops = params?.ops ?? sodium.crypto_pwhash_OPSLIMIT_MODERATE
	const mem = params?.mem ?? sodium.crypto_pwhash_MEMLIMIT_MODERATE
	const kek = sodium.crypto_pwhash(
		sodium.crypto_secretbox_KEYBYTES,
		passphrase,
		salt,
		ops,
		mem,
		sodium.crypto_pwhash_ALG_ARGON2ID13,
	)
	return { kek, kdfParams: { algo: "argon2id", salt: b64(salt), ops, mem } }
}

// ─── Master key creation + backup blob ───────────────────────────────────────

export async function generateMasterKey(): Promise<Uint8Array> {
	const sodium = await getSodium()
	return sodium.crypto_secretbox_keygen()
}

export async function wrapMasterKeyWithPassphrase(
	MK: Uint8Array,
	passphrase: string,
): Promise<{ wrappedMasterKey: string; kdfParams: KdfParams }> {
	const sodium = await getSodium()
	const { kek, kdfParams } = await deriveKEK(passphrase)
	const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
	const box = sodium.crypto_secretbox_easy(MK, nonce, kek)
	return {
		wrappedMasterKey: b64(new Uint8Array([...nonce, ...box])),
		kdfParams,
	}
}

export async function unwrapMasterKeyWithPassphrase(
	wrappedMasterKey: string,
	kdfParams: KdfParams,
	passphrase: string,
): Promise<Uint8Array> {
	const sodium = await getSodium()
	const { kek } = await deriveKEK(passphrase, kdfParams)
	const blob = unb64(wrappedMasterKey)
	const nonce = blob.slice(0, sodium.crypto_secretbox_NONCEBYTES)
	return sodium.crypto_secretbox_open_easy(blob.slice(sodium.crypto_secretbox_NONCEBYTES), nonce, kek)
}
