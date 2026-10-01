/**
 * Plugin-owned stylesheet.
 *
 * The in-repo client bundles compile CSS Modules through their tsdown preset;
 * this out-of-tree plugin keeps one plain stylesheet and injects it with the
 * same shape the platform's own bundle loader uses (a `data-plugin-css` style
 * tag owned by the plugin's effect lifetime). Class names are namespaced
 * `mimotts-`, and colors/radii ride the shared `--dsw-*` design tokens so both
 * themes stay correct without owning theme state.
 * @module dsh-mimotts/client/styles
 */
/** The plugin's stylesheet text. */
export const CSS = `
.mimotts-root { position: relative; display: inline-flex; align-items: center; }

.mimotts-button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; padding: 6px;
  border: none; border-radius: var(--dsw-radius-sm);
  background: transparent; color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.mimotts-button:hover { background: var(--dsw-alias-interactive-bg-hover); }
.mimotts-button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.mimotts-button[aria-pressed="true"] { color: var(--dsw-alias-brand-primary); }

.mimotts-failure {
  display: inline-flex; align-items: center; color: var(--dsw-alias-label-error);
  cursor: default;
}

.mimotts-spin { display: inline-flex; animation: mimotts-spin 1.1s linear infinite; }
@keyframes mimotts-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.mimotts-panel {
  position: absolute; top: 50%; left: 100%; transform: translateY(-50%); margin-left: 4px; z-index: 40;
  display: block; width: 280px; padding: 8px 10px;
  background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.mimotts-bar { display: flex; align-items: center; gap: 8px; height: 24px; }

.mimotts-barButton {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; padding: 0;
  border: none; border-radius: var(--dsw-radius-xs);
  background: transparent; color: var(--dsw-alias-label-primary);
  cursor: pointer;
}
.mimotts-barButton:hover { background: var(--dsw-alias-interactive-bg-hover); }

.mimotts-track {
  position: relative; flex: 1 1 auto; height: 14px; cursor: pointer;
  display: flex; align-items: center; touch-action: none;
}
.mimotts-track::before {
  content: ""; position: absolute; left: 0; right: 0; height: 4px;
  background: var(--dsw-alias-border-l3); border-radius: 2px;
}
.mimotts-track:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; border-radius: var(--dsw-radius-xs); }

.mimotts-fill {
  position: absolute; left: 0; height: 4px; max-width: 100%;
  background: var(--dsw-alias-brand-primary); border-radius: 2px;
}

.mimotts-thumb {
  position: absolute; width: 10px; height: 10px; margin-left: -5px;
  background: var(--dsw-alias-brand-primary); border-radius: 50%;
  box-shadow: 0 0 0 2px var(--dsw-alias-bg-layer-2);
}
.mimotts-trackDragging .mimotts-thumb { transform: scale(1.2); }

.mimotts-time {
  flex: 0 0 auto; font-size: 11px; line-height: 1;
  color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.mimotts-audition { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.mimotts-auditionHint {
  margin: 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary);
}
.mimotts-auditionRow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.mimotts-auditionRow .mimotts-bar { flex: 1 1 220px; min-width: 180px; }
.mimotts-auditionButton {
  height: 28px; padding: 0 14px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-button-tool-bar-fill);
  color: var(--dsw-alias-label-primary);
  font-size: 12px; cursor: pointer;
}
.mimotts-auditionButton:hover:not(:disabled) { background: var(--dsw-alias-button-tool-bar-hover); }
.mimotts-auditionButton:disabled { opacity: 0.6; cursor: default; }

.mimotts-fieldError { margin: 0; font-size: 12px; color: var(--dsw-alias-label-error); }

/* While a player is open, the message's action strip stays visible even when
   the pointer leaves the row — audio must not fade out mid-playback. The
   selector reads ui-chat's reveal attribute as a progressive enhancement: with
   the attribute absent the rule simply never matches. */
@media (hover: hover) {
  [data-actions-reveal="hover"]:has(.mimotts-open) .actions { opacity: 1; }
}

.mimotts-recordingsPage { display: flex; flex-direction: column; }
.mimotts-recordingsSection {
  margin-top: 20px; padding-top: 16px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.mimotts-recordingsTitle { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary); }
.mimotts-recordingsHintText { margin: 0 0 12px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary); }
.mimotts-recordingsEmpty { margin: 4px 0; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.mimotts-recording { padding: 10px 0; border-top: 1px solid var(--dsw-alias-border-l3); }
.mimotts-recording:first-of-type { border-top: none; }
.mimotts-recordingText {
  margin: 0 0 6px; font-size: 13px; line-height: 18px; color: var(--dsw-alias-label-primary);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.mimotts-versions { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mimotts-version { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mimotts-versionAudio { height: 32px; flex: 1 1 200px; min-width: 160px; }
.mimotts-versionMeta { font-size: 11px; color: var(--dsw-alias-label-tertiary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.mimotts-recButton {
  height: 26px; padding: 0 12px; font-size: 12px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-button-tool-bar-fill); color: var(--dsw-alias-label-primary);
}
.mimotts-recButton:hover:not(:disabled) { background: var(--dsw-alias-button-tool-bar-hover); }
.mimotts-recButton:disabled { opacity: 0.6; cursor: default; }
`;
/**
 * Inject the plugin stylesheet into the page.
 * @returns the disposer removing the style tag (HMR-safe: re-injection after a
 * rebuild replaces the tag by its data attribute).
 */
export function injectStyles() {
    const existing = document.querySelector('style[data-plugin-css="dsh-mimotts/styles"]');
    if (existing !== null)
        return () => { existing.remove(); };
    const tag = document.createElement('style');
    tag.dataset.plugin = 'dsh-mimotts';
    tag.dataset.pluginCss = 'dsh-mimotts/styles';
    tag.textContent = CSS;
    document.head.appendChild(tag);
    return () => { tag.remove(); };
}
//# sourceMappingURL=styles.js.map