/**
 * The speak entry in the finalized assistant message's action strip: a volume
 * button that synthesizes the message with MiMo TTS, and — once audio exists —
 * a floating mini player with a draggable progress bar.
 *
 * The button lives exactly where the platform keeps per-message actions
 * (between copy and branch). The player floats below the icon row so the row's
 * 28px chrome never reflows; while a player is open the strip stops fading on
 * hover-out (`styles.ts`), so audio stays visible wherever the pointer goes.
 * @module dsh-mimotts/client/SpeakAction
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { IconLoadingOutlineRegular, IconWarningTriangleOutlineRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { TtsClientError } from './api.ts'
import { speakableTextFor } from './chat-text.ts'
import type { MimottsLocaleKey } from './locales.ts'
import { PlayerBar } from './PlayerBar.tsx'
import type { SpeakActionProps } from './slots.ts'
import { IconVolumeOutlineRegular } from './SpeakerIcon.tsx'
import { useAudioPlayer } from './use-audio-player.ts'

/** Lifecycle of one entry's audio. */
type SpeakPhase = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Map a failure onto the dictionary key the entry shows.
 * @param failure - the synthesis failure, or `empty` for a text-less message.
 * @returns the localized copy key.
 */
export function errorKeyFor(failure: TtsClientError | 'empty' | 'unconfigured'): MimottsLocaleKey {
  if (failure === 'empty') return 'emptyText'
  if (failure === 'unconfigured') return 'error.notConfigured'
  switch (failure.code) {
    case 'not-configured': return 'error.notConfigured'
    case 'bad-request': return 'error.badRequest'
    case 'text-too-long': return 'error.badRequest'
    case 'timeout': return 'error.timeout'
    case 'upstream-error': return 'error.upstream'
    case 'invalid-audio': return 'error.invalidAudio'
    case 'voice-sample-unreadable': return 'error.voiceSample'
    default: return 'error.generic'
  }
}

/**
 * Render one message's speak control and open player.
 * @param props - the message identity, the injected engine verbs, the Chat
 * selector hook, and localized copy.
 * @returns the volume button with its optional player and failure notice.
 */
export function SpeakAction({ messageId, useChat, useStatus, ensureStatus, synthesize, t }: SpeakActionProps) {
  const status = useStatus(snapshot => snapshot)
  const text = useChat(snapshot => speakableTextFor(snapshot, messageId))
  const [phase, setPhase] = useState<SpeakPhase>('idle')
  const [failure, setFailure] = useState<TtsClientError | 'empty' | 'unconfigured' | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const player = useAudioPlayer(source)
  const toggle = player.toggle
  // Panel visibility is decoupled from whether audio exists, so it can be
  // dismissed (click-outside / Esc) without discarding the audio source.
  const [panelOpen, setPanelOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement | null>(null)

  // Dismiss the floating panel when clicking outside it or pressing Escape,
  // and pause playback so no audio lingers with no visible controls.
  useEffect(() => {
    if (!panelOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current
      if (root !== null && root.contains(event.target as Node)) return
      setPanelOpen(false)
      player.pause()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPanelOpen(false)
      player.pause()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [panelOpen])
  // Set when a fresh synthesis should start playing as soon as its audio lands.
  const autoplay = useRef(false)
  // The live object URL, held for revocation outside React's state updates.
  const sourceRef = useRef<string | null>(null)
  sourceRef.current = source

  // Release the object URL when the entry unmounts.
  useEffect(() => () => {
    if (sourceRef.current !== null) URL.revokeObjectURL(sourceRef.current)
  }, [])

  useEffect(() => {
    if (source === null || !autoplay.current) return
    autoplay.current = false
    toggle()
  }, [source, toggle])

  const onClick = useCallback(() => {
    if (phase === 'loading') return
    if (source !== null) {
      if (!panelOpen) setPanelOpen(true)
      player.toggle()
      return
    }
    if (text === undefined || text === '') {
      setFailure('empty')
      return
    }
    if (!status.configured) {
      setFailure('unconfigured')
      return
    }
    setPhase('loading')
    setFailure(null)
    setPanelOpen(true)
    void synthesize({ text }).then((blob) => {
      autoplay.current = true
      setPhase('ready')
      setSource((previous) => {
        if (previous !== null) URL.revokeObjectURL(previous)
        return URL.createObjectURL(blob)
      })
    }).catch((error: unknown) => {
      setPhase('error')
      setFailure(error instanceof TtsClientError ? error : new TtsClientError('generic', String(error)))
    })
  }, [phase, player, source, status.configured, synthesize, text])

  const open = source !== null
  const buttonLabel = phase === 'loading'
    ? t('synthesize')
    : player.state.playing
      ? t('pause')
      : open
        ? t('play')
        : t('speak')

  return (
    <span ref={rootRef} className={open ? 'mimotts-root mimotts-open' : 'mimotts-root'}>
      <Tooltip label={buttonLabel} side="bottom">
        <button
          type="button"
          className="mimotts-button"
          aria-label={buttonLabel}
          aria-pressed={player.state.playing}
          onClick={onClick}
          onMouseEnter={ensureStatus}
          onFocus={ensureStatus}
        >
          {phase === 'loading'
            ? <span className="mimotts-spin"><IconLoadingOutlineRegular size={15} /></span>
            : <IconVolumeOutlineRegular size={15} />}
        </button>
      </Tooltip>
      {failure !== null
        ? (
          <Tooltip label={t(errorKeyFor(failure))} side="bottom">
            <span className="mimotts-failure" role="img" aria-label={t(errorKeyFor(failure))}>
              <IconWarningTriangleOutlineRegular size={14} />
            </span>
          </Tooltip>
        )
        : null}
      {panelOpen && open
        ? (
          <span className="mimotts-panel">
            <PlayerBar
              state={player.state}
              onToggle={player.toggle}
              onSeek={player.seek}
              labels={{ play: t('play'), pause: t('pause'), progress: t('progress') }}
            />
          </span>
        )
        : null}
    </span>
  )
}
