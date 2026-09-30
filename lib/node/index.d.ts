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
import type { Context, Volatile } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Cordis plugin name used by loader diagnostics. */
export declare const name = "mimotts";
/** Runtime settings projected into the configuration form. */
export interface Config {
    /** Literal MiMo API key; leave blank and layer `!!js process.env.MIMO_API_KEY` over it instead. */
    apiKey: Volatile<string | undefined>;
    /** Endpoint base; `/chat/completions` is appended. */
    baseUrl: Volatile<string | undefined>;
    /** MiMo TTS model id. */
    model: Volatile<string | undefined>;
    /** Preset voice name used when no clone sample is configured. */
    voice: Volatile<string | undefined>;
    /** Host-local WAV (24 kHz / 16-bit / mono, 5–15 s) used as the voice-clone reference. */
    voiceSamplePath: Volatile<string | undefined>;
    /** Default speaking-style phrase (e.g. `开心`, `语速慢`, `东北话`). */
    style: Volatile<string | undefined>;
    /** Longest text one synthesis accepts, in characters. */
    maxChars: Volatile<number>;
    /** Upper bound on one upstream round-trip, in milliseconds. */
    timeoutMs: Volatile<number>;
}
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    apiKey: z<string, string, "volatile">;
    baseUrl: z<string, string, "volatile-defined">;
    model: z<string, string, "volatile-defined">;
    voice: z<string, string, "volatile-defined">;
    voiceSamplePath: z<string, string, "volatile">;
    style: z<string, string, "volatile">;
    maxChars: z<number, number, "volatile-defined">;
    timeoutMs: z<number, number, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    apiKey: z<string, string, "volatile">;
    baseUrl: z<string, string, "volatile-defined">;
    model: z<string, string, "volatile-defined">;
    voice: z<string, string, "volatile-defined">;
    voiceSamplePath: z<string, string, "volatile">;
    style: z<string, string, "volatile">;
    maxChars: z<number, number, "volatile-defined">;
    timeoutMs: z<number, number, "volatile-defined">;
}>>, "plain">;
/**
 * Host registration: the settings presentation policy and the two Web routes.
 * @param ctx - plugin context; the routes appear when `webServer` and
 * `connection` exist (Web and Desktop GUI compositions).
 * @param config - live volatile settings.
 */
export declare function apply(ctx: Context, config: Config): void;
