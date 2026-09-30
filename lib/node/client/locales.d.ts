/**
 * Locale bundles for the MiMo TTS plugin: the speak entry under each finalized
 * assistant message, its player, and the `语音合成` settings page.
 * @module dsh-mimotts/client/locales
 */
/** Dictionary namespace owned by this plugin. */
export declare const NS = "settings.mimotts";
/** Locale keys this plugin renders. */
export type MimottsLocaleKey = 'nav' | 'speak' | 'synthesize' | 'playing' | 'paused' | 'play' | 'pause' | 'progress' | 'notConfigured' | 'emptyText' | 'truncated' | 'error.notConfigured' | 'error.badRequest' | 'error.timeout' | 'error.upstream' | 'error.invalidAudio' | 'error.voiceSample' | 'error.generic' | 'audition' | 'auditioning' | 'auditionHint' | 'apiKey' | 'apiKeyHint' | 'apiKeySet' | 'apiKeyUnset' | 'baseUrl' | 'baseUrlHint' | 'model' | 'modelHint' | 'voice' | 'voiceHint' | 'voiceSamplePath' | 'voiceSamplePathHint' | 'style' | 'styleHint' | 'maxChars' | 'maxCharsHint' | 'timeoutMs' | 'timeoutMsHint' | 'overridden' | 'reset' | 'invalidNumber' | 'readOnly' | 'unavailable' | 'save' | 'saving' | 'saveFailed' | 'recordings' | 'recordingsEmpty' | 'recordingsHint' | 'reSynthesize' | 'reSynthesizing' | 'deleteVersion';
/** English copy. */
export declare const en: Record<MimottsLocaleKey, string>;
/** Simplified Chinese copy. */
export declare const zh: Record<MimottsLocaleKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** MiMo TTS speak entry, player, and settings page copy. */
        'settings.mimotts': MimottsLocaleKey;
    }
}
