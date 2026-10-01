/**
 * The staged settings form behind the Plugins-page configuration card: one
 * `SettingsFormModel` over the `mimotts` configuration namespace. The API key
 * is a write-only control outside the section: a typed key stores through the
 * host's `credentials/set` remote under the configured reference (`apiKeyEnv`,
 * a section field the card reads but never renders as an input), and the card
 * learns only whether one resolves, through the Host's status route.
 * @module dsh-mimotts/client/settings-controller
 */

import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  SettingsFormModel,
  settingsNumberField,
  settingsTextField,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  SettingsFieldState, SettingsFormScope, SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { TtsSettings, TtsSynthesizeRequest } from '../settings.ts'
import { requestSpeech } from './api.ts'
import { refreshTtsStatus, ttsStatusStore } from './status.ts'

/** Field names inside the `mimotts` settings section. */
export type TtsSettingsField = keyof TtsSettings

/** Synthesis verb shared by the settings card and the speak entries. */
export type TtsSettingsSynthesize = (request: TtsSynthesizeRequest) => Promise<Blob>

/** Stores a credential literal under one reference in the host credentials store. */
export type TtsSetCredential = (ref: string, value: string) => Promise<boolean>

/** What the settings card renders. */
export interface TtsSettingsState extends SettingsFormShell {
  /** The write-only API key control (blank unless a key is being typed). */
  apiKey: SettingsFieldState
  /** Whether the Host resolves a non-empty key through the reference. */
  apiKeyConfigured: boolean
  /** The credential reference naming the key (shown as text, edited only in config). */
  apiKeyEnv: string | undefined
  /** Endpoint base. */
  baseUrl: SettingsFieldState
  /** Model id. */
  model: SettingsFieldState
  /** Preset voice. */
  voice: SettingsFieldState
  /** Host-local voice-clone sample path. */
  voiceSamplePath: SettingsFieldState
  /** Default speaking style. */
  style: SettingsFieldState
  /** Character budget. */
  maxChars: SettingsFieldState
  /** Round-trip timeout. */
  timeoutMs: SettingsFieldState
}

/** The registration-side face the Plugins-page card's slot entry injects. */
export interface TtsSettingsInjected {
  hooks: {
    /** Card snapshot bound by the renderer as useForm. */
    form: SnapshotStore<TtsSettingsState>
  }
  /** Stage draft text for one field (section fields or the API key control). */
  edit: (field: TtsSettingsField | 'apiKey', text: string) => void
  /** Stage a clear so the field re-inherits the schema default. */
  resetField: (field: TtsSettingsField) => void
  /** Write every staged edit (section fields, plus a typed key if any). */
  save: () => void
  /** Drop every staged edit. */
  discard: () => void
  /** @see TtsSettingsSynthesize */
  synthesize: TtsSettingsSynthesize
}

/** Form field name of the write-only API key control (not a section field). */
const API_KEY_CONTROL = 'apiKey'

/** Section fields the card edits; `apiKeyEnv` stays a read-only ref name. */
const SECTION_SPECS = [
  settingsTextField('baseUrl'),
  settingsTextField('model'),
  settingsTextField('voice'),
  settingsTextField('voiceSamplePath'),
  settingsTextField('style'),
  settingsNumberField('maxChars'),
  settingsNumberField('timeoutMs'),
]

/**
 * Bridges the `mimotts` configuration namespace onto the Plugins-page card.
 * @param scope - the bound settings scope for the `mimotts` namespace.
 * @param setCredential - stores a key in the host credentials store.
 */
export class TtsSettingsController {
  private readonly form: SettingsFormModel<TtsSettings>
  private readonly store: SnapshotStore<TtsSettingsState>
  private readonly unsubscribeStatus: () => void
  private readonly status = ttsStatusStore()

  constructor(
    private readonly scope: SettingsFormScope<TtsSettings>,
    private readonly setCredential: TtsSetCredential,
  ) {
    this.form = new SettingsFormModel(scope, SECTION_SPECS, [{
      field: API_KEY_CONTROL,
      write: text => this.writeApiKey(text),
    }])
    this.store = this.form.bind(() => this.projection())
    // The status mirror answers "is a key configured", which the form section
    // cannot: secrets never ride a response. Its changes republish the card.
    this.unsubscribeStatus = this.status.subscribe(() => { this.store.set(this.projection()) })
    void refreshTtsStatus()
  }

  /**
   * Build the face the card's slot registration injects.
   * @returns the card's snapshot and its form actions.
   */
  inject(): TtsSettingsInjected {
    const actions = this.form.actions()
    return {
      hooks: { form: this.store },
      edit: (field, text) => { actions.edit(field, text) },
      resetField: (field) => { actions.resetField(field) },
      save: () => { actions.save() },
      discard: () => { actions.discard() },
      synthesize: request => requestSpeech(request),
    }
  }

  /** Release form and status subscriptions. */
  dispose(): void {
    this.unsubscribeStatus()
    this.form.dispose()
  }

  /**
   * Store one typed key under the section's credential reference. A blank
   * draft never reaches here (the form model writes nothing for it); a
   * successful write refreshes the status mirror, so the configured flag
   * follows immediately.
   * @param text - the literal API key as typed.
   * @returns whether the host accepted the write.
   */
  private async writeApiKey(text: string): Promise<boolean> {
    const ref = (this.scope.getSnapshot().value?.apiKeyEnv ?? '').trim()
    if (ref === '') return false
    const ok = await this.setCredential(ref, text.trim())
    if (ok) void refreshTtsStatus()
    return ok
  }

  /** @returns the card projection rebuilt from the form and the status mirror. */
  private projection(): TtsSettingsState {
    return {
      ...this.form.shell(),
      apiKey: this.form.field(API_KEY_CONTROL),
      apiKeyConfigured: this.status.getSnapshot().configured,
      apiKeyEnv: this.scope.getSnapshot().value?.apiKeyEnv,
      baseUrl: this.form.field('baseUrl'),
      model: this.form.field('model'),
      voice: this.form.field('voice'),
      voiceSamplePath: this.form.field('voiceSamplePath'),
      style: this.form.field('style'),
      maxChars: this.form.field('maxChars'),
      timeoutMs: this.form.field('timeoutMs'),
    }
  }
}
