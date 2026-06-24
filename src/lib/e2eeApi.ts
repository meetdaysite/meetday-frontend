import apiClient from "./axios"
import type { KdfParams } from "./e2ee"

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeviceInfo = {
	deviceId: string
	identityPublicKey: string
	label: string | null
	revokedAt: string | null
	createdAt: string
}

export type KeyBackup = {
	wrappedMasterKey: string
	kdfParams: KdfParams
	updatedAt: string
}

export type DmKeyWrapRequest = {
	conversationId: string
	deviceId: string
	epoch: number
	userId: string
}

// ─── Device management ────────────────────────────────────────────────────────

export async function registerDevice(
	deviceId: string,
	identityPublicKey: string,
	label?: string,
): Promise<DeviceInfo> {
	const { data } = await apiClient.post<{ success: boolean; data: DeviceInfo }>("/me/devices", {
		deviceId,
		identityPublicKey,
		label: label ?? navigator.userAgent.slice(0, 60),
	})
	return data.data
}

export async function listMyDevices(): Promise<DeviceInfo[]> {
	const { data } = await apiClient.get<{ success: boolean; data: DeviceInfo[] }>("/me/devices")
	return data.data
}

export async function revokeDevice(deviceId: string): Promise<void> {
	await apiClient.delete(`/me/devices/${deviceId}`)
}

// ─── Key backup ───────────────────────────────────────────────────────────────

export async function storeKeyBackup(
	wrappedMasterKey: string,
	kdfParams: KdfParams,
): Promise<void> {
	await apiClient.put("/me/key-backup", { wrappedMasterKey, kdfParams })
}

export async function fetchKeyBackup(): Promise<KeyBackup> {
	const { data } = await apiClient.get<{ success: boolean; data: KeyBackup }>("/me/key-backup")
	return data.data
}

// ─── Key wrap requests ────────────────────────────────────────────────────────

export async function getDmKeyWrapRequests(): Promise<DmKeyWrapRequest[]> {
	const { data } = await apiClient.get<{ success: boolean; data: DmKeyWrapRequest[] }>(
		"/me/dm-key-wrap-requests",
	)
	return data.data
}
