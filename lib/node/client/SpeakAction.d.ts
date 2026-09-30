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
import { TtsClientError } from './api.ts';
import type { MimottsLocaleKey } from './locales.ts';
import type { SpeakActionProps } from './slots.ts';
/**
 * Map a failure onto the dictionary key the entry shows.
 * @param failure - the synthesis failure, or `empty` for a text-less message.
 * @returns the localized copy key.
 */
export declare function errorKeyFor(failure: TtsClientError | 'empty' | 'unconfigured'): MimottsLocaleKey;
/**
 * Render one message's speak control and open player.
 * @param props - the message identity, the injected engine verbs, the Chat
 * selector hook, and localized copy.
 * @returns the volume button with its optional player and failure notice.
 */
export declare function SpeakAction({ messageId, useChat, useStatus, ensureStatus, t }: SpeakActionProps): import("react").JSX.Element;
