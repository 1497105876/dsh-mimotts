/**
 * Browser → Host calls for speech synthesis.
 *
 * Both halves share their route vocabulary through `src/settings.ts`; the
 * browser sends text and receives WAV bytes, so the MiMo API key never enters
 * the page. Failures arrive as stable codes the UI maps to localized copy.
 * @module dsh-mimotts/client/api
 */

import {
  MIMOTTS_STATUS_PATH, MIMOTTS_SYNTHESIZE_PATH,
} from '../settings.ts'
import type {
  TtsErrorCode, TtsStatusView, TtsSynthesizeRequest,
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
