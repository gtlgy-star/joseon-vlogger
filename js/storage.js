(function () {
  'use strict';
  const KEY = 'joseon-vlogger-mvp-v1';
  function freshState() {
    return { version: 1, clientProjectId: '', inquiryAcknowledged: false, student: { classNo: '', groupName: '', authorName: '' }, protagonist: { name: '', status: '', gender: '' }, selectedTopics: [], topicNotes: {}, diary: { title: '', body: '' }, diaryChecks: { voice: '', culture: '', reflection: '' }, writingView: 'diary', resultView: 'diary', historicalBasis: [], evidenceNotes: {}, storyboard: window.Storyboard ? window.Storyboard.createDefault() : [], shooting: { roles: [{ id: 'role-1', role: '주인공', name: '' }, { id: 'role-2', role: '촬영 담당', name: '' }], location: '', customLocation: '', props: '', thumbnailCode: '' }, currentStep: 0, maxVisitedStep: 0, updatedAt: new Date().toISOString() };
  }
  function normalize(raw) {
    const base = freshState();
    if (!raw || typeof raw !== 'object') return base;
    const merged = { ...base, ...raw, student: { ...base.student, ...(raw.student || {}) }, protagonist: { ...base.protagonist, ...(raw.protagonist || {}) }, topicNotes: { ...base.topicNotes, ...(raw.topicNotes || {}) }, diary: { ...base.diary, ...(raw.diary || {}) }, diaryChecks: { ...base.diaryChecks, ...(raw.diaryChecks || {}) }, shooting: { ...base.shooting, ...(raw.shooting || {}) } };
    merged.writingView = raw.writingView === 'diary' || raw.writingView === 'storyboard' ? raw.writingView : (Number(raw.currentStep) >= 4 ? 'storyboard' : 'diary');
    merged.resultView = raw.resultView === 'storyboard' ? 'storyboard' : 'diary';
    merged.inquiryAcknowledged = typeof raw.inquiryAcknowledged === 'boolean' ? raw.inquiryAcknowledged : Number(raw.currentStep) > 0;
    merged.storyboard = window.Storyboard.normalize(raw.storyboard);
    const formerLifeTopics = new Set(['coming-of-age','wedding','funeral','ancestral-rite','eldest-son','adoption','genealogy','marriage-change']);
    const selectedTopic = Array.isArray(raw.selectedTopics) ? raw.selectedTopics[0] : '';
    merged.selectedTopics = selectedTopic ? [formerLifeTopics.has(selectedTopic) ? 'confucian-life' : selectedTopic] : [];
    merged.storyboard = merged.storyboard.map((scene) => formerLifeTopics.has(scene.topicCode) ? { ...scene, topicCode: 'confucian-life' } : scene);
    merged.currentStep = Math.max(0, Math.min(6, Number(merged.currentStep) || 0));
    merged.maxVisitedStep = Math.max(merged.currentStep, Math.min(6, Number(merged.maxVisitedStep) || 0));
    return merged;
  }
  window.JoseonStorage = {
    key: KEY,
    freshState,
    normalize,
    load() { try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch (_) { return freshState(); } },
    save(state) { state.updatedAt = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(state)); },
    clear() { localStorage.removeItem(KEY); }
  };
})();
