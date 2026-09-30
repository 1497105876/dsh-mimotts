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
import type { TtsSettingsSectionProps } from './slots.ts';
/**
 * Render the speech-synthesis settings page.
 * @param props - localized copy, the staged form snapshot, and its actions.
 * @returns the settings form with its sample player.
 */
export declare function TtsSettingsSection({ useForm, edit, resetField, save, discard, synthesize, t }: TtsSettingsSectionProps): import("react").JSX.Element;
