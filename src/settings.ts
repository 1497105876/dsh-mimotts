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
export const MIMOTTS_NAMESPACE = 'mimotts'

/** Route prefix owned by this plugin on `ctx.webServer`. */
export const MIMOTTS_API_PREFIX = '/api/mimotts'

/** `GET` route reporting the resolved engine configuration without secrets. */
export const MIMOTTS_STATUS_PATH = `${MIMOTTS_API_PREFIX}/status`

/** `POST` route synthesizing one text into WAV audio. */
export const MIMOTTS_SYNTHESIZE_PATH = `${MIMOTTS_API_PREFIX}/synthesize`

/** MiMo platform endpoint base; `/chat/completions` is appended. */
export const DEFAULT_BASE_URL = 'https://api.xiaomimimo.com/v1'

/** MiMo TTS model id. */
export const DEFAULT_MODEL = 'mimo-v2.5-tts'

/** Preset voice used when no clone sample is configured. */
export const DEFAULT_VOICE = 'mimo_default'

/** Longest text one synthesis accepts, in characters. */
export const DEFAULT_MAX_CHARS = 2000

/** Upper bound on one upstream round-trip, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 60_000

/**
 * The resolved settings section, as the settings form projects it. Secrets
 * never ride a response: `apiKey` arrives as `undefined` no matter what the
 * Host holds, and its presence is reported only through {@link TtsStatusView}.
 */
export interface TtsSettings {
  /** Literal MiMo API key (write-only). */
  apiKey?: string | undefined
  /** Endpoint base; blank inherits {@link DEFAULT_BASE_URL}. */
  baseUrl?: string | undefined
  /** Model id; blank inherits {@link DEFAULT_MODEL}. */
  model?: string | undefined
  /** Preset voice name; blank inherits {@link DEFAULT_VOICE}. */
  voice?: string | undefined
  /** Host-local WAV used as the voice-clone reference; blank uses the preset voice. */
  voiceSamplePath?: string | undefined
  /** Default speaking-style phrase prepended as `<style>…</style>`. */
  style?: string | undefined
  /** Longest accepted text, in characters. */
  maxChars?: number | undefined
  /** Upper bound on one upstream round-trip, in milliseconds. */
  timeoutMs?: number | undefined
}

/** What `GET /api/mimotts/status` reports; safe to show in the UI verbatim. */
export interface TtsStatusView {
  /** Whether the Host resolves a non-empty API key. */
  configured: boolean
  /** Effective model id. */
  model: string
  /** Effective preset voice. */
  voice: string
  /** Whether the configured voice-clone sample is present on the Host. */
  hasVoiceSample: boolean
  /** Effective endpoint base. */
  baseUrl: string
}

/** Failure codes the synthesize route returns; the browser maps them to copy. */
export type TtsErrorCode =
  | 'bad-request'
  | 'not-configured'
  | 'text-too-long'
  | 'voice-sample-unreadable'
  | 'timeout'
  | 'upstream-error'
  | 'invalid-audio'

/** JSON error body returned by this plugin's routes. */
export interface TtsErrorBody {
  error: {
    code: TtsErrorCode
    /** Provider- or host-supplied detail; safe to show, never contains secrets. */
    message: string
  }
}

/** JSON body accepted by `POST /api/mimotts/synthesize`. */
export interface TtsSynthesizeRequest {
  /** Text to speak. Markdown is normalized Host-side before synthesis. */
  text: string
  /** Style override (e.g. `开心`, `语速慢`); blank inherits the configured default. */
  style?: string | undefined
  /** Preset-voice override; blank inherits the configured default. */
  voice?: string | undefined
}

/** Sample sentence the settings page's audition button speaks. */
export const AUDITION_TEXT = '你好，这是 MiMo 语音合成的试听效果。'
