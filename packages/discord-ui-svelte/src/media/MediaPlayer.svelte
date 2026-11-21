<script lang="ts">
  import type { AudioView, VideoView } from "@arcscord/discord-ui-core";
  import { defaultMediaLabels, formatMediaTime, linkUrl, mediaProgressBackground } from "@arcscord/discord-ui-core";
  import { onMount, tick } from "svelte";
  import { getDisplayOptions } from "../display-context.js";

  const { media, source, poster }: { media: AudioView | VideoView; source: string | undefined; poster?: string | undefined } = $props();
  const display = getDisplayOptions();
  const labels = $derived({
    ...defaultMediaLabels,
    ...display().labels,
  });
  const isVideo = $derived(media.kind === "video");
  const isVoice = $derived(media.kind === "audio" && media.voice === true);
  const name = $derived(media.kind === "video"
    ? media.alt
    : media.name);
  let resolvedDownloadUrl = $state<string | undefined>();
  const downloadUrl = $derived(linkUrl(media.url) ?? resolvedDownloadUrl);
  let element: HTMLMediaElement | undefined = $state();
  let container: HTMLDivElement | undefined = $state();
  let previewPlay: HTMLButtonElement | undefined = $state();
  let controlsPlay: HTMLButtonElement | undefined = $state();
  let started = $state(false);
  let playing = $state(false);
  let ended = $state(false);
  let volumeOpen = $state(false);
  let loading = $state(false);
  let failed = $state(false);
  let playFailed = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let volume = $state(1);
  let muted = $state(false);
  let playbackRate = $state(1);
  let canFullscreen = $state(false);
  let fullscreenActive = $state(false);
  const displayedDuration = $derived(duration || (Number.isFinite(media.durationSeconds) && (media.durationSeconds ?? 0) > 0
    ? media.durationSeconds!
    : 0));

  onMount(() => {
    resolvedDownloadUrl = linkUrl(element?.src);
    canFullscreen = Boolean(container?.requestFullscreen && document.fullscreenEnabled);
    const updateFullscreen = () => fullscreenActive = document.fullscreenElement === container;
    updateFullscreen();
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreen);
      element?.pause();
    };
  });

  function sync() {
    if (!element)
      return;
    currentTime = Number.isFinite(element.currentTime)
      ? element.currentTime
      : 0;
    duration = Number.isFinite(element.duration) && element.duration > 0
      ? element.duration
      : 0;
    playing = !element.paused && !element.ended;
    ended = element.ended;
    volume = element.volume;
    muted = element.muted;
    playbackRate = element.playbackRate;
  }

  async function startPlayback() {
    const moveFocus = document.activeElement === previewPlay;
    started = true;
    sync();
    if (moveFocus) {
      await tick();
      controlsPlay?.focus();
    }
  }

  async function togglePlayback() {
    if (!element)
      return;
    playFailed = false;
    if (!element.paused) {
      element.pause();
      return;
    }
    try {
      loading = true;
      await element.play();
    }
    catch (error) {
      loading = false;
      const cancelled = error instanceof DOMException && error.name === "AbortError" && (!element || element.paused);
      if (!cancelled)
        playFailed = true;
      sync();
    }
  }

  function seek(event: Event) {
    if (element && Number.isFinite(element.duration) && element.duration > 0) {
      element.currentTime = Math.min(element.duration, Number((event.currentTarget as HTMLInputElement).value));
      sync();
    }
  }

  function setVolume(event: Event) {
    if (element) {
      element.volume = Number((event.currentTarget as HTMLInputElement).value);
      element.muted = false;
      sync();
    }
  }

  function toggleMute() {
    volumeOpen = true;
    if (element) {
      element.muted = !element.muted;
      sync();
    }
  }

  function closeVolumeOnLeave(event: MouseEvent) {
    if (!(event.currentTarget as HTMLElement).contains(document.activeElement))
      volumeOpen = false;
  }

  function closeVolumeOnBlur(event: FocusEvent) {
    if (!(event.relatedTarget instanceof Node) || !(event.currentTarget as HTMLElement).contains(event.relatedTarget))
      volumeOpen = false;
  }

  function volumeKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(".dui-player-mute")?.focus();
      volumeOpen = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function cycleSpeed() {
    if (element) {
      element.playbackRate = playbackRate === 1
        ? 1.5
        : playbackRate === 1.5
        ? 2
        : 1;
      sync();
    }
  }

  function ready() {
    loading = false;
    sync();
  }

  function fail() {
    failed = true;
    loading = false;
    playing = false;
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement === container)
        await document.exitFullscreen();
      else
        await container?.requestFullscreen();
    }
    catch {
      // Fullscreen can be refused while inline playback remains available.
    }
  }
</script>

{#if !source || failed}
  <div class="dui-media-error" role="status">{display().labels.mediaUnavailable}: {name}</div>
{:else}
  <div bind:this={container} data-started={started} class={[
    "dui-player",
    isVideo ? "dui-player-video" : "dui-player-audio",
    isVoice && "dui-player-voice",
  ]}>
    {#if isVideo}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video bind:this={element} src={source} {poster} width={media.kind === "video"
        ? media.width
        : undefined} height={media.kind === "video"
        ? media.height
        : undefined} preload={poster ? "none" : "metadata"} playsinline aria-label={name}
             onplay={startPlayback} onpause={ready} onended={ready} ontimeupdate={sync} ondurationchange={sync} onloadedmetadata={sync} onvolumechange={sync} onratechange={sync}
             onwaiting={() => loading = true} oncanplay={ready} onplaying={ready} onerror={fail}></video>
    {:else}
      <audio bind:this={element} src={source} preload="none" aria-label={name}
             onplay={startPlayback} onpause={ready} onended={ready} ontimeupdate={sync} ondurationchange={sync} onloadedmetadata={sync} onvolumechange={sync} onratechange={sync}
             onwaiting={() => loading = true} oncanplay={ready} onplaying={ready} onerror={fail}></audio>
    {/if}
    {#if isVideo}
      <button bind:this={previewPlay} class="dui-player-preview-play" type="button" hidden={started} aria-label={labels.mediaPlay} onclick={togglePlayback}>
        <span class="dui-player-icon dui-player-icon-play" aria-hidden="true"></span>
      </button>
    {/if}
    {#if media.kind === "audio" && !isVoice}
      <div class="dui-player-file-header">
        <span class="dui-player-file-icon" aria-hidden="true"></span>
        <div class="dui-player-title">
          {#if downloadUrl}<a class="dui-player-name" href={downloadUrl} download>{name}</a>{:else}<span class="dui-player-name">{name}</span>{/if}
          {#if media.size}<span class="dui-player-size">{media.size}</span>{/if}
        </div>
      </div>
    {/if}
    <div class="dui-player-controls" hidden={isVideo && !started}>
      <button bind:this={controlsPlay} class="dui-player-play" type="button" aria-label={playing
        ? labels.mediaPause
        : ended ? labels.mediaReplay : labels.mediaPlay} onclick={togglePlayback}>
        <span class={`dui-player-icon dui-player-icon-${playing
          ? "pause"
          : ended ? "replay" : "play"}`} aria-hidden="true"></span>
      </button>
      {#if !isVoice}<span class="dui-player-time">{formatMediaTime(currentTime)} / {formatMediaTime(displayedDuration)}</span>{/if}
      <div class={["dui-player-timeline", isVoice && media.kind === "audio" && Boolean(media.waveform?.length) && "dui-player-timeline-waveform"]}>
        {#if isVoice && media.kind === "audio" && media.waveform?.length}
          <div class="dui-waveform" aria-hidden="true">
            {#each media.waveform.slice(0, 256) as sample, index (index)}
              <span class="dui-waveform-bar" data-played={displayedDuration > 0 && index / Math.min(256, media.waveform.length) < currentTime / displayedDuration} style:height={`${Math.max(4, Math.min(1, Math.max(0, Number.isFinite(sample)
                ? sample
                : 0)) * 100)}%`}></span>
            {/each}
          </div>
        {/if}
        <input class="dui-player-seek" style:background-size={mediaProgressBackground(currentTime, duration)} type="range" min="0" max={displayedDuration || 1} step="0.1" value={currentTime} disabled={!duration} aria-label={labels.mediaSeek} aria-valuetext={`${formatMediaTime(currentTime)} / ${formatMediaTime(displayedDuration)}`} oninput={seek} />
      </div>
      {#if isVoice}<span class="dui-player-time">{formatMediaTime(currentTime > 0
        ? currentTime
        : displayedDuration)}</span>{/if}
      {#if isVoice}<button class="dui-player-speed" type="button" aria-label={labels.mediaPlaybackSpeed} {...{ "aria-description": `${playbackRate}×` }} onclick={cycleSpeed}>{playbackRate}X</button>{/if}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions (Escape is delegated from the native controls inside this group.) -->
      <div class="dui-player-volume-control" data-open={volumeOpen} role="group" aria-label={labels.mediaVolume} onmouseenter={() => volumeOpen = true} onmouseleave={closeVolumeOnLeave} onfocusin={() => volumeOpen = true} onfocusout={closeVolumeOnBlur} onkeydown={volumeKeydown}>
        <button class="dui-player-mute" type="button" aria-label={muted ? labels.mediaUnmute : labels.mediaMute} onclick={toggleMute}>
          <span class={`dui-player-icon dui-player-icon-${muted ? "speaker-muted" : "speaker"}`} aria-hidden="true"></span>
        </button>
        <div class="dui-player-volume-popover">
          <input class="dui-player-volume" style:background-size={`100% ${(muted ? 0 : volume) * 100}%`} type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} aria-label={labels.mediaVolume} oninput={setVolume} />
        </div>
      </div>
      {#if isVideo && canFullscreen}
        <button class="dui-player-fullscreen" type="button" aria-label={fullscreenActive ? labels.mediaExitFullscreen : labels.mediaFullscreen} onclick={fullscreen}>
          <span class={`dui-player-icon dui-player-icon-${fullscreenActive ? "exit-fullscreen" : "fullscreen"}`} aria-hidden="true"></span>
        </button>
      {/if}
    </div>
    {#if !isVoice && downloadUrl}
      <a class="dui-player-download" href={downloadUrl} download aria-label={display().labels.downloadFile.replace("{name}", name)}><span class="dui-player-icon dui-player-icon-download" aria-hidden="true"></span></a>
    {/if}
    {#if loading}<div role="status">{labels.mediaLoading}</div>{/if}
    {#if playFailed}<div role="status">{display().labels.mediaUnavailable}</div>{/if}
  </div>
{/if}
