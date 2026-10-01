/**
 * The staged settings form behind the Plugins-page configuration card: one
 * `SettingsFormModel` over the `mimotts` configuration namespace. The API key
 * is addressed by a credential reference (`apiKeyEnv`) — an ordinary,
 * non-secret field; the literal key lives in the host credentials store, and
 * the card learns only whether one resolves, through the Host's status route.
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

/** Synthesis verb shared by the settings page and the speak entries. */
export type TtsSettingsSynthesize = (request: TtsSynthesizeRequest) => Promise<Blob>

/** What the settings page renders. */
export interface TtsSettingsState extends SettingsFormShell {
  /** The credential reference naming the key in the credentials store. */
  apiKeyEnv: SettingsFieldState
  /** Whether the Host resolves a non-empty key through that reference. */
  apiKeyConfigured: boolean
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
    /** Page snapshot bound by the renderer as useForm. */
    form: SnapshotStore<TtsSettingsState>
  }
  /** Stage draft text for one field. */
  edit: (field: TtsSettingsField, text: string) => void
  /** Stage a clear so the field re-inherits the schema default. */
  resetField: (field: TtsSettingsField) => void
  /** Write every staged edit. */
  save: () => void
  /** Drop every staged edit. */
  discard: () => void
  /** @see TtsSettingsSynthesize */
  synthesize: TtsSettingsSynthesize
}

/** Bridges the `mimotts` configuration namespace onto the settings page. */
export class TtsSettingsController {
  private readonly form: SettingsFormModel<TtsSettings>
  private readonly store: SnapshotStore<TtsSettingsState>
  private readonly unsubscribeStatus: () => void
  private readonly status = ttsStatusStore()

  /**
   * @param scope - the bound settings scope for the `mimotts` namespace.
   */
  constructor(private readonly scope: SettingsFormScope<TtsSettings>) {
    this.form = new SettingsFormModel(scope, [
      settingsTextField('apiKeyEnv'),
      settingsTextField('baseUrl'),
      settingsTextField('model'),
      settingsTextField('voice'),
      settingsTextField('voiceSamplePath'),
      settingsTextField('style'),
      settingsNumberField('maxChars'),
      settingsNumberField('timeoutMs'),
    ])
    this.store = this.form.bind(() => this.projection())
    // The status mirror answers "is a key configured", which the form section
    // cannot: secrets never ride a response. Its changes republish the page.
    this.unsubscribeStatus = this.status.subscribe(() => { this.store.set(this.projection()) })
    void refreshTtsStatus()
  }

  /**
   * Build the face the page's slot registration injects.
   * @returns the page's snapshot and its form actions.
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

  /** @returns the page projection rebuilt from the form and the status mirror. */
  private projection(): TtsSettingsState {
    return {
      ...this.form.shell(),
      apiKeyEnv: this.form.field('apiKeyEnv'),
      apiKeyConfigured: this.status.getSnapshot().configured,
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
