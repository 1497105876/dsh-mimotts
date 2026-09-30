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

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  SettingsForm, SettingsSecretField, SettingsValueField,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { AUDITION_TEXT } from '../settings.ts'
import { TtsClientError } from './api.ts'
import { errorKeyFor } from './SpeakAction.tsx'
import type { MimottsLocaleKey } from './locales.ts'
import { PlayerBar } from './PlayerBar.tsx'
import { RecordingsList } from './RecordingsList.tsx'
import type { TtsSettingsSectionProps } from './slots.ts'
import { useAudioPlayer } from './use-audio-player.ts'

/**
 * Render the speech-synthesis settings page.
 * @param props - localized copy, the staged form snapshot, and its actions.
 * @returns the settings form with its sample player.
 */
export function TtsSettingsSection({ useForm, edit, resetField, save, discard, synthesize, t }: TtsSettingsSectionProps) {
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
      <SettingsSecretField
        id="mimotts-api-key"
        label={t('apiKey')}
        hint={t('apiKeyHint')}
        disabled={disabled}
        text={state.apiKey.text}
        configured={state.apiKey.configured}
        stateLabel={state.apiKey.configured ? t('apiKeySet') : t('apiKeyUnset')}
        onEdit={(text) => { edit('apiKey', text) }}
      />
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
      <div className="mimotts-recordingsSection">
        <h3 className="mimotts-recordingsTitle">{t('recordings')}</h3>
        <p className="mimotts-recordingsHintText">{t('recordingsHint')}</p>
        <RecordingsList t={t} />
      </div>
    </SettingsForm>
  )
}
