import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The compact player bar: play/pause, a draggable progress track, and the
 * position/duration readout.
 *
 * The track is a `role="slider"` surface — pointer drag with capture,
 * click-to-seek, and arrow-key seeking — so the progress bar is operable
 * without a pointer. Dragging seeks continuously: WAV playback from an object
 * URL repositions cheaply, and the thumb follows the pointer instead of
 * lagging behind it.
 * @module dsh-mimotts/client/PlayerBar
 */
import { useCallback, useRef, useState } from 'react';
import { IconPauseOutlineRegular, IconPlayOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives';
/** Format seconds as `m:ss` (clamped at zero; durations are short). */
function clock(seconds) {
    const whole = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(whole / 60);
    const remainder = whole % 60;
    return `${String(minutes)}:${remainder < 10 ? '0' : ''}${String(remainder)}`;
}
/**
 * Render one player bar.
 * @param props - playback state, controls, and localized names.
 * @returns the play control, the seekable track, and the time readout.
 */
export function PlayerBar({ state, onToggle, onSeek, labels }) {
    const trackRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const duration = state.duration > 0 ? state.duration : 0;
    const ratio = duration > 0 ? Math.min(1, state.currentTime / duration) : 0;
    /** @param clientX - pointer x in viewport coordinates. @returns the seek target in seconds. */
    const positionAt = useCallback((clientX) => {
        const track = trackRef.current;
        if (track === null)
            return 0;
        const bounds = track.getBoundingClientRect();
        const fraction = bounds.width > 0
            ? Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width))
            : 0;
        return fraction * duration;
    }, [duration]);
    return (_jsxs("div", { className: "mimotts-bar", children: [_jsx("button", { type: "button", className: "mimotts-barButton", "aria-label": state.playing ? labels.pause : labels.play, onClick: onToggle, children: state.playing ? _jsx(IconPauseOutlineRegular, { size: 14 }) : _jsx(IconPlayOutlineRegular, { size: 14 }) }), _jsxs("div", { ref: trackRef, className: dragging ? 'mimotts-track mimotts-trackDragging' : 'mimotts-track', role: "slider", tabIndex: 0, "aria-label": labels.progress, "aria-valuemin": 0, "aria-valuemax": Math.max(0, Math.round(duration)), "aria-valuenow": Math.round(state.currentTime), "aria-valuetext": `${clock(state.currentTime)} / ${clock(duration)}`, onPointerDown: (event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragging(true);
                    onSeek(positionAt(event.clientX));
                }, onPointerMove: (event) => {
                    if (!dragging)
                        return;
                    onSeek(positionAt(event.clientX));
                }, onPointerUp: (event) => {
                    if (!dragging)
                        return;
                    setDragging(false);
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    onSeek(positionAt(event.clientX));
                }, onPointerCancel: () => { setDragging(false); }, onKeyDown: (event) => {
                    const step = event.shiftKey ? 15 : 5;
                    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        onSeek(state.currentTime + step);
                    }
                    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                        event.preventDefault();
                        onSeek(state.currentTime - step);
                    }
                    else if (event.key === 'Home') {
                        event.preventDefault();
                        onSeek(0);
                    }
                    else if (event.key === 'End' && duration > 0) {
                        event.preventDefault();
                        onSeek(duration);
                    }
                }, children: [_jsx("div", { className: "mimotts-fill", style: { width: `${(ratio * 100).toFixed(2)}%` } }), _jsx("div", { className: "mimotts-thumb", style: { left: `${(ratio * 100).toFixed(2)}%` } })] }), _jsxs("span", { className: "mimotts-time", children: [clock(state.currentTime), " / ", clock(duration)] })] }));
}
//# sourceMappingURL=PlayerBar.js.map