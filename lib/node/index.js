/**
 * MiMo TTS speech synthesis, Host half.
 *
 * This plugin answers two questions the browser asks of the Host: what the
 * engine is configured to do (`GET /api/mimotts/status`) and what one text
 * sounds like (`POST /api/mimotts/synthesize`). The API key never leaves the
 * Host — the browser sends text and receives WAV bytes.
 *
 * Settings are ordinary volatile Config fields, so the settings service
 * projects them into the configuration form the browser half renders on its
 * `语音合成` settings page. The automatic Plugins-page card is turned off:
 * this plugin owns its own settings page instead.
 * @module dsh-mimotts
 */
import { stat } from 'node:fs/promises';
import z from '@deepseek-ai/schemastery';
import { DEFAULT_BASE_URL, DEFAULT_MAX_CHARS, DEFAULT_MODEL, DEFAULT_TIMEOUT_MS, DEFAULT_VOICE, MIMOTTS_STATUS_PATH, MIMOTTS_SYNTHESIZE_PATH, } from "./settings.js";
import { resolveEngineConfig, synthesizeSpeech, TtsError } from "./tts.js";
/** Cordis plugin name used by loader diagnostics. */
export const name = 'mimotts';
export const Config = z.object({
    apiKey: z.string().role('secret').volatile(),
    baseUrl: z.string().default(DEFAULT_BASE_URL).volatile(),
    model: z.string().default(DEFAULT_MODEL).volatile(),
    voice: z.string().default(DEFAULT_VOICE).volatile(),
    voiceSamplePath: z.string().volatile(),
    style: z.string().volatile(),
    maxChars: z.number().step(1).min(1).default(DEFAULT_MAX_CHARS).volatile(),
    timeoutMs: z.number().step(1).min(1).default(DEFAULT_TIMEOUT_MS).volatile(),
});
/** Read the whole config as one consistent snapshot at operation start. */
function snapshotOf(config) {
    return resolveEngineConfig({
        apiKey: config.apiKey.get(),
        baseUrl: config.baseUrl.get(),
        model: config.model.get(),
        voice: config.voice.get(),
        voiceSamplePath: config.voiceSamplePath.get(),
        style: config.style.get(),
        maxChars: config.maxChars.get(),
        timeoutMs: config.timeoutMs.get(),
    });
}
/**
 * Host registration: the settings presentation policy and the two Web routes.
 * @param ctx - plugin context; the routes appear when `webServer` and
 * `connection` exist (Web and Desktop GUI compositions).
 * @param config - live volatile settings.
 */
export function apply(ctx, config) {
    // This plugin owns its settings page (the browser half's `settings.section`
    // entry), so it opts out of the automatic Plugins-page config card.
    ctx.inject(['settings'], (child) => {
        child.effect(() => child.settings.configure({ auto: false }, ctx.fiber));
    });
    ctx.inject(['webServer', 'connection'], (child) => {
        const fence = (req, res) => {
            // The configured Host/Origin fence plus browser authentication: an
            // unauthenticated LAN request must not spend the operator's API credits.
            const rejection = child.connection.requestRejection(req);
            if (rejection === undefined)
                return false;
            res.statusCode = rejection;
            res.end();
            return true;
        };
        const sendJson = (res, status, body) => {
            const bytes = Buffer.from(JSON.stringify(body), 'utf8');
            res.statusCode = status;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.setHeader('cache-control', 'no-store');
            res.end(bytes);
        };
        const sendError = (res, status, body) => {
            sendJson(res, status, body);
        };
        child.effect(() => child.webServer.register({
            kind: 'exact',
            path: MIMOTTS_STATUS_PATH,
            handler: (req, res) => {
                if (fence(req, res))
                    return;
                if (req.method !== 'GET') {
                    sendError(res, 405, { error: { code: 'bad-request', message: 'GET only.' } });
                    return;
                }
                const engine = snapshotOf(config);
                void (async () => {
                    const hasVoiceSample = engine.voiceSamplePath !== ''
                        ? await stat(engine.voiceSamplePath).then(value => value.isFile(), () => false)
                        : false;
                    const status = {
                        configured: engine.apiKey !== '',
                        model: engine.model,
                        voice: engine.voice,
                        hasVoiceSample,
                        baseUrl: engine.baseUrl,
                    };
                    sendJson(res, 200, status);
                })();
            },
        }), `dsh-mimotts: GET ${MIMOTTS_STATUS_PATH}`);
        child.effect(() => child.webServer.register({
            kind: 'exact',
            path: MIMOTTS_SYNTHESIZE_PATH,
            handler: (req, res) => {
                if (fence(req, res))
                    return;
                if (req.method !== 'POST') {
                    sendError(res, 405, { error: { code: 'bad-request', message: 'POST only.' } });
                    return;
                }
                void (async () => {
                    const parsed = await readJsonBody(req);
                    if (parsed === undefined) {
                        sendError(res, 400, { error: { code: 'bad-request', message: 'Request body is not a JSON object.' } });
                        return;
                    }
                    const request = parsed;
                    if (typeof request.text !== 'string' || request.text.trim() === '') {
                        sendError(res, 400, { error: { code: 'bad-request', message: 'A non-empty `text` string is required.' } });
                        return;
                    }
                    const engine = snapshotOf(config);
                    try {
                        const wav = await synthesizeSpeech(engine, {
                            text: request.text,
                            style: typeof request.style === 'string' ? request.style : undefined,
                            voice: typeof request.voice === 'string' ? request.voice : undefined,
                        });
                        res.statusCode = 200;
                        res.setHeader('content-type', 'audio/wav');
                        res.setHeader('cache-control', 'no-store');
                        res.end(Buffer.from(wav));
                    }
                    catch (error) {
                        const failure = error instanceof TtsError
                            ? error
                            : new TtsError('upstream-error', error instanceof Error ? error.message : String(error));
                        const status = failure.code === 'not-configured' ? 503
                            : failure.code === 'bad-request' || failure.code === 'text-too-long' ? 400
                                : failure.code === 'timeout' ? 504
                                    : 502;
                        sendError(res, status, { error: { code: failure.code, message: failure.message } });
                    }
                })();
            },
        }), `dsh-mimotts: POST ${MIMOTTS_SYNTHESIZE_PATH}`);
    });
}
/** JSON body size limit; settings and one speak request are small. */
const MAX_BODY_BYTES = 1024 * 1024;
/**
 * Read one JSON object request body under the size limit.
 * @param req - inbound request.
 * @returns the parsed object, or undefined when the body is absent, oversized,
 * malformed, or not a JSON object.
 */
async function readJsonBody(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = chunk;
        size += buffer.length;
        if (size > MAX_BODY_BYTES)
            return undefined;
        chunks.push(buffer);
    }
    if (chunks.length === 0)
        return undefined;
    try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : undefined;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=index.js.map