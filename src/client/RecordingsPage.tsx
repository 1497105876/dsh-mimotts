/**
 * The `语音历史` settings page: every read-aloud recording, each with its
 * versions for in-place playback, re-synthesis, and deletion. Configuration
 * lives on the Plugins page's bundle card (`plugins.bundle.config`); this
 * page owns the feature surface instead.
 * @module dsh-mimotts/client/RecordingsPage
 */

import { RecordingsList } from './RecordingsList.tsx'
import type { RecordingsPageProps } from './slots.ts'

/**
 * Render the speech-history settings page.
 * @param props - localized copy.
 * @returns the recordings list with its heading and hint.
 */
export function RecordingsPage({ t }: RecordingsPageProps) {
  return (
    <div className="mimotts-recordingsPage">
      <h3 className="mimotts-recordingsTitle">{t('recordings')}</h3>
      <p className="mimotts-recordingsHintText">{t('recordingsHint')}</p>
      <RecordingsList t={t} />
    </div>
  )
}
