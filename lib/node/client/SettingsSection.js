import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The `语音合成` settings page: the MiMo endpoint, model, voice (preset or
 * clone sample), default style, request budget, and the write-only API key —
 * plus a sample player that previews the page's current style and voice,
 * including edits not yet saved.
 *
 * The page renders the shared settings form frame, so saving, discarding,
 * override badges, and read-only/unavailable handling follow the platform's
 * configuration-form conventions exactly.
 * @module dsh-mimotts/client/SettingsSection
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { SettingsForm, SettingsSecretField, SettingsValueField, } from '@deepseek-ai/dsh-client-ui-primitives';
import { AUDITION_TEXT } from "../settings.js";
import { TtsClientError } from "./api.js";
import { errorKeyFor } from "./SpeakAction.js";
import { PlayerBar } from "./PlayerBar.js";
import { useAudioPlayer } from "./use-audio-player.js";
/**
 * Render the speech-synthesis settings page.
 * @param props - localized copy, the staged form snapshot, and its actions.
 * @returns the settings form with its sample player.
 */
export function TtsSettingsSection({ useForm, edit, resetField, save, discard, synthesize, t }) {
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
    const disabled = !state.writable;
    const failureKey = failure === null ? null : errorKeyFor(failure);
    return (_jsxs(SettingsForm, { labels: {
            unavailable: t('unavailable'),
            readOnly: t('readOnly'),
            saveFailed: t('saveFailed'),
            save: t('save'),
            saving: t('saving'),
        }, state: state, onSave: save, onDiscard: discard, children: [_jsx(SettingsSecretField, { id: "mimotts-api-key", label: t('apiKey'), hint: t('apiKeyHint'), disabled: disabled, text: state.apiKey.text, configured: state.apiKey.configured, stateLabel: state.apiKey.configured ? t('apiKeySet') : t('apiKeyUnset'), onEdit: (text) => { edit('apiKey', text); } }), _jsx(SettingsValueField, { id: "mimotts-base-url", label: t('baseUrl'), hint: t('baseUrlHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.baseUrl, onEdit: (text) => { edit('baseUrl', text); }, onReset: () => { resetField('baseUrl'); } }), _jsx(SettingsValueField, { id: "mimotts-model", label: t('model'), hint: t('modelHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.model, onEdit: (text) => { edit('model', text); }, onReset: () => { resetField('model'); } }), _jsx(SettingsValueField, { id: "mimotts-voice", label: t('voice'), hint: t('voiceHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.voice, onEdit: (text) => { edit('voice', text); }, onReset: () => { resetField('voice'); } }), _jsx(SettingsValueField, { id: "mimotts-voice-sample", label: t('voiceSamplePath'), hint: t('voiceSamplePathHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.voiceSamplePath, onEdit: (text) => { edit('voiceSamplePath', text); }, onReset: () => { resetField('voiceSamplePath'); } }), _jsx(SettingsValueField, { id: "mimotts-style", label: t('style'), hint: t('styleHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), disabled: disabled, ...state.style, onEdit: (text) => { edit('style', text); }, onReset: () => { resetField('style'); } }), _jsx(SettingsValueField, { id: "mimotts-max-chars", label: t('maxChars'), hint: t('maxCharsHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), numeric: true, disabled: disabled, ...state.maxChars, onEdit: (text) => { edit('maxChars', text); }, onReset: () => { resetField('maxChars'); } }), _jsx(SettingsValueField, { id: "mimotts-timeout", label: t('timeoutMs'), hint: t('timeoutMsHint'), overriddenLabel: t('overridden'), resetLabel: t('reset'), invalidLabel: t('invalidNumber'), numeric: true, disabled: disabled, ...state.timeoutMs, onEdit: (text) => { edit('timeoutMs', text); }, onReset: () => { resetField('timeoutMs'); } }), _jsxs("div", { className: "mimotts-audition", children: [_jsx("p", { className: "mimotts-auditionHint", children: t('auditionHint') }), _jsxs("div", { className: "mimotts-auditionRow", children: [_jsx("button", { type: "button", className: "mimotts-auditionButton", disabled: busy, onClick: audition, children: busy ? t('auditioning') : t('audition') }), sampleUrl !== null
                                ? (_jsx(PlayerBar, { state: player.state, onToggle: player.toggle, onSeek: player.seek, labels: { play: t('play'), pause: t('pause'), progress: t('progress') } }))
                                : null] }), failureKey !== null ? _jsx("p", { className: "mimotts-fieldError", role: "status", children: t(failureKey) }) : null] })] }));
}
//# sourceMappingURL=SettingsSection.js.map