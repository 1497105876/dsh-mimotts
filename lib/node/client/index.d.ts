/**
 * MiMo TTS speech synthesis, browser half.
 *
 * Two contributions, both registered through the typed slot system:
 * - `conversation.chat.assistant-actions`: the volume button under every
 *   finalized assistant message, with its floating player (draggable progress
 *   bar) once audio exists;
 * - `settings.section`: the `语音合成` settings page, mounted while the Host
 *   serves this plugin's `mimotts` configuration namespace.
 *
 * Neither entry owns business state: text comes from the Conversation binding
 * through `useChat`, configuration through `ctx.configForms`, synthesis through
 * the Host's `/api/mimotts` routes, and copy through `ctx.locale`.
 * @module dsh-mimotts/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
export type { SpeakActionInjected, SpeakActionProps, TtsSettingsInjected, TtsSettingsSectionProps } from './slots.ts';
/** Required services (cordis fiber inject). */
export declare const inject: string[];
/**
 * Mount the speak entries and the speech-synthesis settings page.
 * @param ctx - the browser plugin context.
 */
export declare function apply(ctx: ClientContext): void;
