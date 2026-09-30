/**
 * The staged settings form behind the `语音合成` page: one `SettingsFormModel`
 * over the `mimotts` configuration namespace, plus the write-only API-key
 * control (the literal is a `role('secret')` field — it never rides a form
 * response, so the page learns only whether one is configured, through the
 * Host's status route).
 * @module dsh-mimotts/client/settings-controller
 */
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type { SettingsFieldState, SettingsFormScope, SettingsFormShell } from '@deepseek-ai/dsh-client-ui-primitives';
import type { TtsSettings, TtsSynthesizeRequest } from '../settings.ts';
/** Field names inside the `mimotts` settings section. */
export type TtsSettingsField = keyof TtsSettings;
/** Synthesis verb shared by the settings page and the speak entries. */
export type TtsSettingsSynthesize = (request: TtsSynthesizeRequest) => Promise<Blob>;
/** What the settings page renders. */
export interface TtsSettingsState extends SettingsFormShell {
    /** The staged key plus whether the Host holds one. */
    apiKey: SettingsFieldState & {
        configured: boolean;
    };
    /** Endpoint base. */
    baseUrl: SettingsFieldState;
    /** Model id. */
    model: SettingsFieldState;
    /** Preset voice. */
    voice: SettingsFieldState;
    /** Host-local voice-clone sample path. */
    voiceSamplePath: SettingsFieldState;
    /** Default speaking style. */
    style: SettingsFieldState;
    /** Character budget. */
    maxChars: SettingsFieldState;
    /** Round-trip timeout. */
    timeoutMs: SettingsFieldState;
}
/** The registration-side face the settings page's slot entry injects. */
export interface TtsSettingsInjected {
    hooks: {
        /** Page snapshot bound by the renderer as useForm. */
        form: SnapshotStore<TtsSettingsState>;
    };
    /** Stage draft text for one field. */
    edit: (field: TtsSettingsField, text: string) => void;
    /** Stage a clear so the field re-inherits the schema default. */
    resetField: (field: TtsSettingsField) => void;
    /** Write every staged edit. */
    save: () => void;
    /** Drop every staged edit. */
    discard: () => void;
    /** @see TtsSettingsSynthesize */
    synthesize: TtsSettingsSynthesize;
}
/** Bridges the `mimotts` configuration namespace onto the settings page. */
export declare class TtsSettingsController {
    private readonly scope;
    private readonly form;
    private readonly store;
    private readonly unsubscribeStatus;
    private readonly status;
    /**
     * @param scope - the bound settings scope for the `mimotts` namespace.
     */
    constructor(scope: SettingsFormScope<TtsSettings>);
    /**
     * Build the face the page's slot registration injects.
     * @returns the page's snapshot and its form actions.
     */
    inject(): TtsSettingsInjected;
    /** Release form and status subscriptions. */
    dispose(): void;
    /**
     * Write the staged key through the settings namespace's mutate path, then
     * re-read whether the Host now holds one.
     * @param text - the staged key literal.
     * @returns whether the Host accepted the write.
     */
    private writeApiKey;
    /** @returns the page projection rebuilt from the form and the status mirror. */
    private projection;
}
