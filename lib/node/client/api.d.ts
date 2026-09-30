/**
 * Browser → Host calls for speech synthesis.
 *
 * Both halves share their route vocabulary through `src/settings.ts`; the
 * browser sends text and receives WAV bytes, so the MiMo API key never enters
 * the page. Failures arrive as stable codes the UI maps to localized copy.
 * @module dsh-mimotts/client/api
 */
import type { TtsErrorCode, TtsStatusView, TtsSynthesizeRequest } from '../settings.ts';
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
