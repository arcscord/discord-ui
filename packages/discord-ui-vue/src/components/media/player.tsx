import type { AudioView, VideoView } from "@arcscord/discord-ui-core";
import { defaultMediaLabels, formatMediaTime, linkUrl, mediaProgressBackground, mediaUrl } from "@arcscord/discord-ui-core";
import { nextTick, onBeforeUnmount, onMounted, shallowRef } from "vue";
import { defineRenderer } from "../../rendering";

type PlayerProps = { media: AudioView | VideoView; source: string | undefined };

/** Keyed by the resolved source in each public wrapper to reset playback state. */
export const Player = defineRenderer<PlayerProps, PlayerProps, Record<string, never>>("MediaPlayer", ["media", "source"], [], (input, display) => {
  const element = shallowRef<HTMLMediaElement | null>(null);
  const container = shallowRef<HTMLElement | null>(null);
  const playing = shallowRef(false);
  const started = shallowRef(false);
  const previewButton = shallowRef<HTMLButtonElement | null>(null);
  const playButton = shallowRef<HTMLButtonElement | null>(null);
  const downloadHref = shallowRef(linkUrl(input().media.url));
  const ended = shallowRef(false);
  const volumeOpen = shallowRef(false);
  const muteButton = shallowRef<HTMLButtonElement | null>(null);
  const currentTime = shallowRef(0);
  const duration = shallowRef(0);
  const volume = shallowRef(1);
  const muted = shallowRef(false);
  const speed = shallowRef(1);
  const loading = shallowRef(false);
  const failed = shallowRef(false);
  const playError = shallowRef(false);
  const fullscreen = shallowRef(false);
  const fullscreenActive = shallowRef(false);
  let disposed = false;

  function syncFullscreen() {
    fullscreenActive.value = document.fullscreenElement === container.value;
  }

  onMounted(() => {
    downloadHref.value = linkUrl(input().media.url) ?? linkUrl(element.value?.src);
    fullscreen.value = typeof container.value?.requestFullscreen === "function" && document.fullscreenEnabled;
    document.addEventListener("fullscreenchange", syncFullscreen);
    syncFullscreen();
  });
  onBeforeUnmount(() => {
    disposed = true;
    document.removeEventListener("fullscreenchange", syncFullscreen);
    element.value?.pause();
  });

  function sync() {
    const player = element.value;
    if (!player)
      return;
    currentTime.value = Number.isFinite(player.currentTime)
      ? player.currentTime
      : 0;
    duration.value = Number.isFinite(player.duration) && player.duration > 0
      ? player.duration
      : 0;
    playing.value = !player.paused && !player.ended;
    ended.value = player.ended;
    volume.value = player.volume;
    muted.value = player.muted;
    speed.value = player.playbackRate;
  }

  async function startPlayback() {
    const transferFocus = document.activeElement === previewButton.value;
    started.value = true;
    sync();
    if (transferFocus) {
      await nextTick();
      if (!disposed)
        playButton.value?.focus();
    }
  }

  async function toggle() {
    const player = element.value;
    if (!player)
      return;
    playError.value = false;
    if (!player.paused) {
      player.pause();
      return;
    }
    try {
      loading.value = true;
      await player.play();
    }
    catch (error) {
      loading.value = false;
      if (disposed || (error instanceof Error && error.name === "AbortError" && player.paused))
        return;
      playError.value = true;
      sync();
    }
  }

  function seek(event: Event) {
    if (!element.value || !duration.value)
      return;
    element.value.currentTime = Math.min(duration.value, Math.max(0, Number((event.target as HTMLInputElement).value)));
    sync();
  }

  function changeVolume(event: Event) {
    if (!element.value)
      return;
    element.value.volume = Number((event.target as HTMLInputElement).value);
    element.value.muted = false;
    sync();
  }

  function toggleMute() {
    volumeOpen.value = true;
    if (!element.value)
      return;
    element.value.muted = !element.value.muted;
    sync();
  }

  function leaveVolume(event: MouseEvent) {
    const control = event.currentTarget as HTMLElement;
    if (!control.contains(document.activeElement))
      volumeOpen.value = false;
  }

  function blurVolume(event: FocusEvent) {
    const control = event.currentTarget as HTMLElement;
    if (!(event.relatedTarget instanceof Node) || !control.contains(event.relatedTarget))
      volumeOpen.value = false;
  }

  function closeVolume(event: KeyboardEvent) {
    if (event.key !== "Escape")
      return;
    event.preventDefault();
    event.stopPropagation();
    muteButton.value?.focus();
    volumeOpen.value = false;
  }

  function changeSpeed() {
    if (!element.value)
      return;
    const rates = [1, 1.5, 2];
    element.value.playbackRate = rates[(rates.indexOf(speed.value) + 1) % rates.length]!;
    sync();
  }

  function ready() {
    loading.value = false;
    sync();
  }

  async function enterFullscreen() {
    try {
      if (document.fullscreenElement === container.value)
        await document.exitFullscreen();
      else
        await container.value?.requestFullscreen();
    }
    catch {
      // A browser may refuse fullscreen while playback remains available.
    }
  }

  return () => {
    const { media, source } = input();
    const labels = {
      ...defaultMediaLabels,
      ...display.labels,
    };
    const video = media.kind === "video";
    const name = video ? media.alt : media.name;
    const total = duration.value || (Number.isFinite(media.durationSeconds) && (media.durationSeconds ?? 0) > 0
      ? media.durationSeconds!
      : 0);
    const download = downloadHref.value;
    const poster = video
      ? mediaUrl(media.posterUrl, display.allowRemoteMedia, display.remoteMediaAllowlist)
      : undefined;
    const voice = !video && media.voice;
    const hasWaveform = voice && Boolean(media.waveform?.length);
    const time = (
      <span class="dui-player-time">
        {voice
          ? formatMediaTime(currentTime.value > 0
              ? currentTime.value
              : total)
          : `${formatMediaTime(currentTime.value)} / ${formatMediaTime(total)}`}
      </span>
    );
    if (!source || failed.value) {
      return (
        <div class="dui-media-error" role="status">
          {`${labels.mediaUnavailable}: ${name}`}
        </div>
      );
    }
    const events = {
      onLoadedmetadata: sync,
      onDurationchange: sync,
      onTimeupdate: sync,
      onVolumechange: sync,
      onRatechange: sync,
      onPlay: startPlayback,
      onPause: ready,
      onEnded: ready,
      onPlaying: ready,
      onCanplay: ready,
      onWaiting: () => {
        loading.value = true;
      },
      onError: () => {
        failed.value = true;
        loading.value = false;
        playing.value = false;
      },
    };
    return (
      <div
        ref={container}
        data-started={started.value}
        class={[
          "dui-player",
          video
            ? "dui-player-video"
            : media.voice ? "dui-player-audio dui-player-voice" : "dui-player-audio",
        ]}
      >
        {video
          ? <video ref={element} src={source} poster={poster} width={media.width} height={media.height} preload={poster ? "none" : "metadata"} playsinline aria-label={name} {...events} />
          : <audio ref={element} src={source} preload="none" aria-label={name} {...events} />}
        {video && (
          <button ref={previewButton} class="dui-player-preview-play" type="button" hidden={started.value} aria-label={labels.mediaPlay} onClick={toggle}>
            <span class="dui-player-icon dui-player-icon-play" aria-hidden="true" />
          </button>
        )}
        {!video && !voice && (
          <div class="dui-player-file-header">
            <span class="dui-player-file-icon" aria-hidden="true" />
            <div class="dui-player-title">
              {download
                ? <a class="dui-player-name" href={download} download>{name}</a>
                : <span class="dui-player-name">{name}</span>}
              {media.size && <span class="dui-player-size">{media.size}</span>}
            </div>
          </div>
        )}
        <div class="dui-player-controls" hidden={video && !started.value}>
          <button
            ref={playButton}
            class="dui-player-play"
            type="button"
            aria-label={playing.value
              ? labels.mediaPause
              : ended.value ? labels.mediaReplay : labels.mediaPlay}
            onClick={toggle}
          >
            <span
              class={`dui-player-icon dui-player-icon-${playing.value
                ? "pause"
                : ended.value ? "replay" : "play"}`}
              aria-hidden="true"
            />
          </button>
          {!voice && time}
          <div class={["dui-player-timeline", hasWaveform && "dui-player-timeline-waveform"]}>
            {voice && media.waveform?.length
              ? (
                  <div class="dui-waveform" aria-hidden="true">
                    {media.waveform.slice(0, 256).map((value, index) => (
                      <span
                        key={index}
                        class="dui-waveform-bar"
                        data-played={total > 0 && index / Math.min(256, media.waveform!.length) < currentTime.value / total}
                        style={{ height: `${Math.max(4, Math.min(1, Math.max(0, Number.isFinite(value)
                          ? value
                          : 0)) * 100)}%` }}
                      />
                    ))}
                  </div>
                )
              : null}
            <input
              class="dui-player-seek"
              type="range"
              aria-label={labels.mediaSeek}
              aria-valuetext={`${formatMediaTime(currentTime.value)} / ${formatMediaTime(total)}`}
              min="0"
              max={total || 1}
              step="0.1"
              value={currentTime.value}
              disabled={!duration.value}
              onInput={seek}
              style={{
                backgroundSize: mediaProgressBackground(currentTime.value, duration.value),
              }}
            />
          </div>
          {voice && time}
          {voice
            ? (
                <button
                  class="dui-player-speed"
                  type="button"
                  aria-label={labels.mediaPlaybackSpeed}
                  aria-description={`${speed.value}×`}
                  onClick={changeSpeed}
                >
                  {`${speed.value}X`}
                </button>
              )
            : null}
          <div
            class="dui-player-volume-control"
            role="group"
            aria-label={labels.mediaVolume}
            data-open={volumeOpen.value}
            onMouseenter={() => { volumeOpen.value = true; }}
            onMouseleave={leaveVolume}
            onFocusin={() => { volumeOpen.value = true; }}
            onFocusout={blurVolume}
            onKeydown={closeVolume}
          >
            <button ref={muteButton} class="dui-player-mute" type="button" aria-label={muted.value ? labels.mediaUnmute : labels.mediaMute} onClick={toggleMute}>
              <span class={`dui-player-icon dui-player-icon-${muted.value ? "speaker-muted" : "speaker"}`} aria-hidden="true" />
            </button>
            <div class="dui-player-volume-popover">
              <input class="dui-player-volume" type="range" aria-label={labels.mediaVolume} min="0" max="1" step="0.05" value={muted.value ? 0 : volume.value} onInput={changeVolume} style={{ backgroundSize: `100% ${(muted.value ? 0 : volume.value) * 100}%` }} />
            </div>
          </div>
          {video && fullscreen.value && (
            <button class="dui-player-fullscreen" type="button" aria-label={fullscreenActive.value ? labels.mediaExitFullscreen : labels.mediaFullscreen} onClick={enterFullscreen}>
              <span class={`dui-player-icon dui-player-icon-${fullscreenActive.value ? "exit-fullscreen" : "fullscreen"}`} aria-hidden="true" />
            </button>
          )}
        </div>
        {!voice && download && (
          <a class="dui-player-download" href={download} download aria-label={labels.downloadFile.replace("{name}", name)}>
            <span class="dui-player-icon dui-player-icon-download" aria-hidden="true" />
          </a>
        )}
        {loading.value && <div role="status">{labels.mediaLoading}</div>}
        {playError.value && <div role="status">{labels.mediaUnavailable}</div>}
      </div>
    );
  };
});
