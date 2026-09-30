import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The speech-history browser: every recorded text, each with its versions.
 * Versions play in place, re-synthesize against the current engine settings
 * (appending a fresh take, old ones kept), or get deleted. There is no
 * dedicated comparison view — per the design, each take is played on its own.
 * @module dsh-mimotts/client/RecordingsList
 */
import { useCallback, useEffect, useState } from 'react';
import { deleteRecordingVersion, fetchRecordings, recordingFileUrl, resynthesizeRecording, TtsClientError, } from "./api.js";
/**
 * Render the persisted speech history with per-version playback, re-synthesis,
 * and deletion.
 * @param props - localized copy.
 * @returns the history list, or an empty-state note before the first load.
 */
export function RecordingsList({ t }) {
    const [index, setIndex] = useState(null);
    const [error, setError] = useState(null);
    const [busyRec, setBusyRec] = useState(null);
    const load = useCallback(() => {
        setError(null);
        fetchRecordings()
            .then(setIndex)
            .catch((failure) => setError(failure instanceof Error ? failure.message : String(failure)));
    }, []);
    useEffect(() => { load(); }, [load]);
    const onResynth = useCallback((recId) => {
        setBusyRec(recId);
        resynthesizeRecording(recId)
            .then(load)
            .catch((failure) => setError(failure instanceof TtsClientError ? failure.message : String(failure)))
            .finally(() => setBusyRec(null));
    }, [load]);
    const onDelete = useCallback((recId, verId) => {
        deleteRecordingVersion(recId, verId)
            .then(load)
            .catch((failure) => setError(failure instanceof TtsClientError ? failure.message : String(failure)));
    }, [load]);
    if (index === null || index.entries.length === 0) {
        return _jsx("p", { className: "mimotts-recordingsEmpty", children: t('recordingsEmpty') });
    }
    return (_jsxs("div", { className: "mimotts-recordings", children: [error !== null ? _jsx("p", { className: "mimotts-fieldError", role: "status", children: error }) : null, index.entries.map((entry) => (_jsxs("div", { className: "mimotts-recording", children: [_jsx("p", { className: "mimotts-recordingText", title: entry.text, children: entry.text }), _jsx("ul", { className: "mimotts-versions", children: entry.versions.map((version) => (_jsxs("li", { className: "mimotts-version", children: [_jsx("audio", { className: "mimotts-versionAudio", src: recordingFileUrl(entry.id, version.id), controls: true, preload: "none" }), _jsxs("span", { className: "mimotts-versionMeta", children: [new Date(version.createdAt).toLocaleString(), version.voice !== null ? ` · ${version.voice}` : '', version.style !== null ? ` · ${version.style}` : ''] }), _jsx("button", { type: "button", className: "mimotts-recButton", disabled: busyRec === entry.id, onClick: () => { onResynth(entry.id); }, children: busyRec === entry.id ? t('reSynthesizing') : t('reSynthesize') }), _jsx("button", { type: "button", className: "mimotts-recButton", onClick: () => { onDelete(entry.id, version.id); }, children: t('deleteVersion') })] }, version.id))) })] }, entry.id)))] }));
}
//# sourceMappingURL=RecordingsList.js.map