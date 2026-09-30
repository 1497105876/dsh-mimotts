/**
 * The staged settings form behind the `语音合成` page: one `SettingsFormModel`
 * over the `mimotts` configuration namespace, plus the write-only API-key
 * control (the literal is a `role('secret')` field — it never rides a form
 * response, so the page learns only whether one is configured, through the
 * Host's status route).
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
            settingsTextField('baseUrl'),
            settingsTextField('model'),
            settingsTextField('voice'),
            settingsTextField('voiceSamplePath'),
            settingsTextField('style'),
            settingsNumberField('maxChars'),
            settingsNumberField('timeoutMs'),
        ], [{ field: 'apiKey', write: text => this.writeApiKey(text) }]);
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
    /**
     * Write the staged key through the settings namespace's mutate path, then
     * re-read whether the Host now holds one.
     * @param text - the staged key literal.
     * @returns whether the Host accepted the write.
     */
    async writeApiKey(text) {
        const accepted = await this.scope.mutate([{ op: 'set', path: ['apiKey'], value: text }], this.scope.getSnapshot().revision);
        await refreshTtsStatus();
        return accepted;
    }
    /** @returns the page projection rebuilt from the form and the status mirror. */
    projection() {
        return {
            ...this.form.shell(),
            apiKey: { ...this.form.field('apiKey'), configured: this.status.getSnapshot().configured },
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