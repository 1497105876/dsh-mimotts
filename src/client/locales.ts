/**
 * Locale bundles for the MiMo TTS plugin: the speak entry under each finalized
 * assistant message, its player, and the `语音合成` settings page.
 * @module dsh-mimotts/client/locales
 */

// Type-only: pulls the SlotRegistry's LocaleNamespaceMap merge so the
// `'settings.mimotts'` seat below is a legal key.
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.mimotts'

/** Locale keys this plugin renders. */
export type MimottsLocaleKey =
  | 'nav'
  | 'speak' | 'synthesize' | 'playing' | 'paused' | 'play' | 'pause' | 'progress'
  | 'notConfigured' | 'emptyText' | 'truncated'
  | 'error.notConfigured' | 'error.badRequest' | 'error.timeout'
  | 'error.upstream' | 'error.invalidAudio' | 'error.voiceSample' | 'error.generic'
  | 'audition' | 'auditioning' | 'auditionHint'
  | 'apiKey' | 'apiKeyHint' | 'apiKeySet' | 'apiKeyUnset'
  | 'baseUrl' | 'baseUrlHint'
  | 'model' | 'modelHint'
  | 'voice' | 'voiceHint'
  | 'voiceSamplePath' | 'voiceSamplePathHint'
  | 'style' | 'styleHint'
  | 'maxChars' | 'maxCharsHint'
  | 'timeoutMs' | 'timeoutMsHint'
  | 'overridden' | 'reset' | 'invalidNumber'
  | 'readOnly' | 'unavailable' | 'save' | 'saving' | 'saveFailed'
  | 'recordings' | 'recordingsEmpty' | 'recordingsHint'
  | 'reSynthesize' | 'reSynthesizing' | 'deleteVersion'

/** English copy. */
export const en: Record<MimottsLocaleKey, string> = {
  nav: 'Speech synthesis',
  speak: 'Read aloud',
  synthesize: 'Synthesizing…',
  playing: 'Playing',
  paused: 'Paused',
  play: 'Play',
  pause: 'Pause',
  progress: 'Playback position',
  notConfigured: 'No MiMo API key is configured yet.',
  emptyText: 'This message carries no speakable text.',
  truncated: 'The reply is long; only the opening is spoken.',
  'error.notConfigured': 'Set the MiMo API key in Settings → Speech synthesis first.',
  'error.badRequest': 'The text could not be spoken as-is.',
  'error.timeout': 'MiMo TTS did not answer in time.',
  'error.upstream': 'MiMo TTS rejected the request.',
  'error.invalidAudio': 'MiMo TTS returned audio that could not be played.',
  'error.voiceSample': 'The voice-clone sample could not be read on the Host.',
  'error.generic': 'Speech synthesis failed.',
  audition: 'Play sample',
  auditioning: 'Preparing sample…',
  auditionHint: 'Speaks a sample sentence with the style and voice currently on this page (saved or not).',
  apiKey: 'API key',
  apiKeyHint: 'Stored in the settings document as a write-only secret; it never returns to this page. To keep it out of files entirely, layer `apiKey: !!js process.env.MIMO_API_KEY` over the row in your profile patch.',
  apiKeySet: 'A key is configured.',
  apiKeyUnset: 'No key is configured.',
  baseUrl: 'Endpoint base',
  baseUrlHint: 'Leave blank to use https://api.xiaomimimo.com/v1; /chat/completions is appended.',
  model: 'Model',
  modelHint: 'Leave blank to use mimo-v2.5-tts.',
  voice: 'Preset voice',
  voiceHint: 'Leave blank to use mimo_default. Ignored while a voice-clone sample is set.',
  voiceSamplePath: 'Voice-clone sample (Host path)',
  voiceSamplePathHint: 'A 5–15 s WAV (24 kHz / 16-bit / mono) on the Host. Leave blank to speak with the preset voice.',
  style: 'Default speaking style',
  styleHint: 'A natural-language phrase such as “开心”, “语速慢”, or “东北话”. Leave blank for neutral speech.',
  maxChars: 'Max characters per request',
  maxCharsHint: 'Longer replies are spoken from the beginning up to this budget, cut at a sentence boundary.',
  timeoutMs: 'Request timeout (ms)',
  timeoutMsHint: 'Upper bound on one synthesis round-trip to MiMo TTS.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  invalidNumber: 'Enter a number, or leave blank to use the default.',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  recordings: 'Speech history',
  recordingsEmpty: 'No speech recorded yet. Read a message aloud and it is saved here.',
  recordingsHint: 'Every read-aloud is saved. Re-synthesize re-reads the text with the current voice and style, keeping the old take so you can compare.',
  reSynthesize: 'Re-synthesize',
  reSynthesizing: 'Re-synthesizing…',
  deleteVersion: 'Delete',
}

/** Simplified Chinese copy. */
export const zh: Record<MimottsLocaleKey, string> = {
  nav: '语音合成',
  speak: '朗读',
  synthesize: '正在合成…',
  playing: '播放中',
  paused: '已暂停',
  play: '播放',
  pause: '暂停',
  progress: '播放进度',
  notConfigured: '尚未配置 MiMo API Key。',
  emptyText: '这条消息没有可朗读的文本。',
  truncated: '回复较长，只朗读开头部分。',
  'error.notConfigured': '请先在「设置 → 语音合成」中配置 MiMo API Key。',
  'error.badRequest': '这段文本无法直接朗读。',
  'error.timeout': 'MiMo TTS 响应超时。',
  'error.upstream': 'MiMo TTS 拒绝了这次请求。',
  'error.invalidAudio': 'MiMo TTS 返回的音频无法播放。',
  'error.voiceSample': '宿主上的音色克隆样本无法读取。',
  'error.generic': '语音合成失败。',
  audition: '试听',
  auditioning: '正在准备试听…',
  auditionHint: '用当前页面上的风格与音色（含未保存的修改）朗读一句示例。',
  apiKey: 'API Key',
  apiKeyHint: '以只写密钥形式存入设置文档，不会回传到本页。若想完全不落盘，可在 profile 补丁层里用 `apiKey: !!js process.env.MIMO_API_KEY` 覆盖该行。',
  apiKeySet: '已配置密钥。',
  apiKeyUnset: '未配置密钥。',
  baseUrl: '接口地址',
  baseUrlHint: '留空使用 https://api.xiaomimimo.com/v1，自动追加 /chat/completions。',
  model: '模型',
  modelHint: '留空使用 mimo-v2.5-tts。',
  voice: '预置音色',
  voiceHint: '留空使用 mimo_default；配置了克隆样本时忽略此项。',
  voiceSamplePath: '音色克隆样本（宿主路径）',
  voiceSamplePathHint: '宿主上的 5–15 秒 WAV（24kHz/16bit/单声道）。留空则使用预置音色。',
  style: '默认风格',
  styleHint: '自然语言描述，例如「开心」「语速慢」「东北话」。留空为中性朗读。',
  maxChars: '单次最大字符数',
  maxCharsHint: '超出预算的回复只朗读开头，并在句末截断。',
  timeoutMs: '请求超时（毫秒）',
  timeoutMsHint: '单次合成请求的最长等待时间。',
  overridden: '已覆盖',
  reset: '恢复默认',
  invalidNumber: '请填数字；留空表示使用默认值。',
  readOnly: '本部署的设置为只读。',
  unavailable: '该插件当前未加载，暂时无法配置。',
  save: '保存',
  saving: '保存中…',
  saveFailed: '本部署没有接受这些值，已保留供你修改。',
  recordings: '语音历史',
  recordingsEmpty: '还没有保存的语音。朗读一条消息就会自动存到这里。',
  recordingsHint: '每次朗读都会保存。「重新合成」用当前音色与风格重读原文，旧版本保留，方便对比。',
  reSynthesize: '重新合成',
  reSynthesizing: '正在重新合成…',
  deleteVersion: '删除',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** MiMo TTS speak entry, player, and settings page copy. */
    'settings.mimotts': MimottsLocaleKey
  }
}
