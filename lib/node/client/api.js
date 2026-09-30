/**
 * Browser → Host calls for speech synthesis.
 *
 * Both halves share their route vocabulary through `src/settings.ts`; the
 * browser sends text and receives WAV bytes, so the MiMo API key never enters
 * the page. Failures arrive as stable codes the UI maps to localized copy.
 * @module dsh-mimotts/client/api
 */
import { MIMOTTS_RECORDING_HEADER, MIMOTTS_RECORDINGS_PATH, MIMOTTS_STATUS_PATH, MIMOTTS_SYNTHESIZE_PATH, } from "../settings.js";
/** A synthesize failure carrying the Host's stable code. */
export class TtsClientError extends Error {
    code;
    /**
     * @param code - stable failure code; `generic` when the Host gave none.
     * @param message - Host-supplied detail, safe to show.
     */
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'TtsClientError';
    }
}
/**
 * Read the Host's resolved engine configuration (never secrets).
 * @returns the effective model, voice, endpoint, and key/sample presence.
 */
export async function fetchTtsStatus() {
    const response = await fetch(MIMOTTS_STATUS_PATH, { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
        throw new TtsClientError('generic', `status request failed with HTTP ${response.status}`);
    }
    return await response.json();
}
/**
 * Synthesize one text into playable WAV audio.
 * @param request - text and optional style/voice overrides (settings-page
 * audition previews unsaved values through these).
 * @returns the WAV payload as a Blob ready for `URL.createObjectURL`.
 * @throws {TtsClientError} when the Host refuses or the transport fails.
 */
export async function requestSpeech(request) {
    let response;
    try {
        response = await fetch(MIMOTTS_SYNTHESIZE_PATH, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(request),
        });
    }
    catch (error) {
        throw new TtsClientError('generic', error instanceof Error ? error.message : String(error));
    }
    if (response.ok)
        return await response.blob();
    let code = 'generic';
    let message = `synthesize request failed with HTTP ${response.status}`;
    try {
        const body = await response.json();
        if (typeof body.error?.code === 'string')
            code = body.error.code;
        if (typeof body.error?.message === 'string')
            message = body.error.message;
    }
    catch {
        // Non-JSON failure body: keep the generic HTTP message.
    }
    throw new TtsClientError(code, message);
}
/**
 * List the persisted speech history.
 * @returns the recordings index (empty when none recorded yet).
 */
export async function fetchRecordings() {
    const response = await fetch(MIMOTTS_RECORDINGS_PATH, { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
        throw new TtsClientError('generic', `recordings request failed with HTTP ${response.status}`);
    }
    return await response.json();
}
/**
 * Synthesize and persist one text, returning both the audio and its identity
 * in history. Used by the speak action so every read-aloud is remembered.
 * @param request - text and optional style/voice overrides.
 * @returns the WAV blob and the new recording reference.
 * @throws {TtsClientError} when the Host refuses or the transport fails.
 */
export async function requestRecording(request) {
    let response;
    try {
        response = await fetch(MIMOTTS_RECORDINGS_PATH, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(request),
        });
    }
    catch (error) {
        throw new TtsClientError('generic', error instanceof Error ? error.message : String(error));
    }
    if (response.ok) {
        const blob = await response.blob();
        const header = response.headers.get(MIMOTTS_RECORDING_HEADER);
        let ref = { recId: '', verId: '' };
        if (header !== null) {
            try {
                ref = JSON.parse(atob(header));
            }
            catch {
                // Header malformed: the audio still plays, just without a history ref.
            }
        }
        return { blob, ref };
    }
    let code = 'generic';
    let message = `recording request failed with HTTP ${response.status}`;
    try {
        const body = await response.json();
        if (typeof body.error?.code === 'string')
            code = body.error.code;
        if (typeof body.error?.message === 'string')
            message = body.error.message;
    }
    catch {
        // Non-JSON failure body: keep the generic HTTP message.
    }
    throw new TtsClientError(code, message);
}
/**
 * Re-synthesize a recording's text with the engine's current settings,
 * appending a new version. Earlier versions stay intact for comparison.
 * @param recId - the recording node id.
 * @returns the new version's reference.
 */
export async function resynthesizeRecording(recId) {
    let response;
    try {
        response = await fetch(`${MIMOTTS_RECORDINGS_PATH}/resynth?rec=${encodeURIComponent(recId)}`, { method: 'POST' });
    }
    catch (error) {
        throw new TtsClientError('generic', error instanceof Error ? error.message : String(error));
    }
    if (response.ok)
        return await response.json();
    let message = `re-synthesis failed with HTTP ${response.status}`;
    try {
        const body = await response.json();
        if (typeof body.error?.message === 'string')
            message = body.error.message;
    }
    catch {
        // Keep the generic HTTP message.
    }
    throw new TtsClientError('generic', message);
}
/**
 * Delete one version from history.
 * @param recId - the recording node id.
 * @param verId - the version id to remove.
 */
export async function deleteRecordingVersion(recId, verId) {
    const response = await fetch(`${MIMOTTS_RECORDINGS_PATH}/version?rec=${encodeURIComponent(recId)}&ver=${encodeURIComponent(verId)}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
        throw new TtsClientError('generic', `delete failed with HTTP ${response.status}`);
    }
}
/**
 * The URL serving one version's WAV file.
 * @param recId - the recording node id.
 * @param verId - the version id.
 * @returns an absolute path under the plugin's recordings route.
 */
export function recordingFileUrl(recId, verId) {
    return `${MIMOTTS_RECORDINGS_PATH}/file?rec=${encodeURIComponent(recId)}&ver=${encodeURIComponent(verId)}`;
}
//# sourceMappingURL=api.js.map