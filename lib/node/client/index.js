/**
 * MiMo TTS speech synthesis, browser half.
 *
 * Three contributions, all registered through the typed slot system:
 * - `plugins.bundle.config` (keyed by the npm package name): the plugin's
 *   configuration card on the Plugins page, mounted on the bundle's detail
 *   page — the official seat for a bundle's own configuration;
 * - `settings.section`: the `语音历史` page (recorded speech, versions,
 *   re-synthesis), mounted while the Host serves this plugin's `mimotts`
 *   configuration namespace;
 * - `conversation.chat.assistant-actions`: the volume button under every
 *   finalized assistant message, with its floating player (draggable progress
 *   bar) once audio exists.
 *
 * Neither entry owns business state: configuration flows through
 * `ctx.configForms` (`mimotts` namespace), synthesis through the Host's
 * `/api/mimotts` routes, text from the Conversation binding through `useChat`,
 * and copy through `ctx.locale`.
 * @module dsh-mimotts/client
 */
import { MIMOTTS_NAMESPACE, MIMOTTS_PACKAGE_KEY } from "../settings.js";
import { BundleConfigCard } from "./BundleConfigCard.js";
import { requestSpeech } from "./api.js";
import { NS, en, zh } from "./locales.js";
import { RecordingsPage } from "./RecordingsPage.js";
import { SpeakAction } from "./SpeakAction.js";
import { TtsSettingsController } from "./settings-controller.js";
import { ensureTtsStatus, ttsStatusStore } from "./status.js";
import { injectStyles } from "./styles.js";
/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'configForms'];
/**
 * Mount the speak entries, the Plugins-page configuration card, and the
 * speech-history settings page.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx) {
    ctx.effect(() => injectStyles(), 'dsh-mimotts: styles');
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-mimotts: dictionaries');
    const t = ctx.locale.bind(NS);
    const controller = new TtsSettingsController(ctx.configForms.get(MIMOTTS_NAMESPACE));
    ctx.effect(() => () => { controller.dispose(); }, 'dsh-mimotts: settings form');
    // The configuration card and the history page both edit or read the
    // plugin's configuration namespace, so they exist only while the Host
    // serves it — a deployment without the plugin shows no trace of either.
    ctx.effect(() => ctx.configForms.whileServed([MIMOTTS_NAMESPACE], () => {
        // Keyed by the package name: the Plugins page dispatches
        // `plugins.bundle.config` with `entryKey: pkg.name`.
        const offCard = ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
            name: 'plugins.bundle.config',
            key: MIMOTTS_PACKAGE_KEY,
            locale: NS,
            inject: () => controller.inject(),
        }, BundleConfigCard));
        const offPage = ctx.slots.inject('settings.section', () => ctx.slots.register({
            name: 'settings.section',
            id: 'mimotts',
            order: 20,
            label: () => t('nav'),
            locale: NS,
        }, RecordingsPage));
        return () => { offPage(); offCard(); };
    }), 'dsh-mimotts: plugins-page card and history page');
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