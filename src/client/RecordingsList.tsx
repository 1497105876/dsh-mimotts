/**
 * The speech-history browser: every recorded text, each with its versions.
 * Versions play in place, re-synthesize against the current engine settings
 * (appending a fresh take, old ones kept), or get deleted. There is no
 * dedicated comparison view — per the design, each take is played on its own.
 * @module dsh-mimotts/client/RecordingsList
 */

import { useCallback, useEffect, useState } from 'react'
import {
  deleteRecordingVersion, fetchRecordings, recordingFileUrl, resynthesizeRecording, TtsClientError,
} from './api.ts'
import type { TtsRecordingsIndex } from '../settings.ts'
import type { MimottsLocaleKey } from './locales.ts'

/** Props: the localized copy function bound to this plugin's dictionary. */
export interface RecordingsListProps {
  t: (key: MimottsLocaleKey) => string
}

/**
 * Render the persisted speech history with per-version playback, re-synthesis,
 * and deletion.
 * @param props - localized copy.
 * @returns the history list, or an empty-state note before the first load.
 */
export function RecordingsList({ t }: RecordingsListProps) {
  const [index, setIndex] = useState<TtsRecordingsIndex | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyRec, setBusyRec] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    fetchRecordings()
      .then(setIndex)
      .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : String(failure)))
  }, [])

  useEffect(() => { load() }, [load])

  const onResynth = useCallback((recId: string) => {
    setBusyRec(recId)
    resynthesizeRecording(recId)
      .then(load)
      .catch((failure: unknown) => setError(failure instanceof TtsClientError ? failure.message : String(failure)))
      .finally(() => setBusyRec(null))
  }, [load])

  const onDelete = useCallback((recId: string, verId: string) => {
    deleteRecordingVersion(recId, verId)
      .then(load)
      .catch((failure: unknown) => setError(failure instanceof TtsClientError ? failure.message : String(failure)))
  }, [load])

  if (index === null || index.entries.length === 0) {
    return <p className="mimotts-recordingsEmpty">{t('recordingsEmpty')}</p>
  }
  return (
    <div className="mimotts-recordings">
      {error !== null ? <p className="mimotts-fieldError" role="status">{error}</p> : null}
      {index.entries.map((entry) => (
        <div key={entry.id} className="mimotts-recording">
          <p className="mimotts-recordingText" title={entry.text}>{entry.text}</p>
          <ul className="mimotts-versions">
            {entry.versions.map((version) => (
              <li key={version.id} className="mimotts-version">
                <audio className="mimotts-versionAudio" src={recordingFileUrl(entry.id, version.id)} controls preload="none" />
                <span className="mimotts-versionMeta">
                  {new Date(version.createdAt).toLocaleString()}
                  {version.voice !== null ? ` · ${version.voice}` : ''}
                  {version.style !== null ? ` · ${version.style}` : ''}
                </span>
                <button
                  type="button"
                  className="mimotts-recButton"
                  disabled={busyRec === entry.id}
                  onClick={() => { onResynth(entry.id) }}
                >
                  {busyRec === entry.id ? t('reSynthesizing') : t('reSynthesize')}
                </button>
                <button
                  type="button"
                  className="mimotts-recButton"
                  onClick={() => { onDelete(entry.id, version.id) }}
                >
                  {t('deleteVersion')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
