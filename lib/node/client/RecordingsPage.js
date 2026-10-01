import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The `语音历史` settings page: every read-aloud recording, each with its
 * versions for in-place playback, re-synthesis, and deletion. Configuration
 * lives on the Plugins page's bundle card (`plugins.bundle.config`); this
 * page owns the feature surface instead.
 * @module dsh-mimotts/client/RecordingsPage
 */
import { RecordingsList } from "./RecordingsList.js";
/**
 * Render the speech-history settings page.
 * @param props - localized copy.
 * @returns the recordings list with its heading and hint.
 */
export function RecordingsPage({ t }) {
    return (_jsxs("div", { className: "mimotts-recordingsPage", children: [_jsx("h3", { className: "mimotts-recordingsTitle", children: t('recordings') }), _jsx("p", { className: "mimotts-recordingsHintText", children: t('recordingsHint') }), _jsx(RecordingsList, { t: t })] }));
}
//# sourceMappingURL=RecordingsPage.js.map