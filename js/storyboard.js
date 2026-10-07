(function () {
  'use strict';
  let serial = 0;
  const id = (prefix) => `${prefix}-${Date.now()}-${++serial}`;
  const dialogueLine = (speakerId = 'protagonist', text = '') => ({ id: id('dialogue'), speakerId, text });
  const scene = () => ({ id: id('scene'), type: 'scene', topicCode: '', description: '', details: '', dialogues: [dialogueLine()] });
  const castMember = (role = '') => ({ id: id('cast'), role });
  function createDefault() {
    return [
      { id: 'intro', type: 'intro', title: '', description: '', dialogue: '', cast: [] },
      scene(), scene(),
      { id: 'conclusion', type: 'conclusion', description: '', dialogue: '' }
    ];
  }
  function normalize(items) {
    if (!Array.isArray(items)) return createDefault();
    const savedIntro = items.find((x) => x && x.type === 'intro') || createDefault()[0];
    const intro = {
      ...savedIntro,
      cast: Array.isArray(savedIntro.cast)
        ? savedIntro.cast.slice(0, 4).map((member) => ({ id: member.id || id('cast'), role: member.role || member.name || '' }))
        : []
    };
    const middle = items.filter((x) => x && x.type === 'scene').slice(0, 6).map((item) => {
      const savedDialogues = Array.isArray(item.dialogues)
        ? item.dialogues.slice(0, 5).map((line) => ({ id: line.id || id('dialogue'), speakerId: line.speakerId || 'protagonist', text: line.text || '' }))
        : [dialogueLine(item.speakerId || 'protagonist', item.dialogue || '')];
      return { ...item, details: item.details || '', dialogues: savedDialogues.length ? savedDialogues : [dialogueLine()] };
    });
    while (middle.length < 2) middle.push(scene());
    const end = items.find((x) => x && x.type === 'conclusion') || createDefault()[3];
    return [intro, ...middle, end];
  }
  function add(items) { const next = normalize(items); if (next.length >= 8) return next; next.splice(next.length - 1, 0, scene()); return next; }
  function remove(items, sceneId) { const next = normalize(items); if (next.filter((x) => x.type === 'scene').length <= 2) return next; return next.filter((x) => x.id !== sceneId); }
  function addDialogue(items, sceneId) {
    const next = normalize(items);
    const target = next.find((item) => item.id === sceneId && item.type === 'scene');
    if (target && target.dialogues.length < 5) target.dialogues.push(dialogueLine());
    return next;
  }
  function removeDialogue(items, sceneId, dialogueId) {
    const next = normalize(items);
    const target = next.find((item) => item.id === sceneId && item.type === 'scene');
    if (target && target.dialogues.length > 1) target.dialogues = target.dialogues.filter((line) => line.id !== dialogueId);
    return next;
  }
  function move(items, sceneId, direction) {
    const next = normalize(items);
    const currentIndex = next.findIndex((item) => item.id === sceneId && item.type === 'scene');
    if (currentIndex < 0) return next;
    const targetIndex = currentIndex + direction;
    if (targetIndex <= 0 || targetIndex >= next.length - 1 || next[targetIndex].type !== 'scene') return next;
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    return next;
  }
  function reorder(items, sceneId, targetId) {
    const next = normalize(items);
    const fromIndex = next.findIndex((item) => item.id === sceneId && item.type === 'scene');
    const targetIndex = next.findIndex((item) => item.id === targetId && item.type === 'scene');
    if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) return next;
    const [moved] = next.splice(fromIndex, 1);
    const insertIndex = next.findIndex((item) => item.id === targetId) + (fromIndex < targetIndex ? 1 : 0);
    next.splice(insertIndex, 0, moved);
    return next;
  }
  function addCast(items, role = '') {
    const next = normalize(items);
    const intro = next.find((item) => item.type === 'intro');
    if (intro.cast.length < 4) intro.cast.push(castMember(role));
    return next;
  }
  function removeCast(items, castId) {
    const next = normalize(items);
    const intro = next.find((item) => item.type === 'intro');
    intro.cast = intro.cast.filter((member) => member.id !== castId);
    next.filter((item) => item.type === 'scene').forEach((item) => item.dialogues.forEach((line) => { if (line.speakerId === castId) line.speakerId = 'protagonist'; }));
    return next;
  }
  window.Storyboard = { createDefault, normalize, add, remove, addDialogue, removeDialogue, move, reorder, addCast, removeCast };
})();
