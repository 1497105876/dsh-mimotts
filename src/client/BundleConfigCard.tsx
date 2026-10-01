/**
 * The plugin's configuration card on the Plugins page: registered into the
 * `plugins.bundle.config` keyed slot (key = the npm package name), it renders
 * inside the bundle's detail page between its description and its rows. The
 * MiMo endpoint, model, voice (preset or clone sample), default style,
 * request budget, and the write-only API key all live here — plus a sample
 * player that previews the card's current style and voice, including edits
 * not yet saved.
 *
 * The card renders the shared settings form frame, so saving, discarding,
 * override badges, and read-only/unavailable handling follow the platform's
 * configuration-form conventions exactly. The Plugins page dispatches this
 * slot with `view: 'page'` only, but the entry stays honest about it.
 * @module dsh-mimotts/client/BundleConfigCard
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  SettingsForm, SettingsValueField,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { AUDITION_TEXT } from '../settings.ts'
import { TtsClientError } from './api.ts'
import { errorKeyFor } from './SpeakAction.tsx'
import type { MimottsLocaleKey } from './locales.ts'
import { PlayerBar } from './PlayerBar.tsx'
import type { BundleConfigCardProps } from './slots.ts'
import { useAudioPlayer } from './use-audio-player.ts'

/**
 * Render the plugin's configuration card.
 * @param props - localized copy, the staged form snapshot, and its actions.
 * @returns the configuration form with its sample player, or null for a view
 * this slot does not render (bundle configuration is page-only).
 */
export function BundleConfigCard({ view, useForm, edit, resetField, save, discard, synthesize, t }: BundleConfigCardProps) {
  const state = useForm(snapshot => snapshot)
  const [sampleUrl, setSampleUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<TtsClientError | null>(null)
  const player = useAudioPlayer(sampleUrl)
  const toggle = player.toggle
  const autoplay = useRef(false)
  const sampleRef = useRef<string | null>(null)
  sampleRef.current = sampleUrl

  // Release the sample object URL when the page closes.
  useEffect(() => () => {
    if (sampleRef.current !== null) URL.revokeObjectURL(sampleRef.current)
  }, [])

  useEffect(() => {
    if (sampleUrl === null || !autoplay.current) return
    autoplay.current = false
    toggle()
  }, [sampleUrl, toggle])

  const audition = useCallback(() => {
    if (busy) return
    setBusy(true)
    setFailure(null)
    void synthesize({
      text: AUDITION_TEXT,
      style: state.style.text.trim() === '' ? undefined : state.style.text,
      voice: state.voice.text.trim() === '' ? undefined : state.voice.text,
    }).then((blob) => {
      autoplay.current = true
      setBusy(false)
      setSampleUrl((previous) => {
        if (previous !== null) URL.revokeObjectURL(previous)
        return URL.createObjectURL(blob)
      })
    }).catch((error: unknown) => {
      setBusy(false)
      setFailure(error instanceof TtsClientError ? error : new TtsClientError('generic', String(error)))
    })
  }, [busy, state.style.text, state.voice.text, synthesize])

  if (view !== 'page') return null
  const disabled = !state.writable
  const failureKey: MimottsLocaleKey | null = failure === null ? null : errorKeyFor(failure)
  return (
    <SettingsForm
      labels={{
        unavailable: t('unavailable'),
        readOnly: t('readOnly'),
        saveFailed: t('saveFailed'),
        save: t('save'),
        saving: t('saving'),
      }}
      state={state}
      onSave={save}
      onDiscard={discard}
    >
      <SettingsValueField
        id="mimotts-api-key-env"
        label={t('apiKeyEnv')}
        hint={t('apiKeyEnvHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        disabled={disabled}
        {...state.apiKeyEnv}
        onEdit={(text) => { edit('apiKeyEnv', text) }}
        onReset={() => { resetField('apiKeyEnv') }}
      />
      <p className="mimotts-auditionHint" role="status" style={{ marginTop: -6 }}>
        {state.apiKeyConfigured ? t('apiKeySet') : t('apiKeyUnset')}
      </p>
      <SettingsValueField
        id="mimotts-base-url"
        label={t('baseUrl')}
        hint={t('baseUrlHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        disabled={disabled}
        {...state.baseUrl}
        onEdit={(text) => { edit('baseUrl', text) }}
        onReset={() => { resetField('baseUrl') }}
      />
      <SettingsValueField
        id="mimotts-model"
        label={t('model')}
        hint={t('modelHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        disabled={disabled}
        {...state.model}
        onEdit={(text) => { edit('model', text) }}
        onReset={() => { resetField('model') }}
      />
      <SettingsValueField
        id="mimotts-voice"
        label={t('voice')}
        hint={t('voiceHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        disabled={disabled}
        {...state.voice}
        onEdit={(text) => { edit('voice', text) }}
        onReset={() => { resetField('voice') }}
      />
      <SettingsValueField
        id="mimotts-voice-sample"
        label={t('voiceSamplePath')}
        hint={t('voiceSamplePathHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        disabled={disabled}
        {...state.voiceSamplePath}
        onEdit={(text) => { edit('voiceSamplePath', text) }}
        onReset={() => { resetField('voiceSamplePath') }}
      />
      <SettingsValueField
        id="mimotts-style"
        label={t('style')}
        hint={t('styleHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        disabled={disabled}
        {...state.style}
        onEdit={(text) => { edit('style', text) }}
        onReset={() => { resetField('style') }}
      />
      <SettingsValueField
        id="mimotts-max-chars"
        label={t('maxChars')}
        hint={t('maxCharsHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        numeric
        disabled={disabled}
        {...state.maxChars}
        onEdit={(text) => { edit('maxChars', text) }}
        onReset={() => { resetField('maxChars') }}
      />
      <SettingsValueField
        id="mimotts-timeout"
        label={t('timeoutMs')}
        hint={t('timeoutMsHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        numeric
        disabled={disabled}
        {...state.timeoutMs}
        onEdit={(text) => { edit('timeoutMs', text) }}
        onReset={() => { resetField('timeoutMs') }}
      />
      <div className="mimotts-audition">
        <p className="mimotts-auditionHint">{t('auditionHint')}</p>
        <div className="mimotts-auditionRow">
          <button type="button" className="mimotts-auditionButton" disabled={busy} onClick={audition}>
            {busy ? t('auditioning') : t('audition')}
          </button>
          {sampleUrl !== null
            ? (
              <PlayerBar
                state={player.state}
                onToggle={player.toggle}
                onSeek={player.seek}
                labels={{ play: t('play'), pause: t('pause'), progress: t('progress') }}
              />
            )
            : null}
        </div>
        {failureKey !== null ? <p className="mimotts-fieldError" role="status">{t(failureKey)}</p> : null}
      </div>
    </SettingsForm>
  )
}
