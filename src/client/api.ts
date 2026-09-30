/**
 * Browser → Host calls for speech synthesis.
 *
 * Both halves share their route vocabulary through `src/settings.ts`; the
 * browser sends text and receives WAV bytes, so the MiMo API key never enters
 * the page. Failures arrive as stable codes the UI maps to localized copy.
 * @module dsh-mimotts/client/api
 */

import {
  MIMOTTS_RECORDING_HEADER, MIMOTTS_RECORDINGS_PATH, MIMOTTS_STATUS_PATH, MIMOTTS_SYNTHESIZE_PATH,
} from '../settings.ts'
import type {
  TtsErrorCode, TtsRecordingsIndex, TtsStatusView, TtsSynthesizeRequest,
} from '../settings.ts'

/** A synthesize failure carrying the Host's stable code. */
export class TtsClientError extends Error {
  /**
   * @param code - stable failure code; `generic` when the Host gave none.
   * @param message - Host-supplied detail, safe to show.
   */
  constructor(readonly code: TtsErrorCode | 'generic', message: string) {
    super(message)
    this.name = 'TtsClientError'
  }
}

/**
 * Read the Host's resolved engine configuration (never secrets).
 * @returns the effective model, voice, endpoint, and key/sample presence.
 */
export async function fetchTtsStatus(): Promise<TtsStatusView> {
  const response = await fetch(MIMOTTS_STATUS_PATH, { method: 'GET', cache: 'no-store' })
  if (!response.ok) {
    throw new TtsClientError('generic', `status request failed with HTTP ${response.status}`)
  }
  return await response.json() as TtsStatusView
}

/**
 * Synthesize one text into playable WAV audio.
 * @param request - text and optional style/voice overrides (settings-page
 * audition previews unsaved values through these).
 * @returns the WAV payload as a Blob ready for `URL.createObjectURL`.
 * @throws {TtsClientError} when the Host refuses or the transport fails.
 */
export async function requestSpeech(request: TtsSynthesizeRequest): Promise<Blob> {
  let response: Response
  try {
    response = await fetch(MIMOTTS_SYNTHESIZE_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch (error) {
    throw new TtsClientError('generic', error instanceof Error ? error.message : String(error))
  }
  if (response.ok) return await response.blob()
  let code: TtsErrorCode | 'generic' = 'generic'
  let message = `synthesize request failed with HTTP ${response.status}`
  try {
    const body = await response.json() as { error?: { code?: unknown; message?: unknown } }
    if (typeof body.error?.code === 'string') code = body.error.code as TtsErrorCode
    if (typeof body.error?.message === 'string') message = body.error.message
  } catch {
    // Non-JSON failure body: keep the generic HTTP message.
  }
  throw new TtsClientError(code, message)
}

/** The identity of a freshly saved recording version. */
export interface RecordingRef {
  /** Recording-node id. */
  recId: string
  /** Version id within that node. */
  verId: string
}

/**
 * List the persisted speech history.
 * @returns the recordings index (empty when none recorded yet).
 */
export async function fetchRecordings(): Promise<TtsRecordingsIndex> {
  const response = await fetch(MIMOTTS_RECORDINGS_PATH, { method: 'GET', cache: 'no-store' })
  if (!response.ok) {
    throw new TtsClientError('generic', `recordings request failed with HTTP ${response.status}`)
  }
  return await response.json() as TtsRecordingsIndex
}

/**
 * Synthesize and persist one text, returning both the audio and its identity
 * in history. Used by the speak action so every read-aloud is remembered.
 * @param request - text and optional style/voice overrides.
 * @returns the WAV blob and the new recording reference.
 * @throws {TtsClientError} when the Host refuses or the transport fails.
 */
export async function requestRecording(request: TtsSynthesizeRequest): Promise<{ blob: Blob; ref: RecordingRef }> {
  let response: Response
  try {
    response = await fetch(MIMOTTS_RECORDINGS_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch (error) {
    throw new TtsClientError('generic', error instanceof Error ? error.message : String(error))
  }
  if (response.ok) {
    const blob = await response.blob()
    const header = response.headers.get(MIMOTTS_RECORDING_HEADER)
    let ref: RecordingRef = { recId: '', verId: '' }
    if (header !== null) {
      try {
        ref = JSON.parse(atob(header)) as RecordingRef
      } catch {
        // Header malformed: the audio still plays, just without a history ref.
      }
    }
    return { blob, ref }
  }
  let code: TtsErrorCode | 'generic' = 'generic'
  let message = `recording request failed with HTTP ${response.status}`
  try {
    const body = await response.json() as { error?: { code?: unknown; message?: unknown } }
    if (typeof body.error?.code === 'string') code = body.error.code as TtsErrorCode
    if (typeof body.error?.message === 'string') message = body.error.message
  } catch {
    // Non-JSON failure body: keep the generic HTTP message.
  }
  throw new TtsClientError(code, message)
}

/**
 * Re-synthesize a recording's text with the engine's current settings,
 * appending a new version. Earlier versions stay intact for comparison.
 * @param recId - the recording node id.
 * @returns the new version's reference.
 */
export async function resynthesizeRecording(recId: string): Promise<RecordingRef> {
  let response: Response
  try {
    response = await fetch(`${MIMOTTS_RECORDINGS_PATH}/resynth?rec=${encodeURIComponent(recId)}`, { method: 'POST' })
  } catch (error) {
    throw new TtsClientError('generic', error instanceof Error ? error.message : String(error))
  }
  if (response.ok) return await response.json() as RecordingRef
  let message = `re-synthesis failed with HTTP ${response.status}`
  try {
    const body = await response.json() as { error?: { message?: unknown } }
    if (typeof body.error?.message === 'string') message = body.error.message
  } catch {
    // Keep the generic HTTP message.
  }
  throw new TtsClientError('generic', message)
}

/**
 * Delete one version from history.
 * @param recId - the recording node id.
 * @param verId - the version id to remove.
 */
export async function deleteRecordingVersion(recId: string, verId: string): Promise<void> {
  const response = await fetch(
    `${MIMOTTS_RECORDINGS_PATH}/version?rec=${encodeURIComponent(recId)}&ver=${encodeURIComponent(verId)}`,
    { method: 'DELETE' },
  )
  if (!response.ok && response.status !== 204) {
    throw new TtsClientError('generic', `delete failed with HTTP ${response.status}`)
  }
}

/**
 * The URL serving one version's WAV file.
 * @param recId - the recording node id.
 * @param verId - the version id.
 * @returns an absolute path under the plugin's recordings route.
 */
export function recordingFileUrl(recId: string, verId: string): string {
  return `${MIMOTTS_RECORDINGS_PATH}/file?rec=${encodeURIComponent(recId)}&ver=${encodeURIComponent(verId)}`
}
