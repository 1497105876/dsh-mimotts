/**
 * Browser → Host calls for speech synthesis.
 *
 * Both halves share their route vocabulary through `src/settings.ts`; the
 * browser sends text and receives WAV bytes, so the MiMo API key never enters
 * the page. Failures arrive as stable codes the UI maps to localized copy.
 * @module dsh-mimotts/client/api
 */
import type { TtsErrorCode, TtsRecordingsIndex, TtsStatusView, TtsSynthesizeRequest } from '../settings.ts';
/** A synthesize failure carrying the Host's stable code. */
export declare class TtsClientError extends Error {
    readonly code: TtsErrorCode | 'generic';
    /**
     * @param code - stable failure code; `generic` when the Host gave none.
     * @param message - Host-supplied detail, safe to show.
     */
    constructor(code: TtsErrorCode | 'generic', message: string);
}
/**
 * Read the Host's resolved engine configuration (never secrets).
 * @returns the effective model, voice, endpoint, and key/sample presence.
 */
export declare function fetchTtsStatus(): Promise<TtsStatusView>;
/**
 * Synthesize one text into playable WAV audio.
 * @param request - text and optional style/voice overrides (settings-page
 * audition previews unsaved values through these).
 * @returns the WAV payload as a Blob ready for `URL.createObjectURL`.
 * @throws {TtsClientError} when the Host refuses or the transport fails.
 */
export declare function requestSpeech(request: TtsSynthesizeRequest): Promise<Blob>;
/** The identity of a freshly saved recording version. */
export interface RecordingRef {
    /** Recording-node id. */
    recId: string;
    /** Version id within that node. */
    verId: string;
}
/**
 * List the persisted speech history.
 * @returns the recordings index (empty when none recorded yet).
 */
export declare function fetchRecordings(): Promise<TtsRecordingsIndex>;
/**
 * Synthesize and persist one text, returning both the audio and its identity
 * in history. Used by the speak action so every read-aloud is remembered.
 * @param request - text and optional style/voice overrides.
 * @returns the WAV blob and the new recording reference.
 * @throws {TtsClientError} when the Host refuses or the transport fails.
 */
export declare function requestRecording(request: TtsSynthesizeRequest): Promise<{
    blob: Blob;
    ref: RecordingRef;
}>;
/**
 * Re-synthesize a recording's text with the engine's current settings,
 * appending a new version. Earlier versions stay intact for comparison.
 * @param recId - the recording node id.
 * @returns the new version's reference.
 */
export declare function resynthesizeRecording(recId: string): Promise<RecordingRef>;
/**
 * Delete one version from history.
 * @param recId - the recording node id.
 * @param verId - the version id to remove.
 */
export declare function deleteRecordingVersion(recId: string, verId: string): Promise<void>;
/**
 * The URL serving one version's WAV file.
 * @param recId - the recording node id.
 * @param verId - the version id.
 * @returns an absolute path under the plugin's recordings route.
 */
export declare function recordingFileUrl(recId: string, verId: string): string;
