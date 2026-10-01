/**
 * The staged settings form behind the `语音合成` page: one `SettingsFormModel`
 * over the `mimotts` configuration namespace. The API key is addressed by a
 * credential reference (`apiKeyEnv`) — an ordinary, non-secret field; the
 * literal key lives in the host credentials store, and the page learns only
 * whether one resolves, through the Host's status route.
 * @module dsh-mimotts/client/settings-controller
 */
import { SettingsFormModel, settingsNumberField, settingsTextField, } from '@deepseek-ai/dsh-client-ui-primitives';
import { requestSpeech } from "./api.js";
import { refreshTtsStatus, ttsStatusStore } from "./status.js";
/** Bridges the `mimotts` configuration namespace onto the settings page. */
export class TtsSettingsController {
    scope;
    form;
    store;
    unsubscribeStatus;
    status = ttsStatusStore();
    /**
     * @param scope - the bound settings scope for the `mimotts` namespace.
     */
    constructor(scope) {
        this.scope = scope;
        this.form = new SettingsFormModel(scope, [
            settingsTextField('apiKeyEnv'),
            settingsTextField('baseUrl'),
            settingsTextField('model'),
            settingsTextField('voice'),
            settingsTextField('voiceSamplePath'),
            settingsTextField('style'),
            settingsNumberField('maxChars'),
            settingsNumberField('timeoutMs'),
        ]);
        this.store = this.form.bind(() => this.projection());
        // The status mirror answers "is a key configured", which the form section
        // cannot: secrets never ride a response. Its changes republish the page.
        this.unsubscribeStatus = this.status.subscribe(() => { this.store.set(this.projection()); });
        void refreshTtsStatus();
    }
    /**
     * Build the face the page's slot registration injects.
     * @returns the page's snapshot and its form actions.
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
    /** @returns the page projection rebuilt from the form and the status mirror. */
    projection() {
        return {
            ...this.form.shell(),
            apiKeyEnv: this.form.field('apiKeyEnv'),
            apiKeyConfigured: this.status.getSnapshot().configured,
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