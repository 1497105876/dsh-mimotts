/**
 * The compact player bar: play/pause, a draggable progress track, and the
 * position/duration readout.
 *
 * The track is a `role="slider"` surface — pointer drag with capture,
 * click-to-seek, and arrow-key seeking — so the progress bar is operable
 * without a pointer. Dragging seeks continuously: WAV playback from an object
 * URL repositions cheaply, and the thumb follows the pointer instead of
 * lagging behind it.
 * @module dsh-mimotts/client/PlayerBar
 */

import { useCallback, useRef, useState } from 'react'
import { IconPauseOutlineRegular, IconPlayOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { AudioPlayerState } from './use-audio-player.ts'

/** Copy the bar renders, already localized by its caller. */
export interface PlayerBarLabels {
  /** Accessible name of the play control while paused. */
  play: string
  /** Accessible name of the pause control while playing. */
  pause: string
  /** Accessible name of the progress slider. */
  progress: string
}

/** What the bar needs from its player. */
export interface PlayerBarProps {
  /** Live playback state. */
  state: AudioPlayerState
  /** Start or pause playback. */
  onToggle: () => void
  /** @param seconds - absolute position to seek to. */
  onSeek: (seconds: number) => void
  /** Localized control names. */
  labels: PlayerBarLabels
}

/** Format seconds as `m:ss` (clamped at zero; durations are short). */
function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60)
  const remainder = whole % 60
  return `${String(minutes)}:${remainder < 10 ? '0' : ''}${String(remainder)}`
}

/**
 * Render one player bar.
 * @param props - playback state, controls, and localized names.
 * @returns the play control, the seekable track, and the time readout.
 */
export function PlayerBar({ state, onToggle, onSeek, labels }: PlayerBarProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const duration = state.duration > 0 ? state.duration : 0
  const ratio = duration > 0 ? Math.min(1, state.currentTime / duration) : 0

  /** @param clientX - pointer x in viewport coordinates. @returns the seek target in seconds. */
  const positionAt = useCallback((clientX: number): number => {
    const track = trackRef.current
    if (track === null) return 0
    const bounds = track.getBoundingClientRect()
    const fraction = bounds.width > 0
      ? Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width))
      : 0
    return fraction * duration
  }, [duration])

  return (
    <div className="mimotts-bar">
      <button
        type="button"
        className="mimotts-barButton"
        aria-label={state.playing ? labels.pause : labels.play}
        onClick={onToggle}
      >
        {state.playing ? <IconPauseOutlineRegular size={14} /> : <IconPlayOutlineRegular size={14} />}
      </button>
      <div
        ref={trackRef}
        className={dragging ? 'mimotts-track mimotts-trackDragging' : 'mimotts-track'}
        role="slider"
        tabIndex={0}
        aria-label={labels.progress}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, Math.round(duration))}
        aria-valuenow={Math.round(state.currentTime)}
        aria-valuetext={`${clock(state.currentTime)} / ${clock(duration)}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
          onSeek(positionAt(event.clientX))
        }}
        onPointerMove={(event) => {
          if (!dragging) return
          onSeek(positionAt(event.clientX))
        }}
        onPointerUp={(event) => {
          if (!dragging) return
          setDragging(false)
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
          onSeek(positionAt(event.clientX))
        }}
        onPointerCancel={() => { setDragging(false) }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 15 : 5
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault()
            onSeek(state.currentTime + step)
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault()
            onSeek(state.currentTime - step)
          } else if (event.key === 'Home') {
            event.preventDefault()
            onSeek(0)
          } else if (event.key === 'End' && duration > 0) {
            event.preventDefault()
            onSeek(duration)
          }
        }}
      >
        <div className="mimotts-fill" style={{ width: `${(ratio * 100).toFixed(2)}%` }} />
        <div className="mimotts-thumb" style={{ left: `${(ratio * 100).toFixed(2)}%` }} />
      </div>
      <span className="mimotts-time">{clock(state.currentTime)} / {clock(duration)}</span>
    </div>
  )
}
