import type { AudioView, VideoView } from "@arcscord/discord-ui-core";
import { defaultMediaLabels, formatMediaTime, linkUrl, mediaProgressBackground, mediaUrl } from "@arcscord/discord-ui-core";
import { useEffect, useRef, useState } from "react";
import { useDisplayOptions } from "../display-context";

/** Mounted with a source key by the public Audio and Video wrappers. */
export function Player({ media, source }: { media: AudioView | VideoView; source: string | undefined }) {
  const display = useDisplayOptions();
  const labels = {
    ...defaultMediaLabels,
    ...display.labels,
  };
  const elementRef = useRef<HTMLMediaElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [download, setDownload] = useState(() => linkUrl(media.url));
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const restorePlayFocusRef = useRef(false);
  const [ended, setEnded] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const muteButtonRef = useRef<HTMLButtonElement>(null);
  const [failed, setFailed] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const total = duration || (Number.isFinite(media.durationSeconds) && (media.durationSeconds ?? 0) > 0
    ? media.durationSeconds!
    : 0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const video = media.kind === "video";
  const voice = media.kind === "audio" && media.voice === true;
  const name = video ? media.alt : media.name;
  const poster = video
    ? mediaUrl(media.posterUrl, display.allowRemoteMedia, display.remoteMediaAllowlist)
    : undefined;

  useEffect(() => {
    setFullscreen(Boolean(containerRef.current?.requestFullscreen && document.fullscreenEnabled));
    const player = elementRef.current;
    setDownload(linkUrl(media.url) ?? linkUrl(player?.src));
    function syncFullscreen() {
      setFullscreenActive(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      player?.pause();
      document.removeEventListener("fullscreenchange", syncFullscreen);
    };
  }, [media.url]);

  useEffect(() => {
    if (started && restorePlayFocusRef.current) {
      playButtonRef.current?.focus({ preventScroll: true });
      restorePlayFocusRef.current = false;
    }
  }, [started]);

  async function togglePlayback() {
    const player = elementRef.current;
    if (!player)
      return;
    setRejected(false);
    if (!player.paused) {
      player.pause();
      return;
    }
    try {
      setLoading(true);
      await player.play();
    }
    catch (error) {
      setLoading(false);
      if (error instanceof Error && error.name === "AbortError" && player.paused)
        return;
      setRejected(true);
    }
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === containerRef.current)
        await document.exitFullscreen();
      else
        await containerRef.current?.requestFullscreen();
    }
    catch {
      // Inline playback remains available when the browser refuses fullscreen.
    }
  }

  const events = {
    onPlay: () => {
      restorePlayFocusRef.current = document.activeElement === previewButtonRef.current;
      setStarted(true);
      setPlaying(true);
      setEnded(false);
    },
    onPause: () => {
      setPlaying(false);
      setLoading(false);
    },
    onEnded: () => {
      setEnded(true);
      setPlaying(false);
      setLoading(false);
    },
    onTimeUpdate: () => {
      setCurrentTime(elementRef.current?.currentTime ?? 0);
      setEnded(elementRef.current?.ended ?? false);
    },
    onDurationChange: () => {
      const value = elementRef.current?.duration;
      if (value !== undefined && Number.isFinite(value))
        setDuration(value);
    },
    onVolumeChange: () => {
      setVolume(elementRef.current?.volume ?? 1);
      setMuted(elementRef.current?.muted ?? false);
    },
    onRateChange: () => setSpeed(elementRef.current?.playbackRate ?? 1),
    onWaiting: () => setLoading(true),
    onPlaying: () => setLoading(false),
    onCanPlay: () => setLoading(false),
    onError: () => {
      setFailed(true);
      setPlaying(false);
      setLoading(false);
    },
  };
  if (!source || failed) {
    return (
      <div className="dui-media-error" role="status">
        {`${labels.mediaUnavailable}: ${name}`}
        {source && failed && !voice && download && (
          <>
            {" "}
            <a className="dui-player-name" href={download} download>{labels.downloadFile.replace("{name}", name)}</a>
          </>
        )}
      </div>
    );
  }
  const time = (
    <span className="dui-player-time">
      {voice
        ? formatMediaTime(currentTime > 0
            ? currentTime
            : total)
        : `${formatMediaTime(currentTime)} / ${formatMediaTime(total)}`}
    </span>
  );
  return (
    <div ref={containerRef} data-started={started} className={`dui-player dui-player-${video ? "video" : "audio"}${voice ? " dui-player-voice" : ""}`}>
      {video
        ? <video ref={(node) => { elementRef.current = node; }} src={source} poster={poster} width={media.width} height={media.height} preload={poster ? "none" : "metadata"} playsInline aria-label={name} {...events} />
        : <audio ref={(node) => { elementRef.current = node; }} src={source} preload="none" aria-label={name} {...events} />}
      {video && (
        <button ref={previewButtonRef} className="dui-player-preview-play" hidden={started} type="button" aria-label={labels.mediaPlay} onClick={() => { void togglePlayback(); }}>
          <span className="dui-player-icon dui-player-icon-play" aria-hidden="true" />
        </button>
      )}
      {!video && !voice && (
        <div className="dui-player-file-header">
          <span className="dui-player-file-icon" aria-hidden="true" />
          <div className="dui-player-title">
            {download
              ? <a className="dui-player-name" href={download} download>{name}</a>
              : <span className="dui-player-name">{name}</span>}
            {media.size && <span className="dui-player-size">{media.size}</span>}
          </div>
        </div>
      )}
      <div className="dui-player-controls" hidden={video && !started}>
        <button
          ref={playButtonRef}
          className="dui-player-play"
          type="button"
          aria-label={playing
            ? labels.mediaPause
            : ended ? labels.mediaReplay : labels.mediaPlay}
          onClick={() => { void togglePlayback(); }}
        >
          <span
            className={`dui-player-icon dui-player-icon-${playing
              ? "pause"
              : ended ? "replay" : "play"}`}
            aria-hidden="true"
          />
        </button>
        {!voice && time}
        <div className={`dui-player-timeline${voice && media.waveform?.length
          ? " dui-player-timeline-waveform"
          : ""}`}
        >
          {voice && media.waveform?.length
            ? (
                <div className="dui-waveform" aria-hidden="true">
                  {media.waveform.slice(0, 256).map((sample, index) => (
                    <span
                      // Waveform samples are positional within a source-keyed player.
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                      className="dui-waveform-bar"
                      data-played={total > 0 && index / Math.min(256, media.waveform!.length) < currentTime / total}
                      style={{ height: `${Math.max(4, Math.min(1, Number.isFinite(sample)
                        ? sample
                        : 0) * 100)}%` }}
                    />
                  ))}
                </div>
              )
            : null}
          <input
            className="dui-player-seek"
            type="range"
            aria-label={labels.mediaSeek}
            aria-valuetext={`${formatMediaTime(currentTime)} / ${formatMediaTime(total)}`}
            min={0}
            max={total || 1}
            step={0.1}
            value={currentTime}
            disabled={!duration}
            style={{
              backgroundSize: mediaProgressBackground(currentTime, duration),
            }}
            onChange={(event) => {
              if (elementRef.current && duration) {
                elementRef.current.currentTime = Math.max(0, Math.min(duration, Number(event.target.value)));
                setCurrentTime(elementRef.current.currentTime);
              }
            }}
          />
        </div>
        {voice && time}
        {voice && (
          <button
            className="dui-player-speed"
            type="button"
            aria-label={labels.mediaPlaybackSpeed}
            aria-description={`${speed}×`}
            onClick={() => {
              if (elementRef.current) {
                elementRef.current.playbackRate = speed === 1
                  ? 1.5
                  : speed === 1.5
                    ? 2
                    : 1;
              }
            }}
          >
            {`${speed}X`}
          </button>
        )}
        <div
          className="dui-player-volume-control"
          data-open={volumeOpen}
          role="group"
          aria-label={labels.mediaVolume}
          onMouseEnter={() => setVolumeOpen(true)}
          onMouseLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement))
              setVolumeOpen(false);
          }}
          onFocusCapture={() => setVolumeOpen(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setVolumeOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              muteButtonRef.current?.focus();
              setVolumeOpen(false);
            }
          }}
        >
          <button
            ref={muteButtonRef}
            className="dui-player-mute"
            type="button"
            aria-label={muted ? labels.mediaUnmute : labels.mediaMute}
            onClick={() => {
              if (elementRef.current)
                elementRef.current.muted = !elementRef.current.muted;
              setVolumeOpen(true);
            }}
          >
            <span className={`dui-player-icon dui-player-icon-${muted ? "speaker-muted" : "speaker"}`} aria-hidden="true" />
          </button>
          <div className="dui-player-volume-popover">
            <input
              className="dui-player-volume"
              type="range"
              aria-label={labels.mediaVolume}
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              style={{ backgroundSize: `100% ${(muted ? 0 : volume) * 100}%` }}
              onChange={(event) => {
                if (elementRef.current) {
                  elementRef.current.volume = Number(event.target.value);
                  elementRef.current.muted = false;
                }
              }}
            />
          </div>
        </div>
        {video && fullscreen && <button className="dui-player-fullscreen" type="button" aria-label={fullscreenActive ? labels.mediaExitFullscreen : labels.mediaFullscreen} onClick={() => { void toggleFullscreen(); }}><span className={`dui-player-icon dui-player-icon-${fullscreenActive ? "exit-fullscreen" : "fullscreen"}`} aria-hidden="true" /></button>}
      </div>
      {!voice && download && <a className="dui-player-download" href={download} download aria-label={labels.downloadFile.replace("{name}", name)}><span className="dui-player-icon dui-player-icon-download" aria-hidden="true" /></a>}
      {loading && <div role="status">{labels.mediaLoading}</div>}
      {rejected && <div role="status">{labels.mediaUnavailable}</div>}
    </div>
  );
}
