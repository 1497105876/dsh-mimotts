/**
 * The staged settings form behind the `语音合成` page: one `SettingsFormModel`
 * over the `mimotts` configuration namespace, plus the write-only API-key
 * control (the literal is a `role('secret')` field — it never rides a form
 * response, so the page learns only whether one is configured, through the
 * Host's status route).
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
  /** The staged key plus whether the Host holds one. */
  apiKey: SettingsFieldState & { configured: boolean }
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

/** The registration-side face the settings page's slot entry injects. */
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
      settingsTextField('baseUrl'),
      settingsTextField('model'),
      settingsTextField('voice'),
      settingsTextField('voiceSamplePath'),
      settingsTextField('style'),
      settingsNumberField('maxChars'),
      settingsNumberField('timeoutMs'),
    ], [{ field: 'apiKey', write: text => this.writeApiKey(text) }])
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

  /**
   * Write the staged key through the settings namespace's mutate path, then
   * re-read whether the Host now holds one.
   * @param text - the staged key literal.
   * @returns whether the Host accepted the write.
   */
  private async writeApiKey(text: string): Promise<boolean> {
    const accepted = await this.scope.mutate(
      [{ op: 'set', path: ['apiKey'], value: text }],
      this.scope.getSnapshot().revision,
    )
    await refreshTtsStatus()
    return accepted
  }

  /** @returns the page projection rebuilt from the form and the status mirror. */
  private projection(): TtsSettingsState {
    return {
      ...this.form.shell(),
      apiKey: { ...this.form.field('apiKey'), configured: this.status.getSnapshot().configured },
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
