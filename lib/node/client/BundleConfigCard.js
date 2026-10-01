import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The plugin's configuration card on the Plugins page: registered into the
 * `plugins.bundle.config` keyed slot (key = the npm package name), it renders
 * inside the bundle's detail page between its description and its rows. The
 * write-only API key (stored through the host credentials store), the MiMo
 * endpoint, model, voice (preset dropdown or clone sample), default style,
 * request budget — plus a sample player that previews the card's current
 * style and voice, including edits not yet saved.
 *
 * The card renders the shared settings form frame, so saving, discarding,
 * override badges, and read-only/unavailable handling follow the platform's
 * configuration-form conventions exactly. The Plugins page dispatches this
 * slot with `view: 'page'` only, but the entry stays honest about it.
 * @module dsh-mimotts/client/BundleConfigCard
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { SettingsForm, SettingsSecretField, SettingsValueField, } from '@deepseek-ai/dsh-client-ui-primitives';
import { AUDITION_TEXT, DEFAULT_VOICE } from "../settings.js";
import { TtsClientError } from "./api.js";
import { errorKeyFor } from "./SpeakAction.js";
import { PlayerBar } from "./PlayerBar.js";
import { useAudioPlayer } from "./use-audio-player.js";
/**
 * The official preset voices of `mimo-v2.5-tts` (Xiaomi MiMo speech-synthesis
 * docs, 预置音色列表). The voice id is what the API's `audio.voice` takes;
 * the display name is the docs' naming.
 */
const PRESET_VOICES = [
    { id: 'mimo_default', name: 'MiMo-默认' },
    { id: '冰糖', name: '冰糖' },
    { id: '茉莉', name: '茉莉' },
    { id: '苏打', name: '苏打' },
    { id: '白桦', name: '白桦' },
    { id: 'Mia', name: 'Mia' },
    { id: 'Chloe', name: 'Chloe' },
    { id: 'Milo', name: 'Milo' },
    { id: 'Dean', name: 'Dean' },
];
/**
 * Render the plugin's configuration card.
 * @param props - localized copy, the staged form snapshot, and its actions.
 * @returns the configuration form with its sample player, or null for a view
 * this slot does not render (bundle configuration is page-only).
 */
export function BundleConfigCard({ view, useForm, edit, resetField, save, discard, synthesize, t }) {
    const state = useForm(snapshot => snapshot);
    const [sampleUrl, setSampleUrl] = useState(null);
    const [busy, setBusy] = useState(false);
    const [failure, setFailure] = useState(null);
    const player = useAudioPlayer(sampleUrl);
    const toggle = player.toggle;
    const autoplay = useRef(false);
    const sampleRef = useRef(null);
    sampleRef.current = sampleUrl;
    // Release the sample object URL when the page closes.
    useEffect(() => () => {
        if (sampleRef.current !== null)
            URL.revokeObjectURL(sampleRef.current);
    }, []);
    useEffect(() => {
        if (sampleUrl === null || !autoplay.current)
            return;
        autoplay.current = false;
        toggle();
    }, [sampleUrl, toggle]);
    const audition = useCallback(() => {
        if (busy)
            return;
        setBusy(true);
        setFailure(null);
        void synthesize({
            text: AUDITION_TEXT,
            style: state.style.text.trim() === '' ? undefined : state.style.text,
            voice: state.voice.text.trim() === '' ? undefined : state.voice.text,
        }).then((blob) => {
            autoplay.current = true;
            setBusy(false);
            setSampleUrl((previous) => {
                if (previous !== null)
                    URL.revokeObjectURL(previous);
                return URL.createObjectURL(blob);
            });
        }).catch((error) => {
            setBusy(false);
            setFailure(error instanceof TtsClientError ? error : new TtsClientError('generic', String(error)));
        });
    }, [busy, state.style.text, state.voice.text, synthesize]);
    if (view !== 'page')
        return null;
    const disabled = !state.writable;
    const failureKey = failure === null ? null : errorKeyFor(failure);
    // A blank draft inherits the preset default, so the dropdown shows it; a
    // hand-edited custom voice outside the official list stays selectable.
    const voiceDraft = state.voice.text.trim() === '' ? DEFAULT_VOICE : state.voice.text;
    const customVoice = PRESET_VOICES.some(voice => voice.id === voiceDraft)
        ? null
        : voiceDraft;
    return (_jsxs(SettingsForm, { labels: {
            unavailable: t('unavailable'),
            readOnly: t('readOnly'),
            saveFailed: t('saveFailed'),
            save: t('save'),
            saving: t('saving'),
        }, state: state, onSave: save, onDiscard: discard, children: [_jsx(SettingsSecretField, { id: "mimotts-api-key", label: t('apiKey'), hint: t('apiKeyHint'), text: state.apiKey.text, disabled: disabled, configured: state.apiKeyConfigured, stateLabel: state.apiKeyConfigured ? t('apiKeySet') : t('apiKeyUnset'), onEdit: (text) => { edit('apiKey', text); } }), _jsx("p", { className: "mimotts-auditionHint", role: "status", style: { marginTop: -6 }, children: state.apiKeyEnv !== undefined && state.apiKeyEnv.trim() !== ''
                    ? `${t('apiKeyRef')} ${state.apiKeyEnv}`
                    : t('apiKeyRefDefault') }), _jsx(SettingsValueField, { id: "mimotts-base-url", label: t('baseUrl'), hint: t('baseUrlHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.baseUrl, onEdit: (text) => { edit('baseUrl', text); }, onReset: () => { resetField('baseUrl'); } }), _jsx(SettingsValueField, { id: "mimotts-model", label: t('model'), hint: t('modelHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.model, onEdit: (text) => { edit('model', text); }, onReset: () => { resetField('model'); } }), _jsxs("div", { className: "mimotts-selectField", children: [_jsx("label", { className: "mimotts-selectLabel", htmlFor: "mimotts-voice-select", children: t('voice') }), _jsxs("select", { id: "mimotts-voice-select", className: "mimotts-select", disabled: disabled, value: voiceDraft, onChange: (event) => { edit('voice', event.target.value); }, children: [PRESET_VOICES.map(voice => (_jsx("option", { value: voice.id, children: voice.id === DEFAULT_VOICE ? `${voice.name}（默认）` : voice.name }, voice.id))), customVoice !== null ? _jsx("option", { value: customVoice, children: customVoice }) : null] }), _jsx("p", { className: "mimotts-auditionHint", children: t('voiceHint') })] }), _jsx(SettingsValueField, { id: "mimotts-voice-sample", label: t('voiceSamplePath'), hint: t('voiceSamplePathHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.voiceSamplePath, onEdit: (text) => { edit('voiceSamplePath', text); }, onReset: () => { resetField('voiceSamplePath'); } }), _jsx(SettingsValueField, { id: "mimotts-style", label: t('style'), hint: t('styleHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.style, onEdit: (text) => { edit('style', text); }, onReset: () => { resetField('style'); } }), _jsx(SettingsValueField, { id: "mimotts-max-chars", label: t('maxChars'), hint: t('maxCharsHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), numeric: true, disabled: disabled, ...state.maxChars, onEdit: (text) => { edit('maxChars', text); }, onReset: () => { resetField('maxChars'); } }), _jsx(SettingsValueField, { id: "mimotts-timeout", label: t('timeoutMs'), hint: t('timeoutMsHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), numeric: true, disabled: disabled, ...state.timeoutMs, onEdit: (text) => { edit('timeoutMs', text); }, onReset: () => { resetField('timeoutMs'); } }), _jsxs("div", { className: "mimotts-audition", children: [_jsx("p", { className: "mimotts-auditionHint", children: t('auditionHint') }), _jsxs("div", { className: "mimotts-auditionRow", children: [_jsx("button", { type: "button", className: "mimotts-auditionButton", disabled: busy, onClick: audition, children: busy ? t('auditioning') : t('audition') }), sampleUrl !== null
                                ? (_jsx(PlayerBar, { state: player.state, onToggle: player.toggle, onSeek: player.seek, labels: { play: t('play'), pause: t('pause'), progress: t('progress') } }))
                                : null] }), failureKey !== null ? _jsx("p", { className: "mimotts-fieldError", role: "status", children: t(failureKey) }) : null] })] }));
}
//# sourceMappingURL=BundleConfigCard.js.map