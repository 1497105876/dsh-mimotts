/**
 * Settings and route vocabulary shared by the Host and browser halves.
 *
 * Both bundles inline this file, so it must stay pure: constants and types
 * only, no Node or DOM APIs. The namespace is the profile entry id the bundle
 * patch inserts (`cordis.patch.yml`), and the route paths are the seam the two
 * halves meet on.
 * @module dsh-mimotts/settings
 */
/** Settings namespace: the profile entry id of this plugin's loader row. */
export const MIMOTTS_NAMESPACE = 'mimotts';
/** Route prefix owned by this plugin on `ctx.webServer`. */
export const MIMOTTS_API_PREFIX = '/api/mimotts';
/** `GET` route reporting the resolved engine configuration without secrets. */
export const MIMOTTS_STATUS_PATH = `${MIMOTTS_API_PREFIX}/status`;
/** `POST` route synthesizing one text into WAV audio. */
export const MIMOTTS_SYNTHESIZE_PATH = `${MIMOTTS_API_PREFIX}/synthesize`;
/** MiMo platform endpoint base; `/chat/completions` is appended. */
export const DEFAULT_BASE_URL = 'https://api.xiaomimimo.com/v1';
/** MiMo TTS model id. */
export const DEFAULT_MODEL = 'mimo-v2.5-tts';
/** Preset voice used when no clone sample is configured. */
export const DEFAULT_VOICE = 'mimo_default';
/**
 * Credential reference naming the MiMo API key inside the host credentials
 * store; the literal key itself never lands in a configuration file.
 */
export const DEFAULT_CREDENTIAL_REF = 'MIMO_API_KEY';
/** Longest text one synthesis accepts, in characters. */
export const DEFAULT_MAX_CHARS = 2000;
/** Upper bound on one upstream round-trip, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 60_000;
/** Sample sentence the settings page's audition button speaks. */
export const AUDITION_TEXT = '你好，这是 MiMo 语音合成的试听效果。';
/** Route prefix for persisted speech history (list / create / file). */
export const MIMOTTS_RECORDINGS_PATH = `${MIMOTTS_API_PREFIX}/recordings`;
/**
 * Response header carrying the new recording identity. Its value is the
 * base64 encoding of `JSON.stringify({ recId, verId })` so it survives the
 * `audio/wav` body that the synthesize route streams back.
 */
export const MIMOTTS_RECORDING_HEADER = 'x-mimotts-recording';
//# sourceMappingURL=settings.js.map