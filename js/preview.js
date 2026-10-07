(function () {
  'use strict';

  const TITLE_DURATION = 2000;
  const STEP_DURATION = 5000;
  const ENDING_DURATION = 4000;
  let playbackTimer = null;
  let playing = false;
  let completed = false;
  let index = 0;
  let dialogueIndex = 0;
  let slides = [];
  let onChange = null;

  const dialogueLines = () => slides[index]?.dialogues?.length
    ? slides[index].dialogues
    : [{ text: slides[index]?.dialogue || '' }];

  function clearPlaybackTimer() {
    if (playbackTimer !== null) window.clearTimeout(playbackTimer);
    playbackTimer = null;
  }

  function emit() {
    if (onChange) onChange(index, playing, dialogueIndex, completed);
  }

  function advance() {
    if (dialogueIndex < dialogueLines().length - 1) {
      dialogueIndex += 1;
      return true;
    }
    if (index < slides.length - 1) {
      index += 1;
      dialogueIndex = 0;
      return true;
    }
    return false;
  }

  function currentDuration() {
    if (slides[index]?.kind === 'title') return TITLE_DURATION;
    if (slides[index]?.kind === 'credits') return Number(slides[index]?.durationMs) || ENDING_DURATION;
    return STEP_DURATION;
  }

  function finishPlayback() {
    clearPlaybackTimer();
    playing = false;
    completed = true;
    emit();
  }

  function scheduleNext() {
    clearPlaybackTimer();
    if (!playing) return;
    playbackTimer = window.setTimeout(() => {
      playbackTimer = null;
      if (!playing) return;
      if (!advance()) {
        finishPlayback();
        return;
      }
      emit();
      scheduleNext();
    }, currentDuration());
  }

  window.PreviewPlayer = {
    setup(nextSlides, callback) {
      clearPlaybackTimer();
      slides = Array.isArray(nextSlides) ? nextSlides : [];
      onChange = callback;
      index = 0;
      dialogueIndex = 0;
      playing = false;
      completed = false;
      emit();
    },
    play() {
      if (!slides.length || playing) return;
      if (completed) {
        index = 0;
        dialogueIndex = 0;
        completed = false;
      }
      playing = true;
      emit();
      scheduleNext();
    },
    pause() {
      clearPlaybackTimer();
      playing = false;
      emit();
    },
    restart() {
      clearPlaybackTimer();
      index = 0;
      dialogueIndex = 0;
      playing = false;
      completed = false;
      emit();
    },
    previous() {
      if (!slides.length) return;
      clearPlaybackTimer();
      playing = false;
      completed = false;
      if (dialogueIndex > 0) dialogueIndex -= 1;
      else if (index > 0) {
        index -= 1;
        dialogueIndex = dialogueLines().length - 1;
      }
      emit();
    },
    next() {
      if (!slides.length) return;
      clearPlaybackTimer();
      playing = false;
      completed = false;
      advance();
      emit();
    },
    destroy() {
      clearPlaybackTimer();
      playing = false;
      completed = false;
      index = 0;
      dialogueIndex = 0;
      slides = [];
      onChange = null;
    }
  };
})();
