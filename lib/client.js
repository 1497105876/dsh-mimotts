window.__ModuleLoader__.load({
	id: "@gw/dsh-mimotts",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		//#region src/settings.ts
		/**
		* Settings and route vocabulary shared by the Host and browser halves.
		*
		* Both bundles inline this file, so it must stay pure: constants and types
		* only, no Node or DOM APIs. The namespace is the profile entry id the bundle
		* patch inserts (`cordis.patch.yml`), and the route paths are the seam the two
		* halves meet on.
		* @module dsh-mimotts/settings
		*/
		/** Settings namespace: the profile entry id of this plugin's loader row. */
		const MIMOTTS_NAMESPACE = "mimotts";
		/** Route prefix owned by this plugin on `ctx.webServer`. */
		const MIMOTTS_API_PREFIX = "/api/mimotts";
		/** `GET` route reporting the resolved engine configuration without secrets. */
		const MIMOTTS_STATUS_PATH = `${MIMOTTS_API_PREFIX}/status`;
		/** `POST` route synthesizing one text into WAV audio. */
		const MIMOTTS_SYNTHESIZE_PATH = `${MIMOTTS_API_PREFIX}/synthesize`;
		/** MiMo platform endpoint base; `/chat/completions` is appended. */
		const DEFAULT_BASE_URL = "https://api.xiaomimimo.com/v1";
		/** MiMo TTS model id. */
		const DEFAULT_MODEL = "mimo-v2.5-tts";
		/** Preset voice used when no clone sample is configured. */
		const DEFAULT_VOICE = "mimo_default";
		/** Sample sentence the settings page's audition button speaks. */
		const AUDITION_TEXT = "你好，这是 MiMo 语音合成的试听效果。";
		/** Route prefix for persisted speech history (list / create / file). */
		const MIMOTTS_RECORDINGS_PATH = `${MIMOTTS_API_PREFIX}/recordings`;
		/**
		* Response header carrying the new recording identity. Its value is the
		* base64 encoding of `JSON.stringify({ recId, verId })` so it survives the
		* `audio/wav` body that the synthesize route streams back.
		*/
		const MIMOTTS_RECORDING_HEADER = "x-mimotts-recording";
		//#endregion
		//#region src/client/api.ts
		/**
		* Browser → Host calls for speech synthesis.
		*
		* Both halves share their route vocabulary through `src/settings.ts`; the
		* browser sends text and receives WAV bytes, so the MiMo API key never enters
		* the page. Failures arrive as stable codes the UI maps to localized copy.
		* @module dsh-mimotts/client/api
		*/
		/** A synthesize failure carrying the Host's stable code. */
		var TtsClientError = class extends Error {
			code;
			/**
			* @param code - stable failure code; `generic` when the Host gave none.
			* @param message - Host-supplied detail, safe to show.
			*/
			constructor(code, message) {
				super(message);
				this.code = code;
				this.name = "TtsClientError";
			}
		};
		/**
		* Read the Host's resolved engine configuration (never secrets).
		* @returns the effective model, voice, endpoint, and key/sample presence.
		*/
		async function fetchTtsStatus() {
			const response = await fetch(MIMOTTS_STATUS_PATH, {
				method: "GET",
				cache: "no-store"
			});
			if (!response.ok) throw new TtsClientError("generic", `status request failed with HTTP ${response.status}`);
			return await response.json();
		}
		/**
		* Synthesize one text into playable WAV audio.
		* @param request - text and optional style/voice overrides (settings-page
		* audition previews unsaved values through these).
		* @returns the WAV payload as a Blob ready for `URL.createObjectURL`.
		* @throws {TtsClientError} when the Host refuses or the transport fails.
		*/
		async function requestSpeech(request) {
			let response;
			try {
				response = await fetch(MIMOTTS_SYNTHESIZE_PATH, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(request)
				});
			} catch (error) {
				throw new TtsClientError("generic", error instanceof Error ? error.message : String(error));
			}
			if (response.ok) return await response.blob();
			let code = "generic";
			let message = `synthesize request failed with HTTP ${response.status}`;
			try {
				const body = await response.json();
				if (typeof body.error?.code === "string") code = body.error.code;
				if (typeof body.error?.message === "string") message = body.error.message;
			} catch {}
			throw new TtsClientError(code, message);
		}
		/**
		* List the persisted speech history.
		* @returns the recordings index (empty when none recorded yet).
		*/
		async function fetchRecordings() {
			const response = await fetch(MIMOTTS_RECORDINGS_PATH, {
				method: "GET",
				cache: "no-store"
			});
			if (!response.ok) throw new TtsClientError("generic", `recordings request failed with HTTP ${response.status}`);
			return await response.json();
		}
		/**
		* Synthesize and persist one text, returning both the audio and its identity
		* in history. Used by the speak action so every read-aloud is remembered.
		* @param request - text and optional style/voice overrides.
		* @returns the WAV blob and the new recording reference.
		* @throws {TtsClientError} when the Host refuses or the transport fails.
		*/
		async function requestRecording(request) {
			let response;
			try {
				response = await fetch(MIMOTTS_RECORDINGS_PATH, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(request)
				});
			} catch (error) {
				throw new TtsClientError("generic", error instanceof Error ? error.message : String(error));
			}
			if (response.ok) {
				const blob = await response.blob();
				const header = response.headers.get(MIMOTTS_RECORDING_HEADER);
				let ref = {
					recId: "",
					verId: ""
				};
				if (header !== null) try {
					ref = JSON.parse(atob(header));
				} catch {}
				return {
					blob,
					ref
				};
			}
			let code = "generic";
			let message = `recording request failed with HTTP ${response.status}`;
			try {
				const body = await response.json();
				if (typeof body.error?.code === "string") code = body.error.code;
				if (typeof body.error?.message === "string") message = body.error.message;
			} catch {}
			throw new TtsClientError(code, message);
		}
		/**
		* Re-synthesize a recording's text with the engine's current settings,
		* appending a new version. Earlier versions stay intact for comparison.
		* @param recId - the recording node id.
		* @returns the new version's reference.
		*/
		async function resynthesizeRecording(recId) {
			let response;
			try {
				response = await fetch(`${MIMOTTS_RECORDINGS_PATH}/resynth?rec=${encodeURIComponent(recId)}`, { method: "POST" });
			} catch (error) {
				throw new TtsClientError("generic", error instanceof Error ? error.message : String(error));
			}
			if (response.ok) return await response.json();
			let message = `re-synthesis failed with HTTP ${response.status}`;
			try {
				const body = await response.json();
				if (typeof body.error?.message === "string") message = body.error.message;
			} catch {}
			throw new TtsClientError("generic", message);
		}
		/**
		* Delete one version from history.
		* @param recId - the recording node id.
		* @param verId - the version id to remove.
		*/
		async function deleteRecordingVersion(recId, verId) {
			const response = await fetch(`${MIMOTTS_RECORDINGS_PATH}/version?rec=${encodeURIComponent(recId)}&ver=${encodeURIComponent(verId)}`, { method: "DELETE" });
			if (!response.ok && response.status !== 204) throw new TtsClientError("generic", `delete failed with HTTP ${response.status}`);
		}
		/**
		* The URL serving one version's WAV file.
		* @param recId - the recording node id.
		* @param verId - the version id.
		* @returns an absolute path under the plugin's recordings route.
		*/
		function recordingFileUrl(recId, verId) {
			return `${MIMOTTS_RECORDINGS_PATH}/file?rec=${encodeURIComponent(recId)}&ver=${encodeURIComponent(verId)}`;
		}
		//#endregion
		//#region src/client/locales.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "settings.mimotts";
		/** English copy. */
		const en = {
			nav: "Speech synthesis",
			speak: "Read aloud",
			synthesize: "Synthesizing…",
			playing: "Playing",
			paused: "Paused",
			play: "Play",
			pause: "Pause",
			progress: "Playback position",
			notConfigured: "No MiMo API key is configured yet.",
			emptyText: "This message carries no speakable text.",
			truncated: "The reply is long; only the opening is spoken.",
			"error.notConfigured": "Set the MiMo API key in Settings → Speech synthesis first.",
			"error.badRequest": "The text could not be spoken as-is.",
			"error.timeout": "MiMo TTS did not answer in time.",
			"error.upstream": "MiMo TTS rejected the request.",
			"error.invalidAudio": "MiMo TTS returned audio that could not be played.",
			"error.voiceSample": "The voice-clone sample could not be read on the Host.",
			"error.generic": "Speech synthesis failed.",
			audition: "Play sample",
			auditioning: "Preparing sample…",
			auditionHint: "Speaks a sample sentence with the style and voice currently on this page (saved or not).",
			apiKeyEnv: "Credential reference",
			apiKeyEnvHint: "Names the credential in the host credentials store (default MIMO_API_KEY). The literal key stays in the credentials store and never lands in a configuration file.",
			apiKeySet: "A key is configured.",
			apiKeyUnset: "No key is configured.",
			baseUrl: "Endpoint base",
			baseUrlHint: "Leave blank to use https://api.xiaomimimo.com/v1; /chat/completions is appended.",
			model: "Model",
			modelHint: "Leave blank to use mimo-v2.5-tts.",
			voice: "Preset voice",
			voiceHint: "Leave blank to use mimo_default. Ignored while a voice-clone sample is set.",
			voiceSamplePath: "Voice-clone sample (Host path)",
			voiceSamplePathHint: "A 5–15 s WAV (24 kHz / 16-bit / mono) on the Host. Leave blank to speak with the preset voice.",
			style: "Default speaking style",
			styleHint: "A natural-language phrase such as “开心”, “语速慢”, or “东北话”. Leave blank for neutral speech.",
			maxChars: "Max characters per request",
			maxCharsHint: "Longer replies are spoken from the beginning up to this budget, cut at a sentence boundary.",
			timeoutMs: "Request timeout (ms)",
			timeoutMsHint: "Upper bound on one synthesis round-trip to MiMo TTS.",
			overridden: "Overridden",
			reset: "Reset to default",
			invalidNumber: "Enter a number, or leave blank to use the default.",
			readOnly: "This deployment stores settings read-only.",
			unavailable: "This plugin is not loaded, so it cannot be configured right now.",
			save: "Save",
			saving: "Saving…",
			saveFailed: "The deployment did not accept these values; they were left for you to correct.",
			recordings: "Speech history",
			recordingsEmpty: "No speech recorded yet. Read a message aloud and it is saved here.",
			recordingsHint: "Every read-aloud is saved. Re-synthesize re-reads the text with the current voice and style, keeping the old take so you can compare.",
			reSynthesize: "Re-synthesize",
			reSynthesizing: "Re-synthesizing…",
			deleteVersion: "Delete"
		};
		/** Simplified Chinese copy. */
		const zh = {
			nav: "语音合成",
			speak: "朗读",
			synthesize: "正在合成…",
			playing: "播放中",
			paused: "已暂停",
			play: "播放",
			pause: "暂停",
			progress: "播放进度",
			notConfigured: "尚未配置 MiMo API Key。",
			emptyText: "这条消息没有可朗读的文本。",
			truncated: "回复较长，只朗读开头部分。",
			"error.notConfigured": "请先在「设置 → 语音合成」中配置 MiMo API Key。",
			"error.badRequest": "这段文本无法直接朗读。",
			"error.timeout": "MiMo TTS 响应超时。",
			"error.upstream": "MiMo TTS 拒绝了这次请求。",
			"error.invalidAudio": "MiMo TTS 返回的音频无法播放。",
			"error.voiceSample": "宿主上的音色克隆样本无法读取。",
			"error.generic": "语音合成失败。",
			audition: "试听",
			auditioning: "正在准备试听…",
			auditionHint: "用当前页面上的风格与音色（含未保存的修改）朗读一句示例。",
			apiKeyEnv: "凭据引用名",
			apiKeyEnvHint: "指向凭据存储中的条目（默认 MIMO_API_KEY）。密钥本体只存在凭据存储里，不会写入任何配置文件或备份。",
			apiKeySet: "已配置密钥。",
			apiKeyUnset: "未配置密钥。",
			baseUrl: "接口地址",
			baseUrlHint: "留空使用 https://api.xiaomimimo.com/v1，自动追加 /chat/completions。",
			model: "模型",
			modelHint: "留空使用 mimo-v2.5-tts。",
			voice: "预置音色",
			voiceHint: "留空使用 mimo_default；配置了克隆样本时忽略此项。",
			voiceSamplePath: "音色克隆样本（宿主路径）",
			voiceSamplePathHint: "宿主上的 5–15 秒 WAV（24kHz/16bit/单声道）。留空则使用预置音色。",
			style: "默认风格",
			styleHint: "自然语言描述，例如「开心」「语速慢」「东北话」。留空为中性朗读。",
			maxChars: "单次最大字符数",
			maxCharsHint: "超出预算的回复只朗读开头，并在句末截断。",
			timeoutMs: "请求超时（毫秒）",
			timeoutMsHint: "单次合成请求的最长等待时间。",
			overridden: "已覆盖",
			reset: "恢复默认",
			invalidNumber: "请填数字；留空表示使用默认值。",
			readOnly: "本部署的设置为只读。",
			unavailable: "该插件当前未加载，暂时无法配置。",
			save: "保存",
			saving: "保存中…",
			saveFailed: "本部署没有接受这些值，已保留供你修改。",
			recordings: "语音历史",
			recordingsEmpty: "还没有保存的语音。朗读一条消息就会自动存到这里。",
			recordingsHint: "每次朗读都会保存。「重新合成」用当前音色与风格重读原文，旧版本保留，方便对比。",
			reSynthesize: "重新合成",
			reSynthesizing: "正在重新合成…",
			deleteVersion: "删除"
		};
		//#endregion
		//#region src/client/chat-text.ts
		/**
		* Extract the speakable text of one finalized assistant message.
		* @param snapshot - current Chat snapshot of the viewed Session.
		* @param messageId - durable identity of the target assistant message.
		* @returns the message's text blocks joined in order, or undefined when the
		* message is not in the loaded window.
		*/
		function speakableTextFor(snapshot, messageId) {
			const matches = [];
			for (const node of snapshot.nodes.values()) {
				if (node.kind !== "assistant-step") continue;
				const candidate = node;
				const data = candidate.data;
				const blocks = data.finalNode?.blocks ?? data.blocks;
				if (data.finalNode?.messageId !== messageId) continue;
				const text = blocks.filter((block) => block.kind === "text").map((block) => block.text).join("\n").trim();
				matches.push({
					anchorSeq: candidate.anchorSeq,
					visibility: candidate.visibility,
					text
				});
			}
			if (matches.length === 0) return void 0;
			return (matches.find((match) => match.visibility === "visible") ?? matches[0]).text;
		}
		//#endregion
		//#region src/client/PlayerBar.tsx
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
		/** Format seconds as `m:ss` (clamped at zero; durations are short). */
		function clock(seconds) {
			const whole = Math.max(0, Math.floor(seconds));
			const minutes = Math.floor(whole / 60);
			const remainder = whole % 60;
			return `${String(minutes)}:${remainder < 10 ? "0" : ""}${String(remainder)}`;
		}
		/**
		* Render one player bar.
		* @param props - playback state, controls, and localized names.
		* @returns the play control, the seekable track, and the time readout.
		*/
		function PlayerBar({ state, onToggle, onSeek, labels }) {
			const trackRef = (0, react.useRef)(null);
			const [dragging, setDragging] = (0, react.useState)(false);
			const duration = state.duration > 0 ? state.duration : 0;
			const ratio = duration > 0 ? Math.min(1, state.currentTime / duration) : 0;
			/** @param clientX - pointer x in viewport coordinates. @returns the seek target in seconds. */
			const positionAt = (0, react.useCallback)((clientX) => {
				const track = trackRef.current;
				if (track === null) return 0;
				const bounds = track.getBoundingClientRect();
				return (bounds.width > 0 ? Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)) : 0) * duration;
			}, [duration]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mimotts-bar",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mimotts-barButton",
						"aria-label": state.playing ? labels.pause : labels.play,
						onClick: onToggle,
						children: state.playing ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPauseOutlineRegular, { size: 14 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlayOutlineRegular, { size: 14 })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						ref: trackRef,
						className: dragging ? "mimotts-track mimotts-trackDragging" : "mimotts-track",
						role: "slider",
						tabIndex: 0,
						"aria-label": labels.progress,
						"aria-valuemin": 0,
						"aria-valuemax": Math.max(0, Math.round(duration)),
						"aria-valuenow": Math.round(state.currentTime),
						"aria-valuetext": `${clock(state.currentTime)} / ${clock(duration)}`,
						onPointerDown: (event) => {
							event.currentTarget.setPointerCapture(event.pointerId);
							setDragging(true);
							onSeek(positionAt(event.clientX));
						},
						onPointerMove: (event) => {
							if (!dragging) return;
							onSeek(positionAt(event.clientX));
						},
						onPointerUp: (event) => {
							if (!dragging) return;
							setDragging(false);
							if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
							onSeek(positionAt(event.clientX));
						},
						onPointerCancel: () => {
							setDragging(false);
						},
						onKeyDown: (event) => {
							const step = event.shiftKey ? 15 : 5;
							if (event.key === "ArrowRight" || event.key === "ArrowUp") {
								event.preventDefault();
								onSeek(state.currentTime + step);
							} else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
								event.preventDefault();
								onSeek(state.currentTime - step);
							} else if (event.key === "Home") {
								event.preventDefault();
								onSeek(0);
							} else if (event.key === "End" && duration > 0) {
								event.preventDefault();
								onSeek(duration);
							}
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "mimotts-fill",
							style: { width: `${(ratio * 100).toFixed(2)}%` }
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "mimotts-thumb",
							style: { left: `${(ratio * 100).toFixed(2)}%` }
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "mimotts-time",
						children: [
							clock(state.currentTime),
							" / ",
							clock(duration)
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/SpeakerIcon.tsx
		const Artwork = ({ size = 16, className }) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
			width: size,
			height: size,
			viewBox: "0 0 16 16",
			fill: "none",
			"aria-hidden": "true",
			focusable: "false",
			className,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M2.5 6h2.1L8 3.2v9.6L4.6 10H2.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5z",
					fill: "currentColor"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M10.2 5.6a3.4 3.4 0 0 1 0 4.8",
					stroke: "currentColor",
					strokeWidth: "1.2",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M12.6 3.6a6.6 6.6 0 0 1 0 8.8",
					stroke: "currentColor",
					strokeWidth: "1.2",
					strokeLinecap: "round",
					opacity: "0.65"
				})
			]
		});
		/** Regular one-pixel volume artwork. */
		const IconVolumeOutlineRegular = (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Artwork, { ...props });
		//#endregion
		//#region src/client/use-audio-player.ts
		/**
		* The playback engine behind every player this plugin renders: one hidden
		* `HTMLAudioElement` per mounted player, mirrored into React state, with a
		* module-local registry so starting one player pauses the other.
		*
		* The registry is deliberately module-local mutable UI state: it coordinates
		* components of this one plugin bundle and lives in the browser only. Business
		* and transport state stay in the settings namespace and the Host routes.
		* @module dsh-mimotts/client/use-audio-player
		*/
		/** The one player currently allowed to advance, if any. */
		let activeElement = null;
		const IDLE = {
			playing: false,
			currentTime: 0,
			duration: 0,
			ended: false
		};
		/**
		* Bind one audio source to playback state and controls.
		*
		* A new `source` replaces the element: the old one pauses and detaches, and
		* playback state returns to zero. Passing null keeps the hook idle.
		* @param source - object URL of the WAV to play, or null.
		* @returns playback state plus the toggle and seek controls.
		*/
		function useAudioPlayer(source) {
			const [state, setState] = (0, react.useState)(IDLE);
			const elementRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (source === null) return;
				const audio = new Audio(source);
				elementRef.current = audio;
				const publish = (patch) => {
					setState((previous) => ({
						...previous,
						...patch
					}));
				};
				const onTime = () => {
					publish({ currentTime: audio.currentTime });
				};
				const onLoaded = () => {
					publish({ duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
				};
				const onPlay = () => {
					activeElement = audio;
					publish({
						playing: true,
						ended: false
					});
				};
				const onPause = () => {
					if (activeElement === audio) activeElement = null;
					publish({ playing: false });
				};
				const onEnded = () => {
					if (activeElement === audio) activeElement = null;
					publish({
						playing: false,
						ended: true,
						currentTime: 0
					});
				};
				audio.addEventListener("timeupdate", onTime);
				audio.addEventListener("loadedmetadata", onLoaded);
				audio.addEventListener("durationchange", onLoaded);
				audio.addEventListener("play", onPlay);
				audio.addEventListener("pause", onPause);
				audio.addEventListener("ended", onEnded);
				setState({
					playing: false,
					currentTime: 0,
					duration: 0,
					ended: false
				});
				return () => {
					if (activeElement === audio) activeElement = null;
					audio.pause();
					audio.removeAttribute("src");
					audio.load();
					audio.removeEventListener("timeupdate", onTime);
					audio.removeEventListener("loadedmetadata", onLoaded);
					audio.removeEventListener("durationchange", onLoaded);
					audio.removeEventListener("play", onPlay);
					audio.removeEventListener("pause", onPause);
					audio.removeEventListener("ended", onEnded);
					elementRef.current = null;
				};
			}, [source]);
			return {
				state,
				toggle: (0, react.useCallback)(() => {
					const audio = elementRef.current;
					if (audio === null) return;
					if (audio.paused) {
						if (activeElement !== null && activeElement !== audio) activeElement.pause();
						if (audio.ended) audio.currentTime = 0;
						audio.play().catch(() => {
							setState((previous) => ({
								...previous,
								playing: false
							}));
						});
					} else audio.pause();
				}, []),
				seek: (0, react.useCallback)((seconds) => {
					const audio = elementRef.current;
					if (audio === null) return;
					const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
					const target = Math.max(0, duration > 0 ? Math.min(seconds, duration) : seconds);
					audio.currentTime = target;
					setState((previous) => ({
						...previous,
						currentTime: target,
						ended: false
					}));
				}, []),
				pause: (0, react.useCallback)(() => {
					const audio = elementRef.current;
					if (audio !== null) audio.pause();
				}, [])
			};
		}
		//#endregion
		//#region src/client/SpeakAction.tsx
		/**
		* The speak entry in the finalized assistant message's action strip: a volume
		* button that synthesizes the message with MiMo TTS, and — once audio exists —
		* a floating mini player with a draggable progress bar.
		*
		* The button lives exactly where the platform keeps per-message actions
		* (between copy and branch). The player floats below the icon row so the row's
		* 28px chrome never reflows; while a player is open the strip stops fading on
		* hover-out (`styles.ts`), so audio stays visible wherever the pointer goes.
		* @module dsh-mimotts/client/SpeakAction
		*/
		/**
		* Map a failure onto the dictionary key the entry shows.
		* @param failure - the synthesis failure, or `empty` for a text-less message.
		* @returns the localized copy key.
		*/
		function errorKeyFor(failure) {
			if (failure === "empty") return "emptyText";
			if (failure === "unconfigured") return "error.notConfigured";
			switch (failure.code) {
				case "not-configured": return "error.notConfigured";
				case "bad-request": return "error.badRequest";
				case "text-too-long": return "error.badRequest";
				case "timeout": return "error.timeout";
				case "upstream-error": return "error.upstream";
				case "invalid-audio": return "error.invalidAudio";
				case "voice-sample-unreadable": return "error.voiceSample";
				default: return "error.generic";
			}
		}
		/**
		* Render one message's speak control and open player.
		* @param props - the message identity, the injected engine verbs, the Chat
		* selector hook, and localized copy.
		* @returns the volume button with its optional player and failure notice.
		*/
		function SpeakAction({ messageId, useChat, useStatus, ensureStatus, t }) {
			const status = useStatus((snapshot) => snapshot);
			const text = useChat((snapshot) => speakableTextFor(snapshot, messageId));
			const [phase, setPhase] = (0, react.useState)("idle");
			const [failure, setFailure] = (0, react.useState)(null);
			const [source, setSource] = (0, react.useState)(null);
			const player = useAudioPlayer(source);
			const toggle = player.toggle;
			const [panelOpen, setPanelOpen] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!panelOpen) return;
				const onPointerDown = (event) => {
					const root = rootRef.current;
					if (root !== null && root.contains(event.target)) return;
					setPanelOpen(false);
					player.pause();
				};
				const onKeyDown = (event) => {
					if (event.key !== "Escape") return;
					setPanelOpen(false);
					player.pause();
				};
				document.addEventListener("pointerdown", onPointerDown);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [panelOpen]);
			const autoplay = (0, react.useRef)(false);
			const sourceRef = (0, react.useRef)(null);
			sourceRef.current = source;
			(0, react.useEffect)(() => () => {
				if (sourceRef.current !== null) URL.revokeObjectURL(sourceRef.current);
			}, []);
			(0, react.useEffect)(() => {
				if (source === null || !autoplay.current) return;
				autoplay.current = false;
				toggle();
			}, [source, toggle]);
			const onClick = (0, react.useCallback)(() => {
				if (phase === "loading") return;
				if (source !== null) {
					if (!panelOpen) setPanelOpen(true);
					player.toggle();
					return;
				}
				if (text === void 0 || text === "") {
					setFailure("empty");
					return;
				}
				if (!status.configured) {
					setFailure("unconfigured");
					return;
				}
				setPhase("loading");
				setFailure(null);
				setPanelOpen(true);
				requestRecording({ text }).then(({ blob }) => {
					autoplay.current = true;
					setPhase("ready");
					setSource((previous) => {
						if (previous !== null) URL.revokeObjectURL(previous);
						return URL.createObjectURL(blob);
					});
				}).catch((error) => {
					setPhase("error");
					setFailure(error instanceof TtsClientError ? error : new TtsClientError("generic", String(error)));
				});
			}, [
				phase,
				player,
				source,
				status.configured,
				text
			]);
			const open = source !== null;
			const buttonLabel = phase === "loading" ? t("synthesize") : player.state.playing ? t("pause") : open ? t("play") : t("speak");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				ref: rootRef,
				className: open ? "mimotts-root mimotts-open" : "mimotts-root",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
						label: buttonLabel,
						side: "bottom",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mimotts-button",
							"aria-label": buttonLabel,
							"aria-pressed": player.state.playing,
							onClick,
							onMouseEnter: ensureStatus,
							onFocus: ensureStatus,
							children: phase === "loading" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "mimotts-spin",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconLoadingOutlineRegular, { size: 15 })
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconVolumeOutlineRegular, { size: 15 })
						})
					}),
					failure !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
						label: t(errorKeyFor(failure)),
						side: "bottom",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "mimotts-failure",
							role: "img",
							"aria-label": t(errorKeyFor(failure)),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningTriangleOutlineRegular, { size: 14 })
						})
					}) : null,
					panelOpen && open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "mimotts-panel",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlayerBar, {
							state: player.state,
							onToggle: player.toggle,
							onSeek: player.seek,
							labels: {
								play: t("play"),
								pause: t("pause"),
								progress: t("progress")
							}
						})
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/RecordingsList.tsx
		/**
		* The speech-history browser: every recorded text, each with its versions.
		* Versions play in place, re-synthesize against the current engine settings
		* (appending a fresh take, old ones kept), or get deleted. There is no
		* dedicated comparison view — per the design, each take is played on its own.
		* @module dsh-mimotts/client/RecordingsList
		*/
		/**
		* Render the persisted speech history with per-version playback, re-synthesis,
		* and deletion.
		* @param props - localized copy.
		* @returns the history list, or an empty-state note before the first load.
		*/
		function RecordingsList({ t }) {
			const [index, setIndex] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [busyRec, setBusyRec] = (0, react.useState)(null);
			const load = (0, react.useCallback)(() => {
				setError(null);
				fetchRecordings().then(setIndex).catch((failure) => setError(failure instanceof Error ? failure.message : String(failure)));
			}, []);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const onResynth = (0, react.useCallback)((recId) => {
				setBusyRec(recId);
				resynthesizeRecording(recId).then(load).catch((failure) => setError(failure instanceof TtsClientError ? failure.message : String(failure))).finally(() => setBusyRec(null));
			}, [load]);
			const onDelete = (0, react.useCallback)((recId, verId) => {
				deleteRecordingVersion(recId, verId).then(load).catch((failure) => setError(failure instanceof TtsClientError ? failure.message : String(failure)));
			}, [load]);
			if (index === null || index.entries.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "mimotts-recordingsEmpty",
				children: t("recordingsEmpty")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "mimotts-recordings",
				children: [error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "mimotts-fieldError",
					role: "status",
					children: error
				}) : null, index.entries.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "mimotts-recording",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "mimotts-recordingText",
						title: entry.text,
						children: entry.text
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "mimotts-versions",
						children: entry.versions.map((version) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: "mimotts-version",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("audio", {
									className: "mimotts-versionAudio",
									src: recordingFileUrl(entry.id, version.id),
									controls: true,
									preload: "none"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "mimotts-versionMeta",
									children: [
										new Date(version.createdAt).toLocaleString(),
										version.voice !== null ? ` · ${version.voice}` : "",
										version.style !== null ? ` · ${version.style}` : ""
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mimotts-recButton",
									disabled: busyRec === entry.id,
									onClick: () => {
										onResynth(entry.id);
									},
									children: busyRec === entry.id ? t("reSynthesizing") : t("reSynthesize")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mimotts-recButton",
									onClick: () => {
										onDelete(entry.id, version.id);
									},
									children: t("deleteVersion")
								})
							]
						}, version.id))
					})]
				}, entry.id))]
			});
		}
		//#endregion
		//#region src/client/SettingsSection.tsx
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
		/**
		* Render the speech-synthesis settings page.
		* @param props - localized copy, the staged form snapshot, and its actions.
		* @returns the settings form with its sample player.
		*/
		function TtsSettingsSection({ useForm, edit, resetField, save, discard, synthesize, t }) {
			const state = useForm((snapshot) => snapshot);
			const [sampleUrl, setSampleUrl] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)(null);
			const player = useAudioPlayer(sampleUrl);
			const toggle = player.toggle;
			const autoplay = (0, react.useRef)(false);
			const sampleRef = (0, react.useRef)(null);
			sampleRef.current = sampleUrl;
			(0, react.useEffect)(() => () => {
				if (sampleRef.current !== null) URL.revokeObjectURL(sampleRef.current);
			}, []);
			(0, react.useEffect)(() => {
				if (sampleUrl === null || !autoplay.current) return;
				autoplay.current = false;
				toggle();
			}, [sampleUrl, toggle]);
			const audition = (0, react.useCallback)(() => {
				if (busy) return;
				setBusy(true);
				setFailure(null);
				synthesize({
					text: AUDITION_TEXT,
					style: state.style.text.trim() === "" ? void 0 : state.style.text,
					voice: state.voice.text.trim() === "" ? void 0 : state.voice.text
				}).then((blob) => {
					autoplay.current = true;
					setBusy(false);
					setSampleUrl((previous) => {
						if (previous !== null) URL.revokeObjectURL(previous);
						return URL.createObjectURL(blob);
					});
				}).catch((error) => {
					setBusy(false);
					setFailure(error instanceof TtsClientError ? error : new TtsClientError("generic", String(error)));
				});
			}, [
				busy,
				state.style.text,
				state.voice.text,
				synthesize
			]);
			const disabled = !state.writable;
			const failureKey = failure === null ? null : errorKeyFor(failure);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.SettingsForm, {
				labels: {
					unavailable: t("unavailable"),
					readOnly: t("readOnly"),
					saveFailed: t("saveFailed"),
					save: t("save"),
					saving: t("saving")
				},
				state,
				onSave: save,
				onDiscard: discard,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "mimotts-api-key-env",
						label: t("apiKeyEnv"),
						hint: t("apiKeyEnvHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						disabled,
						...state.apiKeyEnv,
						onEdit: (text) => {
							edit("apiKeyEnv", text);
						},
						onReset: () => {
							resetField("apiKeyEnv");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "mimotts-auditionHint",
						role: "status",
						style: { marginTop: -6 },
						children: state.apiKeyConfigured ? t("apiKeySet") : t("apiKeyUnset")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "mimotts-base-url",
						label: t("baseUrl"),
						hint: t("baseUrlHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						disabled,
						...state.baseUrl,
						onEdit: (text) => {
							edit("baseUrl", text);
						},
						onReset: () => {
							resetField("baseUrl");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "mimotts-model",
						label: t("model"),
						hint: t("modelHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						disabled,
						...state.model,
						onEdit: (text) => {
							edit("model", text);
						},
						onReset: () => {
							resetField("model");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "mimotts-voice",
						label: t("voice"),
						hint: t("voiceHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						disabled,
						...state.voice,
						onEdit: (text) => {
							edit("voice", text);
						},
						onReset: () => {
							resetField("voice");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "mimotts-voice-sample",
						label: t("voiceSamplePath"),
						hint: t("voiceSamplePathHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						disabled,
						...state.voiceSamplePath,
						onEdit: (text) => {
							edit("voiceSamplePath", text);
						},
						onReset: () => {
							resetField("voiceSamplePath");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "mimotts-style",
						label: t("style"),
						hint: t("styleHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						disabled,
						...state.style,
						onEdit: (text) => {
							edit("style", text);
						},
						onReset: () => {
							resetField("style");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "mimotts-max-chars",
						label: t("maxChars"),
						hint: t("maxCharsHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						numeric: true,
						disabled,
						...state.maxChars,
						onEdit: (text) => {
							edit("maxChars", text);
						},
						onReset: () => {
							resetField("maxChars");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
						id: "mimotts-timeout",
						label: t("timeoutMs"),
						hint: t("timeoutMsHint"),
						overriddenLabel: t("overridden"),
						resetLabel: t("reset"),
						invalidLabel: t("invalidNumber"),
						numeric: true,
						disabled,
						...state.timeoutMs,
						onEdit: (text) => {
							edit("timeoutMs", text);
						},
						onReset: () => {
							resetField("timeoutMs");
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "mimotts-audition",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "mimotts-auditionHint",
								children: t("auditionHint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "mimotts-auditionRow",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "mimotts-auditionButton",
									disabled: busy,
									onClick: audition,
									children: busy ? t("auditioning") : t("audition")
								}), sampleUrl !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PlayerBar, {
									state: player.state,
									onToggle: player.toggle,
									onSeek: player.seek,
									labels: {
										play: t("play"),
										pause: t("pause"),
										progress: t("progress")
									}
								}) : null]
							}),
							failureKey !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "mimotts-fieldError",
								role: "status",
								children: t(failureKey)
							}) : null
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "mimotts-recordingsSection",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "mimotts-recordingsTitle",
								children: t("recordings")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "mimotts-recordingsHintText",
								children: t("recordingsHint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RecordingsList, { t })
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/status.ts
		/**
		* The engine-status mirror shared by the speak entries and the settings page.
		*
		* One `GET /api/mimotts/status` answers every mounted control: entries lazy-
		* load it on first hover/focus, the settings page refreshes it after each
		* write that could change whether a key exists. Failures publish the
		* "unconfigured" view rather than an error state — a missing answer must not
		* claim a key exists.
		* @module dsh-mimotts/client/status
		*/
		const store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)({
			configured: false,
			model: DEFAULT_MODEL,
			voice: DEFAULT_VOICE,
			hasVoiceSample: false,
			baseUrl: DEFAULT_BASE_URL
		});
		let inflight = null;
		/**
		* @returns the shared status mirror every control derives from.
		*/
		function ttsStatusStore() {
			return store;
		}
		/**
		* Ensure one status read is under way; concurrent callers share it.
		* @returns the read in flight, which never rejects.
		*/
		function ensureTtsStatus() {
			if (inflight !== null) return inflight;
			inflight = fetchTtsStatus().then((view) => {
				store.set(view);
			}).catch(() => void 0).finally(() => {
				inflight = null;
			});
			return inflight;
		}
		/**
		* Re-read the status even when one is already under way; called after writes
		* that could add or remove the API key.
		* @returns the fresh read, which never rejects.
		*/
		function refreshTtsStatus() {
			inflight = null;
			return ensureTtsStatus();
		}
		//#endregion
		//#region src/client/settings-controller.ts
		/** Bridges the `mimotts` configuration namespace onto the settings page. */
		var TtsSettingsController = class {
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
				this.form = new _deepseek_ai_dsh_client_ui_primitives.SettingsFormModel(scope, [
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("apiKeyEnv"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("baseUrl"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("model"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("voice"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("voiceSamplePath"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("style"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsNumberField)("maxChars"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsNumberField)("timeoutMs")
				]);
				this.store = this.form.bind(() => this.projection());
				this.unsubscribeStatus = this.status.subscribe(() => {
					this.store.set(this.projection());
				});
				refreshTtsStatus();
			}
			/**
			* Build the face the page's slot registration injects.
			* @returns the page's snapshot and its form actions.
			*/
			inject() {
				const actions = this.form.actions();
				return {
					hooks: { form: this.store },
					edit: (field, text) => {
						actions.edit(field, text);
					},
					resetField: (field) => {
						actions.resetField(field);
					},
					save: () => {
						actions.save();
					},
					discard: () => {
						actions.discard();
					},
					synthesize: (request) => requestSpeech(request)
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
					apiKeyEnv: this.form.field("apiKeyEnv"),
					apiKeyConfigured: this.status.getSnapshot().configured,
					baseUrl: this.form.field("baseUrl"),
					model: this.form.field("model"),
					voice: this.form.field("voice"),
					voiceSamplePath: this.form.field("voiceSamplePath"),
					style: this.form.field("style"),
					maxChars: this.form.field("maxChars"),
					timeoutMs: this.form.field("timeoutMs")
				};
			}
		};
		//#endregion
		//#region src/client/styles.ts
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
		const CSS = `
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
		function injectStyles() {
			const existing = document.querySelector("style[data-plugin-css=\"dsh-mimotts/styles\"]");
			if (existing !== null) return () => {
				existing.remove();
			};
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-mimotts";
			tag.dataset.pluginCss = "dsh-mimotts/styles";
			tag.textContent = CSS;
			document.head.appendChild(tag);
			return () => {
				tag.remove();
			};
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services (cordis fiber inject). */
		const inject = [
			"slots",
			"locale",
			"configForms"
		];
		/**
		* Mount the speak entries and the speech-synthesis settings page.
		* @param ctx - the browser plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => injectStyles(), "dsh-mimotts: styles");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-mimotts: dictionaries");
			const t = ctx.locale.bind(NS);
			const controller = new TtsSettingsController(ctx.configForms.get(MIMOTTS_NAMESPACE));
			ctx.effect(() => () => {
				controller.dispose();
			}, "dsh-mimotts: settings form");
			ctx.effect(() => ctx.configForms.whileServed([MIMOTTS_NAMESPACE], () => ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "mimotts",
				order: 20,
				label: () => t("nav"),
				locale: NS,
				inject: () => controller.inject()
			}, TtsSettingsSection))), "dsh-mimotts: settings page");
			ctx.slots.inject("conversation.chat.assistant-actions", () => ctx.slots.register({
				name: "conversation.chat.assistant-actions",
				id: "mimotts",
				order: 20,
				locale: NS,
				inject: () => ({
					hooks: { status: ttsStatusStore() },
					ensureStatus: () => {
						ensureTtsStatus();
					},
					synthesize: requestSpeech
				})
			}, SpeakAction));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map