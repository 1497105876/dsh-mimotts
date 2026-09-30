/**
 * The engine-status mirror shared by the speak entries and the settings page.
 *
 * One `GET /api/mimotts/status` answers every mounted control: entries lazy-
 * load it on first hover/focus, the settings page refreshes it after each
 * write that could change whether a key exists. Failures publish the
 * "unconfigured" view rather than an error state — a missing answer must not
 * claim a key exists.
 * @module dsh-mimotts/client/status
 */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store';
import { DEFAULT_BASE_URL, DEFAULT_MODEL, DEFAULT_VOICE } from "../settings.js";
import { fetchTtsStatus } from "./api.js";
const store = createSnapshotStore({
    configured: false,
    model: DEFAULT_MODEL,
    voice: DEFAULT_VOICE,
    hasVoiceSample: false,
    baseUrl: DEFAULT_BASE_URL,
});
let inflight = null;
/**
 * @returns the shared status mirror every control derives from.
 */
export function ttsStatusStore() {
    return store;
}
/**
 * Ensure one status read is under way; concurrent callers share it.
 * @returns the read in flight, which never rejects.
 */
export function ensureTtsStatus() {
    if (inflight !== null)
        return inflight;
    inflight = fetchTtsStatus()
        .then((view) => { store.set(view); })
        .catch(() => undefined)
        .finally(() => { inflight = null; });
    return inflight;
}
/**
 * Re-read the status even when one is already under way; called after writes
 * that could add or remove the API key.
 * @returns the fresh read, which never rejects.
 */
export function refreshTtsStatus() {
    inflight = null;
    return ensureTtsStatus();
}
//# sourceMappingURL=status.js.map