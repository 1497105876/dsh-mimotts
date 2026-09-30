/**
 * MiMo TTS speech synthesis, browser half.
 *
 * Two contributions, both registered through the typed slot system:
 * - `conversation.chat.assistant-actions`: the volume button under every
 *   finalized assistant message, with its floating player (draggable progress
 *   bar) once audio exists;
 * - `settings.section`: the `语音合成` settings page, mounted while the Host
 *   serves this plugin's `mimotts` configuration namespace.
 *
 * Neither entry owns business state: text comes from the Conversation binding
 * through `useChat`, configuration through `ctx.configForms`, synthesis through
 * the Host's `/api/mimotts` routes, and copy through `ctx.locale`.
 * @module dsh-mimotts/client
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the ctx.configForms merge and the settings.section SlotMap
// entry (the settings domain base owns both declarations).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the SlotRegistry service merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { MIMOTTS_NAMESPACE } from '../settings.ts'
import type { TtsSettings } from '../settings.ts'
import { requestSpeech } from './api.ts'
import { NS, en, zh } from './locales.ts'
import { TtsSettingsSection } from './SettingsSection.tsx'
import { SpeakAction } from './SpeakAction.tsx'
import { TtsSettingsController } from './settings-controller.ts'
import { ensureTtsStatus, ttsStatusStore } from './status.ts'
import { injectStyles } from './styles.ts'

export type { SpeakActionInjected, SpeakActionProps, TtsSettingsInjected, TtsSettingsSectionProps } from './slots.ts'

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Mount the speak entries and the speech-synthesis settings page.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => injectStyles(), 'dsh-mimotts: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-mimotts: dictionaries')
  const t = ctx.locale.bind(NS)

  const controller = new TtsSettingsController(ctx.configForms.get<TtsSettings>(MIMOTTS_NAMESPACE))
  ctx.effect(() => () => { controller.dispose() }, 'dsh-mimotts: settings form')

  // The page exists only while the Host serves this plugin's namespace, so a
  // deployment without the plugin shows no trace of it.
  ctx.effect(
    () => ctx.configForms.whileServed([MIMOTTS_NAMESPACE], () => ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: 'mimotts',
      order: 20,
      label: () => t('nav'),
      locale: NS,
      inject: () => controller.inject(),
    }, TtsSettingsSection))),
    'dsh-mimotts: settings page',
  )

  ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
    name: 'conversation.chat.assistant-actions',
    id: 'mimotts',
    order: 20,
    locale: NS,
    inject: () => ({
      hooks: { status: ttsStatusStore() },
      ensureStatus: () => { void ensureTtsStatus() },
      synthesize: requestSpeech,
    }),
  }, SpeakAction))
}
