/**
 * The staged settings form behind the Plugins-page configuration card: one
 * `SettingsFormModel` over the `mimotts` configuration namespace. The API key
 * is a write-only control outside the section: a typed key stores through the
 * host's `credentials/set` remote under the configured reference (`apiKeyEnv`,
 * a section field the card reads but never renders as an input), and the card
 * learns only whether one resolves, through the Host's status route.
 * @module dsh-mimotts/client/settings-controller
 */
import { SettingsFormModel, settingsNumberField, settingsTextField, } from '@deepseek-ai/dsh-client-ui-primitives';
import { requestSpeech } from "./api.js";
import { refreshTtsStatus, ttsStatusStore } from "./status.js";
/** Form field name of the write-only API key control (not a section field). */
const API_KEY_CONTROL = 'apiKey';
/** Section fields the card edits; `apiKeyEnv` stays a read-only ref name. */
const SECTION_SPECS = [
    settingsTextField('baseUrl'),
    settingsTextField('model'),
    settingsTextField('voice'),
    settingsTextField('voiceSamplePath'),
    settingsTextField('style'),
    settingsNumberField('maxChars'),
    settingsNumberField('timeoutMs'),
];
/**
 * Bridges the `mimotts` configuration namespace onto the Plugins-page card.
 * @param scope - the bound settings scope for the `mimotts` namespace.
 * @param setCredential - stores a key in the host credentials store.
 */
export class TtsSettingsController {
    scope;
    setCredential;
    form;
    store;
    unsubscribeStatus;
    status = ttsStatusStore();
    constructor(scope, setCredential) {
        this.scope = scope;
        this.setCredential = setCredential;
        this.form = new SettingsFormModel(scope, SECTION_SPECS, [{
                field: API_KEY_CONTROL,
                write: text => this.writeApiKey(text),
            }]);
        this.store = this.form.bind(() => this.projection());
        // The status mirror answers "is a key configured", which the form section
        // cannot: secrets never ride a response. Its changes republish the card.
        this.unsubscribeStatus = this.status.subscribe(() => { this.store.set(this.projection()); });
        void refreshTtsStatus();
    }
    /**
     * Build the face the card's slot registration injects.
     * @returns the card's snapshot and its form actions.
     */
    inject() {
        const actions = this.form.actions();
        return {
            hooks: { form: this.store },
            edit: (field, text) => { actions.edit(field, text); },
            resetField: (field) => { actions.resetField(field); },
            save: () => { actions.save(); },
            discard: () => { actions.discard(); },
            synthesize: request => requestSpeech(request),
        };
    }
    /** Release form and status subscriptions. */
    dispose() {
        this.unsubscribeStatus();
        this.form.dispose();
    }
    /**
     * Store one typed key under the section's credential reference. A blank
     * draft never reaches here (the form model writes nothing for it); a
     * successful write refreshes the status mirror, so the configured flag
     * follows immediately.
     * @param text - the literal API key as typed.
     * @returns whether the host accepted the write.
     */
    async writeApiKey(text) {
        const ref = (this.scope.getSnapshot().value?.apiKeyEnv ?? '').trim();
        if (ref === '')
            return false;
        const ok = await this.setCredential(ref, text.trim());
        if (ok)
            void refreshTtsStatus();
        return ok;
    }
    /** @returns the card projection rebuilt from the form and the status mirror. */
    projection() {
        return {
            ...this.form.shell(),
            apiKey: this.form.field(API_KEY_CONTROL),
            apiKeyConfigured: this.status.getSnapshot().configured,
            apiKeyEnv: this.scope.getSnapshot().value?.apiKeyEnv,
            baseUrl: this.form.field('baseUrl'),
            model: this.form.field('model'),
            voice: this.form.field('voice'),
            voiceSamplePath: this.form.field('voiceSamplePath'),
            style: this.form.field('style'),
            maxChars: this.form.field('maxChars'),
            timeoutMs: this.form.field('timeoutMs'),
        };
    }
}
//# sourceMappingURL=settings-controller.js.map