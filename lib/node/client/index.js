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
import { MIMOTTS_NAMESPACE } from "../settings.js";
import { requestSpeech } from "./api.js";
import { NS, en, zh } from "./locales.js";
import { TtsSettingsSection } from "./SettingsSection.js";
import { SpeakAction } from "./SpeakAction.js";
import { TtsSettingsController } from "./settings-controller.js";
import { ensureTtsStatus, ttsStatusStore } from "./status.js";
import { injectStyles } from "./styles.js";
/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'configForms'];
/**
 * Mount the speak entries and the speech-synthesis settings page.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx) {
    ctx.effect(() => injectStyles(), 'dsh-mimotts: styles');
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-mimotts: dictionaries');
    const t = ctx.locale.bind(NS);
    const controller = new TtsSettingsController(ctx.configForms.get(MIMOTTS_NAMESPACE));
    ctx.effect(() => () => { controller.dispose(); }, 'dsh-mimotts: settings form');
    // The page exists only while the Host serves this plugin's namespace, so a
    // deployment without the plugin shows no trace of it.
    ctx.effect(() => ctx.configForms.whileServed([MIMOTTS_NAMESPACE], () => ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'mimotts',
        order: 20,
        label: () => t('nav'),
        locale: NS,
        inject: () => controller.inject(),
    }, TtsSettingsSection))), 'dsh-mimotts: settings page');
    ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
        name: 'conversation.chat.assistant-actions',
        id: 'mimotts',
        order: 20,
        locale: NS,
        inject: () => ({
            hooks: { status: ttsStatusStore() },
            ensureStatus: () => { void ensureTtsStatus(); },
            synthesize: requestSpeech,
        }),
    }, SpeakAction));
}
//# sourceMappingURL=index.js.map