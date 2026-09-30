/**
 * MiMo TTS engine client.
 *
 * Speaks text through the MiMo platform's OpenAI-shaped `/chat/completions`
 * endpoint with an `audio` output block: the request carries the text as an
 * assistant message (optionally prefixed with a `<style>…</style>` phrase), and
 * the response carries base64 audio in `choices[0].message.audio.data`. Voice
 * cloning swaps the preset `audio.voice` for an `audio.voice_audio` reference
 * clip. Raw PCM responses are wrapped as WAV so the browser can seek.
 * @module dsh-mimotts/tts
 */
import { readFile } from 'node:fs/promises';
import { clampText, toSpeakableText } from "./normalize.js";
import { isRiffWav, wrapPcmAsWav } from "./wav.js";
import { DEFAULT_BASE_URL, DEFAULT_MAX_CHARS, DEFAULT_MODEL, DEFAULT_TIMEOUT_MS, DEFAULT_VOICE, } from "./settings.js";
/** A synthesis failure carrying a stable, UI-mappable code. */
export class TtsError extends Error {
    code;
    cause;
    /**
     * @param code - stable failure code returned to the browser.
     * @param message - human-readable detail; never contains secrets.
     * @param cause - upstream failure, when one raised this error.
     */
    constructor(code, message, cause) {
        super(message);
        this.code = code;
        this.cause = cause;
        this.name = 'TtsError';
    }
}
const nodeDeps = {
    fetch: (...args) => globalThis.fetch(...args),
    readVoiceSample: async (path) => new Uint8Array(await readFile(path)),
};
/**
 * Resolve a settings section into the engine configuration a synthesis runs
 * with. Defaults live here rather than at the use site, so every caller sees
 * fully defaulted values (the schema defaults are for the settings form).
 * @param section - the resolved settings section (fields may be blank).
 * @returns the engine configuration for one synthesis.
 */
export function resolveEngineConfig(section) {
    return {
        apiKey: (section.apiKey ?? '').trim(),
        baseUrl: (section.baseUrl ?? '').trim() || DEFAULT_BASE_URL,
        model: (section.model ?? '').trim() || DEFAULT_MODEL,
        voice: (section.voice ?? '').trim() || DEFAULT_VOICE,
        voiceSamplePath: (section.voiceSamplePath ?? '').trim(),
        style: (section.style ?? '').trim(),
        maxChars: typeof section.maxChars === 'number' && section.maxChars > 0
            ? Math.floor(section.maxChars)
            : DEFAULT_MAX_CHARS,
        timeoutMs: typeof section.timeoutMs === 'number' && section.timeoutMs > 0
            ? Math.floor(section.timeoutMs)
            : DEFAULT_TIMEOUT_MS,
    };
}
/**
 * Synthesize one text into WAV audio.
 *
 * The text is normalized first (Markdown decoration is never spoken), then
 * clamped to the configured budget — a long reply speaks its opening rather
 * than being refused.
 * @param config - resolved engine configuration.
 * @param request - text and optional style/voice overrides.
 * @param deps - transport and filesystem seam; defaults to real `fetch`/`fs`.
 * @returns a complete WAV file.
 * @throws {TtsError} when the request is unusable or the provider fails.
 */
export async function synthesizeSpeech(config, request, deps = nodeDeps) {
    if (config.apiKey === '') {
        throw new TtsError('not-configured', 'No MiMo API key is configured; set one in Settings → 语音合成.');
    }
    const speakable = clampText(toSpeakableText(request.text ?? ''), config.maxChars);
    if (speakable === '') {
        throw new TtsError('bad-request', 'The message carries no speakable text.');
    }
    const style = (request.style ?? '').trim() || config.style;
    const content = style === '' ? speakable : `<style>${style}</style>${speakable}`;
    const voice = (request.voice ?? '').trim() || config.voice;
    let audio;
    if (config.voiceSamplePath !== '') {
        let sample;
        try {
            sample = await deps.readVoiceSample(config.voiceSamplePath);
        }
        catch (cause) {
            throw new TtsError('voice-sample-unreadable', `The voice-clone sample at ${config.voiceSamplePath} could not be read.`, cause);
        }
        audio = {
            format: 'wav',
            voice_audio: { format: 'wav', data: Buffer.from(sample).toString('base64') },
        };
    }
    else {
        audio = { format: 'wav', voice };
    }
    const payload = {
        model: config.model,
        audio,
        messages: [{ role: 'assistant', content }],
    };
    const endpoint = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    let response;
    try {
        response = await deps.fetch(endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'api-key': config.apiKey,
                'user-agent': 'dsh-mimotts/0.1.0',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(config.timeoutMs),
        });
    }
    catch (cause) {
        const timedOut = cause instanceof Error && cause.name === 'TimeoutError';
        throw new TtsError(timedOut ? 'timeout' : 'upstream-error', timedOut
            ? `MiMo TTS did not answer within ${config.timeoutMs} ms.`
            : `MiMo TTS could not be reached: ${cause instanceof Error ? cause.message : String(cause)}`, cause);
    }
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new TtsError('upstream-error', `MiMo TTS returned HTTP ${response.status}${detail === '' ? '' : `: ${detail.slice(0, 300)}`}`);
    }
    let body;
    try {
        body = await response.json();
    }
    catch (cause) {
        throw new TtsError('invalid-audio', 'MiMo TTS returned a response that is not JSON.', cause);
    }
    const data = decodeAudioData(body);
    if (isRiffWav(data))
        return data;
    return wrapPcmAsWav(data);
}
/**
 * Pull the base64 audio block out of the provider response.
 * @param body - parsed `chat.completion` response.
 * @returns decoded audio bytes (WAV or raw PCM).
 * @throws {TtsError} when the response carries an error or no audio block.
 */
function decodeAudioData(body) {
    const root = body;
    if (root === null || typeof root !== 'object') {
        throw new TtsError('invalid-audio', 'MiMo TTS returned an empty response.');
    }
    if (root.error !== undefined && root.error !== null) {
        const detail = typeof root.error === 'object' && 'message' in root.error
            ? String(root.error.message)
            : JSON.stringify(root.error);
        throw new TtsError('upstream-error', `MiMo TTS reported an error: ${detail.slice(0, 300)}`);
    }
    const encoded = root.choices?.[0]?.message?.audio?.data;
    if (typeof encoded !== 'string' || encoded === '') {
        throw new TtsError('invalid-audio', 'MiMo TTS returned no audio block in choices[0].message.audio.data.');
    }
    const data = new Uint8Array(Buffer.from(encoded, 'base64'));
    if (data.length === 0)
        throw new TtsError('invalid-audio', 'MiMo TTS returned an empty audio block.');
    return data;
}
//# sourceMappingURL=tts.js.map