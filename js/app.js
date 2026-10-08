(function () {
  'use strict';
  const D = window.JoseonData;
  const Backgrounds = window.JoseonBackgrounds;
  const Props = window.JoseonProps;
  const Lifestyles = window.JoseonLifestyles;
  let state = window.JoseonStorage.load();
  const app = document.getElementById('app');
  const progress = document.getElementById('progress');
  const toast = document.getElementById('toast');
  const activityBar = document.querySelector('.activity-bar');
  const inquiryGate = document.getElementById('inquiry-gate');
  const inquiryScroll = document.getElementById('inquiry-scroll');
  const inquiryStart = document.getElementById('inquiry-start');
  const timerStartKey = 'joseon-vlogger-activity-timer-start-v1';
  const timerSessionKey = 'joseon-vlogger-activity-session-v1';
  const timerDurationSeconds = 20 * 60;
  const timerSchedule = [
    { label: '1 주인공 정하기', shortLabel: '1 주인공 정하기', seconds: 3 * 60 },
    { label: '2 일기 주제 정하기', shortLabel: '2 일기 주제 정하기', seconds: 5 * 60 },
    { label: '3-1 일기쓰기 · 3-2 스토리보드 작성하기', shortLabel: '3-1 일기쓰기 · 3-2 스토리보드 작성하기', seconds: 10 * 60 },
    { label: '4 완성·미리보기', shortLabel: '4 완성·미리보기', seconds: 2 * 60 }
  ];
  const evidenceStepEnabled = D.features?.historicalEvidenceStep !== false;
  const visibleSteps = evidenceStepEnabled ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 4, 5, 6];
  const circledNumbers = ['', '①', '②', '③', '④', '⑤', '⑥'];
  let activeStoryIndex = 0;
  let inquiryReturnFocus = null;
  let timerInterval = null;
  let diaryPreviewCleanup = null;
  let readOnlyPreview = false;
  let preservedWorkingState = null;
  const topicArt = Object.freeze({
    'status-life': 'assets/textbook/status-and-procession.jpg',
    respect: 'assets/textbook/confucian-family.jpg',
    'confucian-life': 'assets/textbook/confucian-life-collage.png'
  });
  const characterArt = Object.freeze({
    yangban: {
      '남': 'assets/images/character-yangban-male.png',
      '여': 'assets/images/character-yangban-female.png'
    },
    jungin: {
      '남': 'assets/images/character-jungin-male.png',
      '여': 'assets/images/character-jungin-female.png'
    },
    sangmin: {
      '남': 'assets/images/character-sangmin-male.png',
      '여': 'assets/images/character-sangmin-female.png'
    },
    cheonmin: {
      '남': 'assets/images/character-cheonmin-male.png',
      '여': 'assets/images/character-cheonmin-female.png'
    }
  });
  const situationArt = Object.freeze({
    'yangban-study': 'assets/images/life-yangban-study.png',
    'yangban-official': 'assets/images/life-yangban-official.png',
    'jungin-office': 'assets/images/life-jungin-office.png',
    'jungin-specialist': 'assets/images/life-jungin-specialist.png',
    'sangmin-farm': 'assets/images/life-sangmin-farming.png',
    'sangmin-work': 'assets/images/life-sangmin-production.png',
    'sangmin-duty': 'assets/images/life-sangmin-tax-military.png',
    'cheonmin-office': 'assets/images/life-cheonmin-government-office.png',
    'cheonmin-yangban-house': 'assets/images/life-cheonmin-yangban-house.png'
  });
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const findStatus = () => D.statuses.find((x) => x.code === state.protagonist.status);
  const findTopic = (code) => D.topics.find((x) => x.code === code);
  const allEvidence = () => state.selectedTopics.flatMap((code) => D.evidence[code] || []);
  const save = () => { if (!readOnlyPreview) window.JoseonStorage.save(state); };
  const getTimerStart = () => Number(sessionStorage.getItem(timerStartKey)) || 0;
  const hasActiveSession = () => sessionStorage.getItem(timerSessionKey) === 'started';
  function formatElapsed(seconds) { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(seconds % 60).padStart(2, '0')}`; }
  function timerMarkup() {
    return `<div class="activity-timer" data-activity-timer><div class="activity-timeline" role="progressbar" aria-label="20분 활동 시간" aria-valuemin="0" aria-valuemax="20" aria-valuenow="0"><span class="activity-timeline-fill" data-timer-fill></span>${timerSchedule.map((item, index) => `<span class="activity-time-segment" data-timer-segment="${index}" style="--segment-size:${item.seconds}" title="${item.label} · ${item.seconds / 60}분"><b>${item.shortLabel}</b><small>${item.seconds / 60}분</small></span>`).join('')}</div><div class="activity-time-scale" aria-hidden="true"><span>0분</span><span>3분</span><span>8분</span><span>18분</span><span>20분 · 마감</span></div></div>`;
  }
  function updateActivityTimer() {
    const startedAt = getTimerStart();
    const elapsed = startedAt ? Math.min(timerDurationSeconds, Math.max(0, Math.floor((Date.now() - startedAt) / 1000))) : 0;
    const progressPercent = elapsed / timerDurationSeconds * 100;
    let activeSegment = 0;
    let boundary = 0;
    for (let index = 0; index < timerSchedule.length; index += 1) {
      boundary += timerSchedule[index].seconds;
      if (elapsed < boundary) { activeSegment = index; break; }
      activeSegment = Math.min(index + 1, timerSchedule.length - 1);
    }
    document.querySelectorAll('[data-activity-timer]').forEach((timer) => {
      const text = timer.querySelector('[data-timer-text]');
      const fill = timer.querySelector('[data-timer-fill]');
      const timeline = timer.querySelector('.activity-timeline');
      if (text) text.textContent = startedAt ? (elapsed >= timerDurationSeconds ? '20:00 / 20:00 · 마감' : `${formatElapsed(elapsed)} / 20:00`) : '시작 전 · 0:00 / 20:00';
      if (fill) {
        if (!fill.dataset.timerReady) {
          fill.style.transition = 'none';
          fill.style.width = `${progressPercent}%`;
          fill.dataset.timerReady = 'true';
          window.requestAnimationFrame(() => fill.style.removeProperty('transition'));
        } else {
          fill.style.width = `${progressPercent}%`;
        }
      }
      if (timeline) timeline.setAttribute('aria-valuenow', String(Math.floor(elapsed / 60)));
      timer.classList.toggle('is-finished', elapsed >= timerDurationSeconds);
      timer.querySelectorAll('[data-timer-segment]').forEach((segment, index) => segment.classList.toggle('is-current', startedAt && elapsed < timerDurationSeconds && index === activeSegment));
    });
  }
  function startActivityTimer() {
    if (!getTimerStart()) sessionStorage.setItem(timerStartKey, String(Date.now()));
    sessionStorage.setItem(timerSessionKey, 'started');
    updateActivityTimer();
    if (!timerInterval) timerInterval = window.setInterval(updateActivityTimer, 1000);
  }
  const stageLabel = (step) => `${visibleSteps.indexOf(step)}단계`;
  const adjacentStep = (step, direction) => {
    const index = visibleSteps.indexOf(step);
    return visibleSteps[Math.max(0, Math.min(visibleSteps.length - 1, index + direction))];
  };
  function notify(message) { toast.textContent = message; toast.classList.add('show'); window.clearTimeout(notify.t); notify.t = window.setTimeout(() => toast.classList.remove('show'), 1800); }
  function renderProgress() {
    progress.style.setProperty('--activity-step-count', visibleSteps.length - 1);
    progress.innerHTML = visibleSteps.map((i, position) => {
      const baseLabel = D.steps[i].replace(/^[①-⑥]\s*/, '');
      const label = i === 0 ? baseLabel : `${circledNumbers[position]} ${baseLabel}`;
      if (i === 4) {
        const available = i < state.currentStep || i <= state.maxVisitedStep;
        const done = i < state.currentStep;
        return `<div class="step-split ${done ? 'done' : ''}" aria-label="${label}"><button type="button" class="step-pill step-sub-pill ${state.currentStep === i && state.writingView === 'diary' ? 'current' : ''} ${available ? 'available' : ''} ${done ? 'done' : ''}" data-step="${i}" data-writing-view="diary" ${available ? '' : 'disabled'} aria-current="${state.currentStep === i && state.writingView === 'diary' ? 'step' : 'false'}"><span>③-1 일기쓰기</span></button><button type="button" class="step-pill step-sub-pill ${state.currentStep === i && state.writingView === 'storyboard' ? 'current' : ''} ${available ? 'available' : ''} ${done ? 'done' : ''}" data-step="${i}" data-writing-view="storyboard" ${available ? '' : 'disabled'} aria-current="${state.currentStep === i && state.writingView === 'storyboard' ? 'step' : 'false'}"><span>③-2 스토리보드 작성하기</span></button></div>`;
      }
      return `<button type="button" class="step-pill ${i === state.currentStep ? 'current' : ''} ${i < state.currentStep || i <= state.maxVisitedStep ? 'available' : ''} ${i < state.currentStep ? 'done' : ''}" data-step="${i}" ${i > state.maxVisitedStep ? 'disabled' : ''} aria-current="${i === state.currentStep ? 'step' : 'false'}">${i === 0 ? '<span class="inquiry-step-mark" aria-hidden="true">핵심</span>' : ''}<span>${label}</span></button>`;
    }).join('');
    progress.querySelectorAll('[data-step]:not([disabled])').forEach((b) => b.addEventListener('click', () => {
      if (Number(b.dataset.step) === 0 && state.inquiryAcknowledged) { showInquiryReview(b); return; }
      if (Number(b.dataset.step) === state.currentStep && (!b.dataset.writingView || b.dataset.writingView === state.writingView)) return;
      if (b.dataset.writingView) { state.writingView = b.dataset.writingView; save(); }
      go(Number(b.dataset.step), false);
    }));
  }
  function header(kicker, title, copy) {
    if (title === '나도 조선 브이로거') { kicker = '시작'; title = '오늘의 활동'; }
    return `<header class="screen-header"><span class="eyebrow">${kicker}</span><div class="header-copy"><h1>${title}</h1><p><strong>이렇게 해요</strong>${copy}</p></div></header>`;
  }
  function actions(back = true, nextLabel = '다음 단계') { return `<footer class="actions page-footer">${back ? '<button class="secondary-button" data-action="back">← 이전</button>' : '<span class="footer-button-spacer"></span>'}${timerMarkup()}<div class="actions-right"><button class="primary-button" data-action="next">${nextLabel} →</button></div></footer>`; }
  function error(id, msg) { const el = document.getElementById(id); if (el) { el.textContent = msg; el.classList.add('show'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } return false; }
  function clearErrors() { app.querySelectorAll('.error').forEach((x) => x.classList.remove('show')); }
  function bindAutosave() {
    app.querySelectorAll('[data-path]').forEach((el) => {
      const event = el.matches('select,[type=radio],[type=checkbox]') ? 'change' : 'input';
      el.addEventListener(event, () => {
        const parts = el.dataset.path.split('.'); let target = state;
        while (parts.length > 1) target = target[parts.shift()];
        target[parts[0]] = el.value.trim ? el.value.trimStart() : el.value; save();
      });
    });
  }
  function commonBindings() {
    bindAutosave();
    const back = app.querySelector('[data-action="back"]'); if (back) back.addEventListener('click', () => {
      if (state.currentStep === 4 && state.writingView === 'storyboard') { state.writingView = 'diary'; save(); render(); return; }
      go(adjacentStep(state.currentStep, -1), false);
    });
    const next = app.querySelector('[data-action="next"]'); if (next) next.addEventListener('click', nextStep);
  }
  function updateInquiryGate() {
    const isFirstStart = state.currentStep === 0 && !state.inquiryAcknowledged;
    const isNewSession = !hasActiveSession();
    const shouldShow = isFirstStart || isNewSession;
    document.body.classList.toggle('inquiry-locked', shouldShow);
    activityBar.inert = shouldShow;
    app.inert = shouldShow;
    inquiryGate.hidden = !shouldShow;
    if (!shouldShow) return;
    inquiryGate.dataset.mode = isFirstStart ? 'intro' : 'session';
    inquiryGate.classList.remove('is-open', 'is-leaving');
    inquiryScroll.setAttribute('aria-expanded', 'false');
    inquiryStart.innerHTML = '활동 시작 <span aria-hidden="true">→</span>';
    inquiryStart.disabled = true;
    inquiryReturnFocus = null;
    window.setTimeout(() => inquiryScroll.focus(), 80);
  }
  function showInquiryReview(trigger) {
    inquiryReturnFocus = trigger;
    inquiryGate.dataset.mode = 'review';
    inquiryGate.hidden = false;
    inquiryGate.classList.remove('is-open', 'is-leaving');
    inquiryScroll.setAttribute('aria-expanded', 'false');
    inquiryStart.innerHTML = '활동으로 돌아가기 <span aria-hidden="true">→</span>';
    inquiryStart.disabled = true;
    document.body.classList.add('inquiry-locked');
    activityBar.inert = true;
    app.inert = true;
    window.requestAnimationFrame(() => {
      inquiryGate.classList.add('is-open');
      inquiryScroll.setAttribute('aria-expanded', 'true');
      inquiryStart.disabled = false;
      window.setTimeout(() => inquiryStart.focus(), 1250);
    });
  }
  function renderStart() {
    app.innerHTML = `<section class="screen start-screen">${header('일기 준비', '나도 조선 브이로거', '모둠 정보를 적고, 조선 사람의 생활을 담은 일기를 기획해요.')}<div class="start-layout"><aside class="card start-guide"><h2>오늘 할 활동</h2><p class="guide-lead">교과서 속 조선 사람이 되어 짧은 일기를 만들어 봅시다.</p><ol class="activity-summary"><li><span>1</span><div><strong>주인공 정하기</strong><small>신분과 생활 상황 고르기</small></div></li><li><span>2</span><div><strong>생활 모습 찾기</strong><small>교과서 내용과 근거 고르기</small></div></li><li><span>3</span><div><strong>장면 만들기</strong><small>4~8컷 일기 구성하기</small></div></li><li><span>4</span><div><strong>미리보기</strong><small>영상처럼 확인하고 촬영 준비하기</small></div></li></ol><div class="guide-note"><strong>걱정하지 마세요!</strong> 긴 글보다 선택하고 짧게 쓰는 활동이에요. 작성 내용은 자동으로 저장돼요.</div></aside><div class="panel start-panel"><h2>먼저 적어 봅시다</h2><p class="panel-intro">우리 모둠 정보를 모두 적으면 시작할 수 있어요.</p><div class="form-grid"><div class="field"><label for="classNo">반 <span class="required">*</span></label><select id="classNo" data-path="student.classNo"><option value="">반을 골라 주세요</option>${[1,2,3,4,5,6,7].map((n) => `<option value="${n}" ${state.student.classNo == n ? 'selected' : ''}>${n}반</option>`).join('')}</select></div><div class="field"><label for="groupName">모둠 <span class="required">*</span></label><input id="groupName" maxlength="20" data-path="student.groupName" value="${esc(state.student.groupName)}" placeholder="예: 한글 모둠"></div><div class="field full"><label for="authorName">학생 이름 <span class="required">*</span></label><input id="authorName" maxlength="30" data-path="student.authorName" value="${esc(state.student.authorName)}" placeholder="함께 만들면 이름을 모두 적어도 좋아요"><p class="helper">인터넷으로 전송되지 않고 지금 사용하는 기기에만 저장돼요.</p></div></div><p id="start-error" class="error" role="alert"></p></div></div>${actions(false, '시작하기')}</section>`;
    app.querySelector('.activity-summary li:first-child small').textContent = '신분과 성별 정하기';
    commonBindings();
  }
  function renderProtagonist() {
    const status = findStatus();
    const portrait = status && state.protagonist.gender ? characterArt[status.code]?.[state.protagonist.gender] : '';
    const portraitHtml = portrait
      ? `<figure class="character-portrait"><img src="${portrait}" alt="${status.label} ${state.protagonist.gender} 인물 그림"><figcaption>${status.label} · ${state.protagonist.gender}</figcaption></figure>`
      : `<div class="character-placeholder"><span>인물 그림</span><strong>신분과 성별을 골라 주세요</strong><p>두 가지를 고르면 인물이 나타나요.</p></div>`;
    app.innerHTML = `<section class="screen protagonist-screen">${header('1단계', '일기의 주인공을 정해요', '신분과 성별을 고르면 주인공과 그 신분의 생활 모습이 자동으로 나타나요. 이름만 지어 주세요.')}<div class="protagonist-layout"><section class="card protagonist-card status-card"><div class="card-heading"><span>①</span><div><h2>신분과 성별 고르기 <b class="required">*</b></h2><p>카드를 읽고 주인공의 신분을 골라요.</p></div></div><div class="status-choice-grid">${D.statuses.map((x) => `<div class="choice"><input type="radio" name="status" id="status-${x.code}" value="${x.code}" ${state.protagonist.status === x.code ? 'checked' : ''}><label for="status-${x.code}"><span class="status-card-top"><span class="choice-icon">${x.icon}</span><span class="choice-title">${x.label}</span></span><span class="choice-detail">${x.summary}</span><span class="status-source">교과서 70~71쪽</span></label></div>`).join('')}</div><p id="status-error" class="error" role="alert"></p><div class="gender-picker"><strong>성별 선택 <b class="required">*</b></strong><span>선택하면 인물 그림이 바뀌어요.</span><div class="gender-grid">${['남','여'].map((x) => `<div class="choice"><input type="radio" name="gender" id="gender-${x}" value="${x}" ${state.protagonist.gender === x ? 'checked' : ''}><label for="gender-${x}"><span aria-hidden="true">${x === '남' ? '👦' : '👧'}</span><strong>${x}</strong></label></div>`).join('')}</div></div><p id="gender-error" class="error" role="alert"></p></section><section class="card protagonist-card identity-card"><div class="card-heading"><span>②</span><div><h2>주인공 모습과 이름 <b class="required">*</b></h2><p>선택한 인물을 확인하고 이름을 지어요.</p></div></div>${portraitHtml}<div class="field hero-name-field"><label for="heroName">주인공 이름 <span class="required">*</span></label><input id="heroName" maxlength="20" data-path="protagonist.name" value="${esc(state.protagonist.name)}" placeholder="이름을 지어 주세요"></div><p id="hero-error" class="error" role="alert"></p></section><section class="card protagonist-card situation-card informational-card"><div class="card-heading situation-heading"><div><h2><span class="situation-angle" aria-hidden="true">&lt;</span><span class="situation-title">신분별 생활 모습</span><span class="situation-angle" aria-hidden="true">&gt;</span></h2><p>${status ? `${status.label}의 생활 모습이 자동으로 나타났어요.` : '먼저 왼쪽에서 신분을 골라 주세요.'}</p></div></div><div id="situations">${status ? situationHtml(status) : '<div class="waiting-card"><span>←</span><strong>신분을 고르면</strong><p>교과서에 나온 생활 모습이 자동으로 나타나요.</p></div>'}</div></section></div>${actions()}</section>`;
    D.statuses.forEach((x) => app.querySelector(`#status-${x.code}+label .choice-title`)?.insertAdjacentHTML('beforeend', `<small class="status-hanja">(${x.hanja})</small>`));
    const situationHeading = app.querySelector('.situation-card .situation-title');
    if (situationHeading && status) situationHeading.textContent = `${status.label}의 생활 모습`;
    app.querySelectorAll('[name="gender"]').forEach((el) => {
      const visual = el.nextElementSibling?.querySelector('span');
      if (!visual) return;
      const art = status ? characterArt[status.code]?.[el.value] : '';
      visual.className = 'gender-visual';
      visual.innerHTML = art ? `<img src="${art}" alt="">` : `<b>${el.value === '남' ? '男' : '女'}</b>`;
    });
    app.querySelectorAll('[name="status"]').forEach((el) => el.addEventListener('change', () => { state.protagonist.status = el.value; save(); render(); }));
    app.querySelectorAll('[name="gender"]').forEach((el) => el.addEventListener('change', () => { state.protagonist.gender = el.value; save(); render(); }));
    commonBindings();
  }
  function situationHtml(status) { return `<div class="situation-wrap"><div class="topic-grid">${status.situations.map((s) => `<article class="situation-info"><div class="situation-copy"><span class="choice-title">${s.title}</span><span class="choice-detail">${s.detail}</span><span class="source">교과서 70~71쪽</span></div><figure class="situation-art"><img src="${situationArt[s.code]}" alt="${s.title} 생활 모습 삽화"></figure></article>`).join('')}</div></div>`; }
  function renderTopics() {
    const selected = findTopic(state.selectedTopics[0]);
    const notePanel = selected
      ? `<aside class="panel topic-note-panel"><span class="topic-note-kicker">선택한 주제</span><h2>${selected.category}</h2><p>${selected.title}과 관련하여 주인공이 오늘 겪은 일을 떠올려 보세요.</p><div class="topic-note-section-title"><span aria-hidden="true">✎</span> 일기 쓸 내용 정리(간단히)</div><label for="topic-note">주인공은 오늘 무슨일이 있었나요?</label><textarea id="topic-note" maxlength="150" placeholder="주인공이 오늘 겪었던 일을 간단히 적어 보세요. 어디에서 누구와 무엇을 했는지도 떠올려 보세요.">${esc((state.topicNotes[selected.code] || '').slice(0, 150))}</textarea><small><strong id="topic-note-count">${(state.topicNotes[selected.code] || '').slice(0, 150).length}</strong>/150자 · 자동 저장</small></aside>`
      : `<aside class="panel topic-note-panel empty"><span aria-hidden="true">✎</span><h2>주인공은 오늘 무슨일이 있었나요?</h2><p>왼쪽에서 큰 주제를 하나 선택한 뒤, 주인공이 오늘 겪었던 일을 간단히 적어 보세요.</p></aside>`;
    app.innerHTML = `<section class="screen topic-screen">${header('2단계', '일기의 주제를 정해요', '세 가지 큰 주제 중 하나를 고르고, 오른쪽에 일기에 담을 관련 내용을 적으세요.')}<div class="topic-four-grid">${D.topics.map((x) => `<div class="choice topic-feature-card"><input type="radio" name="topic" id="topic-${x.code}" value="${x.code}" ${selected?.code === x.code ? 'checked' : ''}><label for="topic-${x.code}"><span class="topic-feature-head"><strong>${x.category}</strong></span><span class="topic-feature-art"><img src="${topicArt[x.code]}" alt="${x.category} 삽화"></span><span class="topic-feature-copy"><b>교과서 내용</b><span class="topic-textbook-copy">${x.description}</span><span class="topic-more-info"><strong><span aria-hidden="true">🔍</span> 더 알아보기</strong><ul>${x.moreInfo.map((item) => `<li>${item}</li>`).join('')}</ul></span><small>교과서 ${x.pages}</small></span><span class="topic-selected-mark" aria-hidden="true">✓ 선택됨</span></label></div>`).join('')}${notePanel}</div><p id="topics-error" class="error" role="alert"></p>${actions()}</section>`;
    app.querySelectorAll('[name="topic"]').forEach((el) => el.addEventListener('change', () => {
      state.selectedTopics = [el.value];
      state.historicalBasis = state.historicalBasis.filter((code) => allEvidence().some((e) => e.code === code));
      save();
      render();
      window.setTimeout(() => document.getElementById('topic-note')?.focus(), 50);
    }));
    const note = document.getElementById('topic-note');
    if (note) note.addEventListener('input', () => {
      state.topicNotes[selected.code] = note.value.trimStart();
      document.getElementById('topic-note-count').textContent = state.topicNotes[selected.code].length;
      save();
    });
    commonBindings();
  }
  function renderEvidence() {
    const cards = allEvidence();
    const evidenceColumns = cards.length <= 3 ? Math.max(1, cards.length) : Math.ceil(cards.length / 2);
    app.innerHTML = `<section class="screen evidence-screen">${header(stageLabel(3), '교과서에서 근거를 찾아요', '영상에서 보여 줄 사실을 고르고, 필요한 경우 내 말로 짧게 정리하세요.')}<div class="evidence-shell"><aside class="card evidence-guide"><span class="guide-number">①</span><h2>근거 카드를 읽어요</h2><p>앞에서 고른 생활 모습과 관련된 교과서 내용이에요.</p><span class="guide-number">②</span><h2>한 개 이상 선택해요</h2><p>영상에서 실제로 보여 줄 사실만 선택하세요.</p><span class="guide-number">③</span><h2>내 말로 정리해요</h2><p>꼭 필요할 때만 짧게 바꾸어 써도 좋아요.</p><div class="guide-note"><strong>기억해요</strong>역사적 사실은 새로 만들지 않고, 카드에 있는 내용만 사용해요.</div></aside><div class="evidence-board"><div class="evidence-list" style="--evidence-columns:${evidenceColumns}">${cards.map((e) => `<article class="card evidence-card"><div class="source-ribbon">📘 교과서 ${e.page}</div><div class="evidence-body"><label><input type="checkbox" value="${e.code}" ${state.historicalBasis.includes(e.code) ? 'checked' : ''}><span>${e.text}</span></label><div class="note"><label for="note-${e.code}" class="field-label">내 말로 정리하기 <small>(선택)</small></label><textarea id="note-${e.code}" maxlength="120" placeholder="핵심만 짧게 정리해 보세요.">${esc(state.evidenceNotes[e.code] || '')}</textarea></div></div></article>`).join('')}</div></div></div><p id="evidence-error" class="error" role="alert"></p>${actions()}</section>`;
    app.querySelectorAll('.evidence-card input[type="checkbox"]').forEach((el) => el.addEventListener('change', () => { state.historicalBasis = [...app.querySelectorAll('.evidence-card input:checked')].map((x) => x.value); save(); }));
    app.querySelectorAll('.evidence-card textarea').forEach((el) => el.addEventListener('input', () => { state.evidenceNotes[el.id.replace('note-', '')] = el.value.trimStart(); save(); })); commonBindings();
  }
  function renderDiary() {
    const selected = findTopic(state.selectedTopics[0]);
    const outline = selected ? state.topicNotes[selected.code] || '' : '';
    const checkItems = [
      { key: 'voice', label: '주인공의 말투로 썼나요?' },
      { key: 'culture', label: '유교 문화와 사회 질서가 잘 드러나나요?' },
      { key: 'reflection', label: '느낌이나 생각도 함께 썼나요?' }
    ];
    const checksComplete = checkItems.every((item) => state.diaryChecks[item.key] === 'yes');
    const checkMarkup = checkItems.map((item, index) => `<fieldset class="diary-check-item ${state.diaryChecks[item.key] === 'yes' ? 'is-yes' : ''}" data-diary-check-item="${item.key}"><legend><span>${index + 1}</span>${item.label}</legend><div class="diary-check-options"><label><input type="radio" name="diary-check-${item.key}" value="yes" data-diary-check="${item.key}" ${state.diaryChecks[item.key] === 'yes' ? 'checked' : ''}><span>네</span></label><label><input type="radio" name="diary-check-${item.key}" value="recheck" data-diary-check="${item.key}" ${state.diaryChecks[item.key] === 'recheck' ? 'checked' : ''}><span>다시 확인</span></label></div></fieldset>`).join('');
    app.innerHTML = `<section class="screen diary-writing-screen">${header('3-1단계', `${esc(state.protagonist.name || '주인공')}의 하루`, '앞에서 정리한 내용을 바탕으로 주인공이 오늘 겪은 일을 일기로 써 보세요.')}<div class="diary-writing-layout"><aside class="card diary-outline-card"><span class="diary-outline-kicker">앞에서 정리한 내용</span><h2>${selected ? selected.category : '선택한 주제'}</h2><p>${selected ? selected.description : '앞 단계에서 일기의 주제를 먼저 선택해 주세요.'}</p><div class="diary-outline-note"><strong>오늘 있었던 일</strong><span>${outline ? esc(outline) : '아직 정리한 내용이 없어요. 주인공이 어디에서 누구와 무엇을 했는지 떠올려 보세요.'}</span></div></aside><section class="card diary-writing-card"><div class="field"><label for="diary-title">일기 제목</label><input id="diary-title" data-path="diary.title" maxlength="50" value="${esc(state.diary.title)}" placeholder="오늘 하루가 드러나는 제목을 붙여 보세요."></div><div class="field diary-body-field"><label for="diary-body">일기 내용</label><textarea id="diary-body" data-path="diary.body" maxlength="800" placeholder="나는 오늘 어디에서 누구와 무엇을 했나요? 그때 어떤 생각이나 느낌이 들었나요?">${esc(state.diary.body)}</textarea><small><strong id="diary-body-count">${state.diary.body.length}</strong>/800자 · 자동 저장</small></div></section><aside class="card diary-check-card"><span class="diary-check-kicker">확인할 내용</span><h2>쓴 일기를 살펴봐요</h2><div class="diary-check-list">${checkMarkup}</div><button id="view-diary-result" class="primary-button diary-result-button ${checksComplete ? '' : 'is-disabled'}" type="button" aria-disabled="${String(!checksComplete)}">결과 보기 →</button></aside></div>${actions(true, '스토리보드 작성하기')}</section>`;
    commonBindings();
    document.getElementById('diary-body').addEventListener('input', (event) => { document.getElementById('diary-body-count').textContent = event.target.value.length; });
    const resultButton = document.getElementById('view-diary-result');
    const updateDiaryCheckState = () => {
      const complete = checkItems.every((item) => state.diaryChecks[item.key] === 'yes');
      resultButton.classList.toggle('is-disabled', !complete);
      resultButton.setAttribute('aria-disabled', String(!complete));
      checkItems.forEach((item) => app.querySelector(`[data-diary-check-item="${item.key}"]`)?.classList.toggle('is-yes', state.diaryChecks[item.key] === 'yes'));
    };
    app.querySelectorAll('[data-diary-check]').forEach((input) => input.addEventListener('change', () => {
      state.diaryChecks[input.dataset.diaryCheck] = input.value;
      save();
      updateDiaryCheckState();
    }));
    resultButton.addEventListener('click', () => {
      if (resultButton.getAttribute('aria-disabled') === 'true') { notify('세 가지를 모두 확인한 뒤 결과를 볼 수 있어요.'); return; }
      state.resultView = 'diary';
      save();
      go(5, true);
    });
  }
  function renderStoryboard() {
    state.storyboard = window.Storyboard.normalize(state.storyboard); const status = findStatus();
    const selectedTopicCode = state.selectedTopics[0] || '';
    let topicWasSynced = false;
    state.storyboard = state.storyboard.map((scene) => {
      if (scene.type !== 'scene' || scene.topicCode === selectedTopicCode) return scene;
      topicWasSynced = true;
      return { ...scene, topicCode: selectedTopicCode };
    });
    if (topicWasSynced) save();
    activeStoryIndex = Math.max(0, Math.min(activeStoryIndex, state.storyboard.length - 1));
    app.innerHTML = `<section class="screen storyboard-screen">${header('3-2단계', '스토리보드를 작성해요', '왼쪽 장면 번호를 누르고, 주인공이 오늘 있었던 일을 직접 들려주듯 써 보세요.')}<div class="story-workspace"><div class="scene-tabs" role="tablist" aria-label="스토리보드 장면"><span id="scene-drag-help" class="visually-hidden">생활 장면 카드를 끌어 순서를 바꾸세요. 키보드에서는 Alt와 위아래 방향키를 함께 누르세요.</span>${state.storyboard.map((s, i) => `<div class="scene-tab-row ${s.type !== 'scene' ? 'fixed-scene' : 'movable-scene'}" role="presentation" ${s.type === 'scene' ? `draggable="true" data-drag-scene="${s.id}"` : ''}><button type="button" class="scene-tab ${i === activeStoryIndex ? 'active' : ''}" data-story-index="${i}" ${s.type === 'scene' ? `data-scene-id="${s.id}" aria-describedby="scene-drag-help"` : ''} role="tab" aria-selected="${i === activeStoryIndex}"><span>${i + 1}</span>${s.type === 'intro' ? '시작' : s.type === 'conclusion' ? '마무리' : '생활'}${s.type === 'scene' ? '<b class="scene-drag-mark" aria-hidden="true">⋮⋮</b>' : ''}</button>${s.type !== 'scene' ? '<span class="scene-fixed-mark" aria-label="순서 고정">고정</span>' : ''}</div>`).join('')}<p class="scene-capacity-note">최대 8장면까지 작성 가능</p><button class="scene-tab add-tab" id="add-scene" ${state.storyboard.length >= 8 ? 'disabled' : ''}>＋ 장면</button></div><div class="story-focus">${storyCard(state.storyboard[activeStoryIndex], activeStoryIndex, status)}</div><div class="story-hint"><strong>${state.storyboard.length}/8컷</strong><span>시작과 마무리는 고정되어 있어요. 생활 장면 카드를 잡아 끌면 순서를 바꿀 수 있어요.</span><ol><li>장면의 순서 생각하기</li><li>오늘 있었던 일 쓰기</li><li>내가 말하듯 쓰기</li></ol><small>생활 장면은 최소 2개예요.</small></div></div><p id="story-error" class="error" role="alert"></p>${actions()}</section>`;
    app.querySelectorAll('[data-story-index]').forEach((el) => el.addEventListener('click', () => { activeStoryIndex = Number(el.dataset.storyIndex); render(); }));
    app.querySelectorAll('[data-scene-field]').forEach((el) => el.addEventListener(el.matches('select') ? 'change' : 'input', () => { const item = state.storyboard.find((x) => x.id === el.dataset.sceneId); item[el.dataset.sceneField] = el.value.trimStart(); save(); }));
    app.querySelectorAll('[data-dialogue-line-field]').forEach((el) => el.addEventListener(el.matches('select') ? 'change' : 'input', () => {
      const item = state.storyboard.find((x) => x.id === el.dataset.sceneId);
      const line = item?.dialogues?.find((entry) => entry.id === el.dataset.dialogueId);
      if (line) { line[el.dataset.dialogueLineField] = el.value.trimStart(); save(); }
    }));
    app.querySelectorAll('[data-remove-dialogue]').forEach((el) => el.addEventListener('click', () => {
      state.storyboard = window.Storyboard.removeDialogue(state.storyboard, el.dataset.sceneId, el.dataset.removeDialogue);
      save(); render();
    }));
    document.getElementById('add-dialogue')?.addEventListener('click', (event) => {
      state.storyboard = window.Storyboard.addDialogue(state.storyboard, event.currentTarget.dataset.sceneId);
      save(); render();
    });
    app.querySelectorAll('[data-cast-field]').forEach((el) => el.addEventListener('input', () => { const intro = state.storyboard.find((x) => x.type === 'intro'); const member = intro.cast.find((x) => x.id === el.dataset.castId); if (member) { member[el.dataset.castField] = el.value.trimStart(); save(); } }));
    document.getElementById('add-cast')?.addEventListener('click', () => { state.storyboard = window.Storyboard.addCast(state.storyboard); save(); render(); });
    const castTemplate = app.querySelector('[data-cast-template]');
    const castDropZone = document.getElementById('add-cast');
    castTemplate?.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', castTemplate.dataset.castTemplate);
      castTemplate.classList.add('is-dragging');
    });
    castTemplate?.addEventListener('dragend', () => castTemplate.classList.remove('is-dragging'));
    castDropZone?.addEventListener('dragover', (event) => { if (!castDropZone.disabled) { event.preventDefault(); castDropZone.classList.add('is-drop-target'); } });
    castDropZone?.addEventListener('dragleave', () => castDropZone.classList.remove('is-drop-target'));
    castDropZone?.addEventListener('drop', (event) => {
      event.preventDefault();
      castDropZone.classList.remove('is-drop-target');
      const role = event.dataTransfer.getData('text/plain');
      state.storyboard = window.Storyboard.addCast(state.storyboard, role);
      save(); render();
    });
    app.querySelectorAll('[data-remove-cast]').forEach((el) => el.addEventListener('click', () => { state.storyboard = window.Storyboard.removeCast(state.storyboard, el.dataset.removeCast); save(); render(); }));
    let draggedSceneId = '';
    app.querySelectorAll('[data-drag-scene]').forEach((row) => {
      row.addEventListener('dragstart', (event) => {
        draggedSceneId = row.dataset.dragScene;
        row.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedSceneId);
      });
      row.addEventListener('dragover', (event) => {
        if (!draggedSceneId || draggedSceneId === row.dataset.dragScene) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        app.querySelectorAll('.scene-tab-row.is-drop-target').forEach((item) => item.classList.remove('is-drop-target'));
        row.classList.add('is-drop-target');
      });
      row.addEventListener('drop', (event) => {
        event.preventDefault();
        const sceneId = draggedSceneId || event.dataTransfer.getData('text/plain');
        state.storyboard = window.Storyboard.reorder(state.storyboard, sceneId, row.dataset.dragScene);
        activeStoryIndex = state.storyboard.findIndex((item) => item.id === sceneId);
        save(); render();
      });
      row.addEventListener('dragend', () => {
        draggedSceneId = '';
        app.querySelectorAll('.scene-tab-row').forEach((item) => item.classList.remove('is-dragging', 'is-drop-target'));
      });
    });
    app.querySelectorAll('[data-scene-id]').forEach((el) => el.addEventListener('keydown', (event) => {
      if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const sceneId = el.dataset.sceneId;
      state.storyboard = window.Storyboard.move(state.storyboard, sceneId, event.key === 'ArrowUp' ? -1 : 1);
      activeStoryIndex = state.storyboard.findIndex((item) => item.id === sceneId);
      save(); render();
      app.querySelector(`[data-scene-id="${sceneId}"]`)?.focus();
    }));
    app.querySelectorAll('[data-delete]').forEach((el) => el.addEventListener('click', () => { state.storyboard = window.Storyboard.remove(state.storyboard, el.dataset.delete); activeStoryIndex = Math.max(0, activeStoryIndex - 1); save(); render(); }));
    document.getElementById('add-scene').addEventListener('click', () => { state.storyboard = window.Storyboard.add(state.storyboard); activeStoryIndex = state.storyboard.length - 2; save(); render(); }); commonBindings();
  }
  function storyCard(s, i, status) {
    const lifeCount = state.storyboard.filter((x) => x.type === 'scene').length;
    const lifeSceneNumber = state.storyboard.filter((x) => x.type === 'scene').findIndex((x) => x.id === s.id) + 1;
    if (s.type === 'intro') {
      const protagonistName = state.protagonist.name || '아직 이름을 정하지 않았어요';
      const protagonistStatus = status?.label || '신분 미정';
      const protagonistImage = characterArt[status?.code]?.[state.protagonist.gender] || '';
      const cast = Array.isArray(s.cast) ? s.cast : [];
      const castCards = cast.map((member, index) => `<div class="cast-card"><span class="cast-card-number">${index + 1}</span><input aria-label="주변 인물 ${index + 1} 설정" data-cast-id="${member.id}" data-cast-field="role" maxlength="20" value="${esc(member.role)}" placeholder="예: 아버지, 할아버지"><button type="button" class="cast-remove" data-remove-cast="${member.id}" aria-label="${esc(member.role || `주변 인물 ${index + 1}`)} 삭제">삭제</button></div>`).join('');
      return `<article class="card story-card intro intro-story-card"><div class="story-top"><span class="scene-number">${i+1}</span><div><h2>제목·인물 설정</h2><p>영상일기에 나오는 인물과 첫 장면을 한눈에 정해요.</p></div></div><div class="intro-composer"><section class="intro-title-row"><div class="compact-section-title"><span>1</span><label for="story-video-title">영상 제목 <b class="required">*</b></label></div><input id="story-video-title" data-scene-id="${s.id}" data-scene-field="title" maxlength="50" value="${esc(s.title)}" placeholder="예: 호떡이의 바쁜 제삿날"></section><div class="intro-lower-grid"><section class="people-panel"><div class="compact-section-title"><span>2</span><strong>영상일기의 인물</strong></div><div class="people-split"><div class="main-character-panel"><h3>주인공</h3><div class="main-character-content"><figure class="story-protagonist">${protagonistImage ? `<img src="${protagonistImage}" alt="${esc(protagonistName)} 캐릭터">` : '<div class="story-protagonist-placeholder" aria-hidden="true">주</div>'}<figcaption><strong>${esc(protagonistName)}</strong><span>${esc(protagonistStatus)}</span></figcaption></figure><div class="field protagonist-greeting"><label for="story-first-greeting">주인공의 첫 인사 <span class="required">*</span></label><textarea id="story-first-greeting" data-scene-id="${s.id}" data-scene-field="dialogue" maxlength="120" placeholder="예: 안녕하세요. 저는 ${esc(state.protagonist.name || '주인공')}입니다. 오늘 제 하루를 들려드릴게요.">${esc(s.dialogue)}</textarea></div></div></div><div class="supporting-characters-panel"><div class="supporting-heading"><div><h3>주변 인물 설정</h3><small>최대 4명</small></div></div><div class="cast-tools"><div class="cast-template-card" draggable="true" data-cast-template="아버지" title="점선 칸으로 끌어 놓으세요"><span class="cast-example-label">예)</span><span aria-hidden="true">👤</span><strong>아버지</strong></div><button type="button" class="cast-drop-zone" id="add-cast" ${cast.length >= 4 ? 'disabled' : ''}>＋ 인물을 추가하세요</button></div><div class="cast-card-list">${castCards || '<div class="cast-empty">추가한 인물이 여기에 나타나요.</div>'}</div></div></div></section><section class="opening-panel"><div class="compact-section-title"><span>3</span><label for="story-opening-scene">하루를 시작하는 장면 <b class="required">*</b></label></div><p>어디에서 무엇을 하며 하루를 시작하나요?</p><textarea id="story-opening-scene" data-scene-id="${s.id}" data-scene-field="description" maxlength="180" placeholder="예: 대감마님 댁 마당을 쓸며 아침을 시작한다.">${esc(s.description)}</textarea></section></div></div></article>`;
    }
    if (s.type === 'conclusion') return `<article class="card story-card conclusion"><div class="story-top"><span class="scene-number">${i+1}</span><div><h2>하루를 마치며</h2><p>주인공이 자기 하루를 돌아보며 이야기를 마쳐요.</p></div></div><div class="story-fields conclusion-fields"><div class="field"><label>오늘 하루를 보낸 소감 <span class="required">*</span></label><textarea data-scene-id="${s.id}" data-scene-field="description" maxlength="180" placeholder="오늘 하루를 보내며 어떤 생각이나 느낌이 들었나요?">${esc(s.description)}</textarea></div><div class="field"><label>오늘 일기를 쓰며 알게 된 역사적 사실 <span class="required">*</span></label><textarea data-scene-id="${s.id}" data-scene-field="dialogue" maxlength="180" placeholder="오늘의 일기에서 알 수 있는 조선 시대 생활 모습을 정리해 보세요.">${esc(s.dialogue)}</textarea></div></div><div class="scene-prompts"><strong>마지막 내용을 확인해요</strong><span>하루를 보낸 느낌이 담겼나요?</span><span>역사적 사실이 드러나나요?</span></div></article>`;
    const cast = state.storyboard.find((item) => item.type === 'intro')?.cast || [];
    const speakerColors = ['#d97832', '#7657b7', '#278c68', '#bd4b65'];
    const speakers = [{ id: 'protagonist', label: state.protagonist.name || '주인공', color: '#1688ae', kind: '주인공' }, ...cast.map((member, index) => ({ id: member.id, label: member.role || `주변 인물 ${index + 1}`, color: speakerColors[index], kind: '주변 인물' }))];
    const dialogueRows = s.dialogues.map((line, index) => {
      const selectedSpeaker = speakers.find((speaker) => speaker.id === line.speakerId) || speakers[0];
      const options = speakers.map((speaker) => `<option value="${speaker.id}" ${speaker.id === selectedSpeaker.id ? 'selected' : ''}>${esc(speaker.label)}</option>`).join('');
      return `<div class="dialogue-sequence-row" style="--speaker-color:${selectedSpeaker.color}"><span class="dialogue-order">${index + 1}</span><select data-scene-id="${s.id}" data-dialogue-id="${line.id}" data-dialogue-line-field="speakerId" aria-label="${index + 1}번째 대사를 말할 인물">${options}</select><input data-scene-id="${s.id}" data-dialogue-id="${line.id}" data-dialogue-line-field="text" maxlength="120" value="${esc(line.text)}" placeholder="대사를 입력하세요"><button type="button" data-scene-id="${s.id}" data-remove-dialogue="${line.id}" aria-label="${index + 1}번째 대사 삭제" ${s.dialogues.length <= 1 ? 'disabled' : ''}>삭제</button></div>`;
    }).join('');
    return `<article class="card story-card scene"><div class="story-top"><span class="scene-number">${i+1}</span><div><h2>오늘의 생활 이야기</h2><p>주인공이 오늘 겪은 일을 직접 들려주는 장면이에요.</p></div><button type="button" class="ghost-button small-button delete-button" data-delete="${s.id}" ${lifeCount <= 2 ? 'disabled' : ''}>삭제</button></div><div class="story-fields life-scene-fields"><div class="field life-description-fields"><label>오늘 있었던 일 한 문장 <span class="scene-label-number">(장면 #${lifeSceneNumber})</span> <span class="required">*</span></label><input data-scene-id="${s.id}" data-scene-field="description" maxlength="80" value="${esc(s.description)}" placeholder="예: 아침부터 음식을 만드느라 정신없이 바빴다."><label class="life-details-label">자세한 내용 <span class="optional-label">미리보기에는 나오지 않아요</span></label><textarea data-scene-id="${s.id}" data-scene-field="details" maxlength="300" placeholder="무슨 일이 있었는지 자세히 적어 보세요.">${esc(s.details)}</textarea></div><div class="field life-dialogue-field"><div class="dialogue-sequence-heading"><label>대사 차례 <span class="required">*</span></label><small>인물을 고르고 차례대로 대사를 적어요.</small></div><div class="dialogue-sequence-list">${dialogueRows}</div><button type="button" class="add-dialogue-button" id="add-dialogue" data-scene-id="${s.id}" ${s.dialogues.length >= 5 ? 'disabled' : ''}>＋ 대사 추가</button></div></div><div class="scene-prompts"><strong>대화가 자연스럽게 이어지나요?</strong><span>누가 말하나요?</span><span>그 인물다운 말투인가요?</span><span>차례가 알맞나요?</span></div></article>`;
  }
  function defaultShareTitle() {
    const storyboardTitle = state.storyboard.find((item) => item.type === 'intro')?.title?.trim();
    return state.diary.title.trim() || storyboardTitle || `${state.protagonist.name || '주인공'}의 하루`;
  }
  function createShareSnapshot() {
    return JSON.parse(JSON.stringify({ version: 1, shareTitle: state.shareTitle || '', shareDiary: state.shareDiary !== false, shareStoryboard: state.shareStoryboard !== false, student: state.student, protagonist: state.protagonist, selectedTopics: state.selectedTopics, topicNotes: state.topicNotes, diary: state.diary, storyboard: state.storyboard, historicalBasis: state.historicalBasis, evidenceNotes: state.evidenceNotes, thumbnail: state.shooting.thumbnailCode || '' }));
  }
  function openShareDialog() {
    const dialog = document.getElementById('share-dialog');
    document.getElementById('share-title').value = state.shareTitle || defaultShareTitle();
    document.getElementById('share-group-summary').textContent = `${state.student.classNo || '-'}반 · ${state.student.groupName || '모둠 이름 없음'}`;
    document.getElementById('share-error').textContent = '';
    document.getElementById('share-success').hidden = true;
    document.getElementById('share-cancel').textContent = '취소';
    const submit = document.getElementById('share-submit');
    submit.textContent = '우리 반 작품관에 공유하기'; submit.dataset.completed = ''; submit.disabled = false;
    document.getElementById('share-diary-check').checked = state.shareDiary !== false;
    document.getElementById('share-storyboard-check').checked = state.shareStoryboard !== false;
    dialog.showModal();
  }
  async function submitShare() {
    const dialog = document.getElementById('share-dialog');
    const submit = document.getElementById('share-submit');
    if (submit.dataset.completed === 'true') { dialog.close(); window.JoseonGallery?.open(Number(state.student.classNo) || 1, 'diary'); return; }
    const diaryShared = document.getElementById('share-diary-check').checked;
    const storyboardShared = document.getElementById('share-storyboard-check').checked;
    const errorBox = document.getElementById('share-error');
    if (!diaryShared && !storyboardShared) { errorBox.textContent = '공유할 결과물을 한 가지 이상 선택해 주세요.'; return; }
    const title = document.getElementById('share-title').value.trim();
    if (!title) { errorBox.textContent = '작품 제목을 입력해 주세요.'; return; }
    if (!window.JoseonSupabase?.isConfigured()) { errorBox.textContent = 'Supabase 연결 정보가 아직 설정되지 않았어요. supabase/README.md를 확인해 주세요.'; return; }
    if (!state.clientProjectId) { state.clientProjectId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; save(); }
    state.shareTitle = title; state.shareDiary = diaryShared; state.shareStoryboard = storyboardShared; save();
    submit.disabled = true; submit.textContent = '작품을 등록하고 있어요…'; errorBox.textContent = '';
    try {
      await window.JoseonSupabase.upsertProject({ client_project_id: state.clientProjectId, grade: 5, class_number: Number(state.student.classNo), group_number: Number((state.student.groupName.match(/\d+/) || [])[0]) || null, display_name: state.student.groupName || state.student.authorName || '우리 모둠', title, social_status: findStatus()?.label || state.protagonist.status || '', thumbnail: state.shooting.thumbnailCode || '', snapshot: createShareSnapshot(), diary_shared: diaryShared, storyboard_shared: storyboardShared });
      document.getElementById('share-success').hidden = false;
      document.getElementById('share-cancel').textContent = '계속 작업하기';
      submit.dataset.completed = 'true'; submit.textContent = '우리 반 작품관 보기'; submit.disabled = false;
    } catch (_) {
      errorBox.textContent = '작품을 등록하지 못했어요. 인터넷 연결과 Supabase 설정을 확인한 뒤 다시 시도해 주세요.';
      submit.textContent = '다시 시도'; submit.disabled = false;
    }
  }
  function openSharedProject(project, type) {
    if (!project?.snapshot) return;
    window.PreviewPlayer.destroy();
    if (diaryPreviewCleanup) diaryPreviewCleanup();
    preservedWorkingState = state;
    state = window.JoseonStorage.normalize(project.snapshot);
    state.resultView = type === 'storyboard' ? 'storyboard' : 'diary';
    readOnlyPreview = true;
    document.body.classList.add('shared-preview-open');
    window.JoseonGallery?.close();
    renderProgress();
    renderPreview({ readOnly: true, project, onBack: () => {
      window.PreviewPlayer.destroy(); if (diaryPreviewCleanup) diaryPreviewCleanup();
      state = preservedWorkingState || window.JoseonStorage.load(); preservedWorkingState = null;
      document.body.classList.remove('shared-preview-open'); render();
      readOnlyPreview = false;
      window.JoseonGallery?.open(Number(state.student.classNo) || Number(project.class_number) || 1, type);
    } });
  }
  function editSharedProject(project) {
    if (!project?.snapshot || !project.client_project_id) return;
    window.PreviewPlayer.destroy();
    if (diaryPreviewCleanup) diaryPreviewCleanup();
    state = window.JoseonStorage.normalize({
      ...project.snapshot,
      clientProjectId: project.client_project_id,
      shareTitle: project.title || project.snapshot.shareTitle || '',
      shareDiary: project.diary_shared,
      shareStoryboard: project.storyboard_shared,
      inquiryAcknowledged: true,
      currentStep: 4,
      maxVisitedStep: Math.max(4, Number(project.snapshot.maxVisitedStep) || 0),
      writingView: project.storyboard_shared && !project.diary_shared ? 'storyboard' : 'diary',
      resultView: project.storyboard_shared && !project.diary_shared ? 'storyboard' : 'diary',
      shooting: { thumbnailCode: project.thumbnail || project.snapshot.thumbnail || '' }
    });
    readOnlyPreview = false;
    preservedWorkingState = null;
    document.body.classList.remove('shared-preview-open');
    window.JoseonGallery?.close();
    save();
    render();
    notify('작품을 불러왔어요. 수정한 뒤 다시 공유하면 기존 작품이 갱신됩니다.');
  }
  function handleDeletedProject(project) {
    if (state.clientProjectId !== project?.client_project_id) return;
    state.clientProjectId = '';
    state.shareTitle = '';
    state.shareDiary = true;
    state.shareStoryboard = true;
    save();
  }
  function renderPreview(options = {}) {
    const slides = previewSlides();
    const status = findStatus();
    const diaryBody = state.diary.body.trim() || '아직 작성한 일기 내용이 없어요. 3-1 일기쓰기에서 주인공의 하루를 적어 보세요.';
    const diaryTopicCode = state.selectedTopics[0] || '';
    const diaryTopic = findTopic(diaryTopicCode);
    const diarySceneSource = {
      type: 'scene',
      topicCode: diaryTopicCode,
      title: `${state.diary.title || ''} ${diaryTopic?.title || ''}`,
      description: `${state.topicNotes[diaryTopicCode] || ''} ${diaryBody}`,
      dialogue: diaryBody
    };
    const diaryBackground = Backgrounds.resolve(diarySceneSource, status?.code);
    const fallbackDiaryCharacter = characterArt[status?.code]?.[state.protagonist.gender] || '';
    const diaryPose = Lifestyles.resolve(diarySceneSource, status?.code, state.protagonist.gender, fallbackDiaryCharacter);
    const diaryCharacter = diaryPose?.src || fallbackDiaryCharacter;
    const diaryScene = { background: diaryBackground, character: diaryPose };
    app.innerHTML = `<section class="screen result-preview-screen">${header(stageLabel(5), '두 가지 활동 결과를 확인해요', '일기쓰기와 스토리보드 작성 결과를 각각 확인해 보세요.')}<div class="result-preview-tabs" role="tablist" aria-label="활동 결과 선택"><button id="diary-result-tab" class="result-preview-tab active" type="button" role="tab" aria-selected="true" aria-controls="diary-result-panel">📜 일기 쓰기 결과보기</button><button id="storyboard-result-tab" class="result-preview-tab" type="button" role="tab" aria-selected="false" aria-controls="storyboard-result-panel">🎬 스토리보드 작성 결과 보기</button></div><div id="diary-result-panel" class="result-panel" role="tabpanel" aria-labelledby="diary-result-tab"><div class="preview-layout diary-result-layout"><div><div class="video-stage diary-result-stage" aria-live="polite"><img class="diary-result-background" src="${diaryScene?.background?.src || ''}" alt="" aria-hidden="true"><div class="diary-result-overlay" aria-hidden="true"></div>${diaryCharacter ? `<img class="diary-result-character" src="${diaryCharacter}" alt="${esc(state.protagonist.name || '주인공')}의 모습" style="--diary-character-x:${diaryPose?.x ?? 22}%;--diary-character-bottom:${diaryPose?.bottom ?? 0}%;--diary-character-height:${diaryPose?.height ?? 88}%;--diary-character-max-width:${diaryPose?.maxWidth ?? 48}%">` : ''}<article id="diary-result-paper" class="diary-result-paper"><header id="diary-result-title" class="diary-result-title"><span>${esc(state.protagonist.name || '주인공')}의 일기</span><h2>${esc(state.diary.title.trim() || `${state.protagonist.name || '주인공'}의 하루`)}</h2></header><div id="diary-result-body" class="diary-result-body"><div id="diary-page-text" class="diary-page-text"></div><div id="diary-page-measurer" class="diary-page-measurer" aria-hidden="true"></div><img id="diary-brush" class="diary-brush" src="assets/images/joseon-calligraphy-brush.png" alt="" aria-hidden="true"></div><footer class="diary-page-footer"><button id="diary-page-prev" type="button" aria-label="이전 일기장">‹ 이전</button><strong id="diary-page-indicator">1 / 1쪽</strong><button id="diary-page-next" type="button" aria-label="다음 일기장">다음 ›</button></footer></article></div><div class="preview-controls diary-preview-controls"><button id="diary-play" class="primary-button">📖 일기 보기</button><button id="diary-pause" class="secondary-button">⏸ 일시정지</button><button id="diary-restart" class="secondary-button">↺ 처음부터</button></div></div><aside class="card checklist"><h2>일기 쓰기 결과 점검표</h2><ul><li>주인공이 직접 쓴 일기처럼 느껴지나요?</li><li>오늘 겪은 일이 차례대로 드러나나요?</li><li>주인공의 생각이나 느낌이 담겼나요?</li></ul><div class="result-action-stack"><button id="edit-diary" class="ghost-button">✏ 일기 수정하기</button><button id="share-diary-result" class="share-result-button" type="button">📌 결과 공유하기(작품관)</button></div></aside></div></div><div id="storyboard-result-panel" class="result-panel" role="tabpanel" aria-labelledby="storyboard-result-tab" hidden><div class="preview-layout"><div><div id="video-stage" class="video-stage" aria-live="polite"><div class="preview-slide preview-storyboard-layout visible"><div class="preview-layer preview-background-layer"><img class="preview-background-art is-active" alt=""><img class="preview-background-art" alt=""></div><div class="preview-layer preview-character-layer"><img class="preview-character-art" alt=""><img class="preview-character-art" alt=""></div><div class="preview-layer preview-props-layer" data-layer="props" aria-hidden="true"></div><div class="preview-vignette" aria-hidden="true"></div><div class="preview-copy"><span class="preview-kicker"></span><h2></h2><p class="preview-description"></p></div><div class="subtitle"><strong class="preview-speaker"></strong><span aria-hidden="true">“</span><b></b><span aria-hidden="true">”</span></div></div></div><div class="story-dots">${slides.map((_,i) => `<span class="story-dot" data-dot="${i}"></span>`).join('')}</div><div class="preview-controls"><button id="play" class="primary-button">▶ 재생</button><button id="pause" class="secondary-button">⏸ 일시정지</button><button id="restart" class="secondary-button">↺ 처음부터</button></div></div><aside class="card checklist"><h2>스토리보드 작성 결과 점검표</h2><ul><li>주인공이 자기 하루를 이야기하는 느낌인가요?</li><li>말이 ‘나는’, ‘오늘’처럼 자연스럽게 이어지나요?</li><li>하루 속에서 역사적 생활 모습이 드러나나요?</li></ul><button id="edit-story" class="ghost-button">✏ 스토리보드 수정하기</button></aside></div></div><footer class="actions page-footer"><button class="secondary-button" data-action="back">← 이전</button>${timerMarkup()}<button class="primary-button" id="complete-plan">일기 기획 완성 →</button></footer></section>`;
    const storyboardChecklist = document.querySelector('#storyboard-result-panel .checklist');
    const editStoryboardButton = document.getElementById('edit-story');
    const storyboardActionStack = document.createElement('div');
    storyboardActionStack.className = 'result-action-stack';
    const shareStoryboardButton = document.createElement('button');
    shareStoryboardButton.id = 'share-storyboard-result';
    shareStoryboardButton.className = 'share-result-button';
    shareStoryboardButton.type = 'button';
    shareStoryboardButton.textContent = '📌 결과 공유하기(작품관)';
    storyboardChecklist.append(storyboardActionStack);
    storyboardActionStack.append(editStoryboardButton, shareStoryboardButton);
    const stage = document.getElementById('video-stage');
    const stageNavigation = document.createElement('div');
    stageNavigation.className = 'preview-stage-navigation';
    const previousDialogueButton = document.createElement('button');
    previousDialogueButton.id = 'preview-previous-dialogue';
    previousDialogueButton.className = 'preview-dialogue-navigation previous';
    previousDialogueButton.type = 'button';
    previousDialogueButton.setAttribute('aria-label', '이전 대사');
    previousDialogueButton.textContent = '≪';
    const nextDialogueButton = document.createElement('button');
    nextDialogueButton.id = 'preview-next-dialogue';
    nextDialogueButton.className = 'preview-dialogue-navigation next';
    nextDialogueButton.type = 'button';
    nextDialogueButton.setAttribute('aria-label', '다음 대사');
    nextDialogueButton.textContent = '≫';
    stage.before(stageNavigation);
    stageNavigation.append(previousDialogueButton, stage, nextDialogueButton);
    const slide = stage.querySelector('.preview-slide');
    const titleCard = document.createElement('section');
    titleCard.className = 'preview-title-card';
    titleCard.setAttribute('aria-label', '영상 제목');
    const titleOwner = document.createElement('span');
    const titleHeading = document.createElement('h2');
    const titleDivider = document.createElement('i');
    titleDivider.setAttribute('aria-hidden', 'true');
    titleCard.append(titleOwner, titleHeading, titleDivider);
    const endingCard = document.createElement('section');
    endingCard.className = 'preview-ending-card';
    endingCard.setAttribute('aria-label', '오늘 하루를 보낸 소감');
    const endingLabel = document.createElement('span');
    endingLabel.textContent = '오늘 하루를 보낸 소감';
    const endingText = document.createElement('p');
    const endingCredit = document.createElement('strong');
    endingCard.append(endingLabel, endingText, endingCredit);
    slide.append(titleCard, endingCard);
    const backgrounds = [...stage.querySelectorAll('.preview-background-art')];
    const characterArtElements = [...stage.querySelectorAll('.preview-character-art')];
    const propsLayer = stage.querySelector('.preview-props-layer');
    const previewCopy = stage.querySelector('.preview-copy');
    const kicker = stage.querySelector('.preview-kicker');
    const heading = stage.querySelector('.preview-copy h2');
    const description = stage.querySelector('.preview-description');
    const subtitle = stage.querySelector('.subtitle');
    const storyboardControlButtons = ['play', 'pause', 'restart'].map((id) => document.getElementById(id));
    const diaryControlButtons = ['diary-play', 'diary-pause', 'diary-restart'].map((id) => document.getElementById(id));
    const preparePreviewControls = (buttons) => buttons.forEach((button) => {
      button.classList.remove('primary-button');
      button.classList.add('secondary-button', 'preview-control-button');
      button.setAttribute('aria-pressed', 'false');
    });
    const selectPreviewControl = (buttons, selectedId = '') => buttons.forEach((button) => {
      const selected = button.id === selectedId;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    preparePreviewControls(storyboardControlButtons);
    preparePreviewControls(diaryControlButtons);
    let activeBackground = 0;
    let activeCharacter = 0;
    let backgroundVersion = 0;
    let characterVersion = 0;
    slides.forEach((item) => {
      [item.background?.src, item.character?.src, ...(item.props || []).map((prop) => prop.src)].filter(Boolean).forEach((src) => { const image = new Image(); image.src = src; });
    });
    function updateBackground(background) {
      const current = backgrounds[activeBackground];
      if (current.dataset.src === background.src) {
        backgroundVersion += 1;
        current.alt = `${background.label} 배경`;
        return;
      }
      if (!current.dataset.src) {
        backgroundVersion += 1;
        current.src = background.src; current.dataset.src = background.src; current.alt = `${background.label} 배경`; return;
      }
      const nextIndex = activeBackground === 0 ? 1 : 0;
      const next = backgrounds[nextIndex];
      const version = ++backgroundVersion;
      const reveal = () => {
        if (version !== backgroundVersion) return;
        next.classList.add('is-active'); current.classList.remove('is-active'); activeBackground = nextIndex;
      };
      next.onload = reveal;
      next.src = background.src; next.dataset.src = background.src; next.alt = `${background.label} 배경`;
      if (next.complete) window.requestAnimationFrame(reveal);
    }
    function updateCharacter(character) {
      const current = characterArtElements[activeCharacter];
      if (!character) {
        characterVersion += 1;
        characterArtElements.forEach((element) => element.classList.remove('is-active'));
        return;
      }
      const style = `--character-x:${character.x}%;--character-bottom:${character.bottom}%;--character-height:${character.height}%;--character-max-width:${character.maxWidth}%`;
      const alt = `${state.protagonist.name || '주인공'} ${character.label}`;
      if (current.dataset.src === character.src) {
        characterVersion += 1;
        characterArtElements.forEach((element) => { if (element !== current) element.classList.remove('is-active'); });
        current.style.cssText = style; current.alt = alt; current.classList.add('is-active'); return;
      }
      if (!current.dataset.src) {
        characterVersion += 1;
        characterArtElements.forEach((element) => { if (element !== current) element.classList.remove('is-active'); });
        current.src = character.src; current.dataset.src = character.src; current.style.cssText = style; current.alt = alt;
        current.classList.toggle('legacy-character', Boolean(character.legacy)); current.classList.add('is-active'); return;
      }
      const nextIndex = activeCharacter === 0 ? 1 : 0;
      const next = characterArtElements[nextIndex];
      const version = ++characterVersion;
      const image = new Image();
      image.onload = () => {
        if (version !== characterVersion) return;
        next.classList.remove('is-active');
        next.src = character.src; next.dataset.src = character.src;
        next.style.cssText = style; next.alt = alt;
        next.classList.toggle('legacy-character', Boolean(character.legacy));
        window.requestAnimationFrame(() => {
          if (version !== characterVersion) return;
          next.classList.add('is-active');
          current.classList.remove('is-active');
          activeCharacter = nextIndex;
        });
      };
      image.src = character.src;
    }
    function updateProps(nextProps = []) {
      const currentProps = new Map(
        [...propsLayer.querySelectorAll('.preview-prop-art')]
          .map((element) => [element.dataset.propKey, element])
      );
      const nextKeys = new Set();
      nextProps.forEach((prop, propIndex) => {
        const propKey = prop.key || prop.src;
        nextKeys.add(propKey);
        let element = currentProps.get(propKey);
        if (!element) {
          element = document.createElement('img');
          element.className = 'preview-prop-art';
          element.dataset.propKey = propKey;
          element.alt = '';
          propsLayer.append(element);
        }
        if (element.dataset.src !== prop.src) {
          element.src = prop.src;
          element.dataset.src = prop.src;
        }
        element.style.setProperty('--prop-x', `${prop.x || 50}%`);
        element.style.setProperty('--prop-y', `${prop.y || 50}%`);
        element.style.setProperty('--prop-scale', prop.scale || 1);
        element.style.setProperty('--prop-delay', `${propIndex * 0.12}s`);
        element.style.zIndex = String(propIndex + 1);
      });
      currentProps.forEach((element, propKey) => {
        if (!nextKeys.has(propKey)) element.remove();
      });
    }
    let renderedPreviewFrame = '';
    let storyboardPlaying = false;
    window.PreviewPlayer.setup(slides, (i, playing, dialogueIndex = 0, completed = false) => {
      storyboardPlaying = playing;
      const s = slides[i];
      if (!stage || !s) return;
      const dialogueLines = s.dialogues?.length ? s.dialogues : [{ speaker: s.speaker, text: s.dialogue }];
      const activeDialogueIndex = Math.min(dialogueIndex, dialogueLines.length - 1);
      const frameKey = `${i}:${activeDialogueIndex}`;
      if (renderedPreviewFrame !== frameKey) {
        const previousSlideIndex = renderedPreviewFrame ? Number(renderedPreviewFrame.split(':')[0]) : -1;
        renderedPreviewFrame = frameKey;
        const activeDialogue = dialogueLines[activeDialogueIndex];
        slide.className = `preview-slide preview-${s.kind} preview-storyboard-layout visible`;
        const isTitleCard = s.kind === 'title';
        const isEndingCard = s.kind === 'credits';
        titleOwner.textContent = `${state.protagonist.name || '주인공'}의 하루`;
        titleHeading.textContent = s.heading || '나의 조선 시대 하루';
        titleCard.classList.toggle('is-visible', isTitleCard);
        endingText.textContent = s.description || '오늘 하루를 돌아보며 이야기를 마칩니다.';
        endingCredit.textContent = `${state.protagonist.name || '주인공'}의 하루 · 끝`;
        endingCard.classList.toggle('is-visible', isEndingCard);
        endingCard.classList.remove('is-long');
        endingCard.style.removeProperty('--ending-scroll-distance');
        if (isEndingCard && playing) {
          window.requestAnimationFrame(() => {
            const readableHeight = Math.max(100, endingCard.clientHeight * 0.52);
            const overflow = Math.max(0, endingText.scrollHeight - readableHeight);
            if (overflow > 0) {
              endingCard.style.setProperty('--ending-scroll-distance', `${overflow + 28}px`);
              endingCard.classList.add('is-long');
            }
          });
        }
        slide.dataset.background = s.background.key; slide.dataset.characterAction = s.character?.key || 'none';
        updateBackground(s.background); updateCharacter(s.character); updateProps(s.props);
        const dialogueProgress = dialogueLines.length > 1 ? ` · 대사 ${activeDialogueIndex + 1}/${dialogueLines.length}` : '';
        const sceneNumber = s.storyNumber || Math.max(1, i);
        kicker.textContent = `SCENE ${String(sceneNumber).padStart(2,'0')}${dialogueProgress} · ${state.protagonist.name || '주인공'}의 하루`;
        heading.textContent = s.heading; description.textContent = s.description;
        const row = document.createElement('div'); row.className = 'preview-dialogue-line'; row.style.setProperty('--line-color', activeDialogue?.speaker?.color || '#1688ae');
        const name = document.createElement('strong'); name.className = 'preview-speaker'; name.textContent = activeDialogue?.speaker?.label || state.protagonist.name || '주인공';
        const quote = document.createElement('span'); quote.textContent = '“'; quote.setAttribute('aria-hidden', 'true');
        const text = document.createElement('b'); text.textContent = activeDialogue?.text || '';
        const closeQuote = document.createElement('span'); closeQuote.textContent = '”'; closeQuote.setAttribute('aria-hidden', 'true');
        row.append(name, quote, text, closeQuote); subtitle.replaceChildren(row);
        slide.style.setProperty('--speaker-color', activeDialogue?.speaker?.color || '#1688ae');
        app.querySelectorAll('[data-dot]').forEach((d,n) => d.classList.toggle('active', n===i));
        if (s.kind === 'title' || s.kind === 'credits') {
          previewCopy.classList.remove('is-changing');
          subtitle.classList.remove('is-changing');
        } else {
          const changedElements = previousSlideIndex === i ? [subtitle] : [previewCopy, subtitle];
          changedElements.forEach((element) => {
            element.classList.remove('is-changing');
            void element.offsetWidth;
            element.classList.add('is-changing');
          });
        }
      }
      previousDialogueButton.disabled = i === 0 && activeDialogueIndex === 0;
      nextDialogueButton.disabled = i === slides.length - 1 && activeDialogueIndex === dialogueLines.length - 1;
      const playButton = document.getElementById('play');
      playButton.textContent = playing ? '▶ 재생 중' : '▶ 재생';
      if (playing) selectPreviewControl(storyboardControlButtons, 'play');
      else if (completed) selectPreviewControl(storyboardControlButtons);
    });
    const diaryTab = document.getElementById('diary-result-tab');
    const storyboardTab = document.getElementById('storyboard-result-tab');
    const diaryPanel = document.getElementById('diary-result-panel');
    const storyboardPanel = document.getElementById('storyboard-result-panel');
    const diaryPaper = document.getElementById('diary-result-paper');
    const diaryTitle = document.getElementById('diary-result-title');
    const diaryResultBody = document.getElementById('diary-result-body');
    const diaryPageText = document.getElementById('diary-page-text');
    const diaryPageMeasurer = document.getElementById('diary-page-measurer');
    const diaryBrush = document.getElementById('diary-brush');
    const diaryPageIndicator = document.getElementById('diary-page-indicator');
    const diaryPagePrev = document.getElementById('diary-page-prev');
    const diaryPageNext = document.getElementById('diary-page-next');
    let diaryPages = [];
    let diaryPageProgress = [];
    let diaryPageIndex = 0;
    let diaryMaxReached = 0;
    let diaryPlaying = false;
    let diaryWritingTimer = null;
    let diaryInitialized = false;
    let storyboardAudioContext = null;
    const clearDiaryWritingTimer = () => { if (diaryWritingTimer) window.clearTimeout(diaryWritingTimer); diaryWritingTimer = null; };
    const paginateDiary = () => {
      const availableHeight = diaryResultBody.clientHeight;
      if (availableHeight < 80) return false;
      const pages = [];
      let cursor = 0;
      while (cursor < diaryBody.length) {
        let low = cursor + 1;
        let high = diaryBody.length;
        let best = low;
        while (low <= high) {
          const middle = Math.floor((low + high) / 2);
          diaryPageMeasurer.textContent = diaryBody.slice(cursor, middle);
          if (diaryPageMeasurer.scrollHeight <= availableHeight) { best = middle; low = middle + 1; }
          else high = middle - 1;
        }
        let end = Math.max(cursor + 1, best);
        if (end < diaryBody.length) {
          const candidate = diaryBody.slice(cursor, end);
          const breakAt = Math.max(candidate.lastIndexOf('\n'), candidate.lastIndexOf(' '));
          if (breakAt > candidate.length * 0.62) end = cursor + breakAt + 1;
        }
        const page = diaryBody.slice(cursor, end).replace(/^\s+|\s+$/g, '');
        if (page) pages.push(page);
        cursor = end;
        while (cursor < diaryBody.length && /[ \t\n]/.test(diaryBody[cursor])) cursor += 1;
      }
      diaryPages = pages.length ? pages : [diaryBody];
      diaryPageProgress = diaryPages.map(() => 0);
      diaryPageIndex = 0;
      diaryMaxReached = 0;
      diaryPageMeasurer.textContent = '';
      diaryInitialized = true;
      return true;
    };
    const positionDiaryBrush = () => {
      const textNode = diaryPageText.firstChild;
      const revealed = diaryPageProgress[diaryPageIndex] || 0;
      if (!textNode || !revealed) { diaryBrush.style.left = '24px'; diaryBrush.style.top = '18px'; return; }
      const range = document.createRange();
      range.setStart(textNode, Math.max(0, revealed - 1));
      range.setEnd(textNode, revealed);
      const characterRect = range.getBoundingClientRect();
      const bodyRect = diaryResultBody.getBoundingClientRect();
      diaryBrush.style.left = `${Math.max(24, Math.min(diaryResultBody.clientWidth - 24, characterRect.right - bodyRect.left + 3))}px`;
      diaryBrush.style.top = `${Math.max(20, Math.min(diaryResultBody.clientHeight - 2, characterRect.bottom - bodyRect.top + 1))}px`;
    };
    const renderDiaryPage = () => {
      const page = diaryPages[diaryPageIndex] || '';
      const revealed = Math.min(page.length, diaryPageProgress[diaryPageIndex] || 0);
      diaryPageText.textContent = page.slice(0, revealed);
      diaryTitle.classList.toggle('is-continued', diaryPageIndex > 0);
      diaryTitle.querySelector('span').textContent = diaryPageIndex > 0 ? `${state.protagonist.name || '주인공'}의 일기 · 계속` : `${state.protagonist.name || '주인공'}의 일기`;
      diaryPageIndicator.textContent = `${diaryPageIndex + 1} / ${diaryPages.length}쪽`;
      diaryPagePrev.disabled = diaryPageIndex === 0;
      diaryPageNext.disabled = diaryPageIndex >= diaryMaxReached || diaryPageIndex >= diaryPages.length - 1;
      diaryBrush.hidden = !diaryPlaying || revealed >= page.length;
      window.requestAnimationFrame(positionDiaryBrush);
    };
    const writingDelay = (character) => /[.!?。！？]/.test(character) ? 520 : /[,，]/.test(character) ? 300 : /\s/.test(character) ? 90 : 164;
    const writeNextDiaryCharacter = () => {
      clearDiaryWritingTimer();
      if (!diaryPlaying || !diaryPages.length) return;
      const page = diaryPages[diaryPageIndex];
      const revealed = diaryPageProgress[diaryPageIndex];
      if (revealed < page.length) {
        diaryPageProgress[diaryPageIndex] += 1;
        renderDiaryPage();
        diaryWritingTimer = window.setTimeout(writeNextDiaryCharacter, writingDelay(page[revealed]));
        return;
      }
      if (diaryPageIndex >= diaryPages.length - 1) {
        diaryPlaying = false;
        renderDiaryPage();
        document.getElementById('diary-play').textContent = '📖 일기 보기';
        selectPreviewControl(diaryControlButtons);
        return;
      }
      diaryWritingTimer = window.setTimeout(() => {
        diaryPaper.classList.add('is-turning');
        diaryWritingTimer = window.setTimeout(() => {
          diaryPageIndex += 1;
          diaryMaxReached = Math.max(diaryMaxReached, diaryPageIndex);
          renderDiaryPage();
          diaryWritingTimer = window.setTimeout(() => { diaryPaper.classList.remove('is-turning'); writeNextDiaryCharacter(); }, 380);
        }, 320);
      }, 900);
    };
    const setDiaryPlaying = (playing) => {
      if (!diaryInitialized && !paginateDiary()) return;
      diaryPlaying = playing;
      clearDiaryWritingTimer();
      document.getElementById('diary-play').textContent = playing ? '📖 일기 보는 중' : '📖 일기 보기';
      renderDiaryPage();
      if (playing) { selectPreviewControl(diaryControlButtons, 'diary-play'); writeNextDiaryCharacter(); }
    };
    const restartDiary = () => {
      if (!diaryInitialized && !paginateDiary()) return;
      diaryPageProgress = diaryPages.map(() => 0);
      diaryPageIndex = 0;
      diaryMaxReached = 0;
      diaryPaper.classList.remove('is-turning');
      setDiaryPlaying(false);
    };
    const playStoryboardSting = async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        if (!storyboardAudioContext || storyboardAudioContext.state === 'closed') storyboardAudioContext = new AudioContextClass();
        if (storyboardAudioContext.state === 'suspended') await storyboardAudioContext.resume();
        const context = storyboardAudioContext;
        const now = context.currentTime;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, now);
        compressor.knee.setValueAtTime(16, now);
        compressor.ratio.setValueAtTime(5, now);
        compressor.attack.setValueAtTime(0.004, now);
        compressor.release.setValueAtTime(0.35, now);
        compressor.connect(context.destination);
        const strike = (start, fromFrequency, toFrequency, length, volume) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(fromFrequency, start);
          oscillator.frequency.exponentialRampToValueAtTime(toFrequency, start + length);
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
          oscillator.connect(gain).connect(compressor);
          oscillator.start(start);
          oscillator.stop(start + length + 0.03);
        };
        strike(now, 92, 43, 0.52, 0.42);
        strike(now + 0.24, 67, 31, 1.18, 0.55);
        strike(now + 0.27, 188, 72, 0.78, 0.12);
        storyboardTab.dataset.soundPlayed = 'true';
      } catch (_) {}
    };
    const showResult = (type) => {
      const showDiary = type === 'diary';
      state.resultView = showDiary ? 'diary' : 'storyboard';
      save();
      diaryPanel.hidden = !showDiary;
      storyboardPanel.hidden = showDiary;
      diaryTab.classList.toggle('active', showDiary);
      storyboardTab.classList.toggle('active', !showDiary);
      diaryTab.setAttribute('aria-selected', String(showDiary));
      storyboardTab.setAttribute('aria-selected', String(!showDiary));
      if (showDiary) {
        window.PreviewPlayer.pause();
        selectPreviewControl(storyboardControlButtons);
        window.requestAnimationFrame(() => {
          if (!diaryInitialized) paginateDiary();
          if (diaryInitialized) setDiaryPlaying(false);
        });
      }
      else {
        setDiaryPlaying(false);
        selectPreviewControl(diaryControlButtons);
      }
    };
    diaryPagePrev.addEventListener('click', () => { if (diaryPageIndex <= 0) return; setDiaryPlaying(false); diaryPageIndex -= 1; renderDiaryPage(); });
    diaryPageNext.addEventListener('click', () => { if (diaryPageIndex >= diaryMaxReached || diaryPageIndex >= diaryPages.length - 1) return; setDiaryPlaying(false); diaryPageIndex += 1; renderDiaryPage(); });
    diaryPreviewCleanup = () => { diaryPlaying = false; clearDiaryWritingTimer(); if (storyboardAudioContext && storyboardAudioContext.state !== 'closed') storyboardAudioContext.close(); storyboardAudioContext = null; diaryPreviewCleanup = null; };
    const initialResult = options.readOnly && !options.project?.diary_shared ? 'storyboard' : (state.resultView === 'storyboard' ? 'storyboard' : 'diary');
    showResult(initialResult);
    diaryTab.addEventListener('click', () => showResult('diary'));
    storyboardTab.addEventListener('click', () => showResult('storyboard'));
    document.getElementById('diary-play').addEventListener('click', () => { setDiaryPlaying(true); selectPreviewControl(diaryControlButtons, 'diary-play'); });
    document.getElementById('diary-pause').addEventListener('click', () => { setDiaryPlaying(false); selectPreviewControl(diaryControlButtons, 'diary-pause'); });
    document.getElementById('diary-restart').addEventListener('click', () => { restartDiary(); selectPreviewControl(diaryControlButtons, 'diary-restart'); });
    document.getElementById('play').addEventListener('click', () => {
      if (storyboardPlaying) return;
      window.PreviewPlayer.play();
      playStoryboardSting();
    });
    document.getElementById('pause').addEventListener('click', () => { window.PreviewPlayer.pause(); selectPreviewControl(storyboardControlButtons, 'pause'); });
    document.getElementById('restart').addEventListener('click', () => { window.PreviewPlayer.restart(); selectPreviewControl(storyboardControlButtons, 'restart'); });
    previousDialogueButton.addEventListener('click', () => { window.PreviewPlayer.previous(); selectPreviewControl(storyboardControlButtons); });
    nextDialogueButton.addEventListener('click', () => { window.PreviewPlayer.next(); selectPreviewControl(storyboardControlButtons); });
    const editDiaryButton = document.getElementById('edit-diary');
    const previewBackButton = document.querySelector('[data-action="back"]');
    const completeButton = document.getElementById('complete-plan');
    if (options.readOnly) {
      app.querySelector('.screen-header h1').textContent = options.project?.title || '공유 작품 감상';
      app.querySelector('.screen-header p').innerHTML = `<strong>작품 정보</strong>${esc(options.project?.display_name || '우리 모둠')} · ${esc(options.project?.class_number || '')}반`;
      [editDiaryButton, editStoryboardButton, document.getElementById('share-diary-result'), shareStoryboardButton].forEach((button) => { button.hidden = true; });
      const recommendButtons = [
        { type: 'diary', label: '일기', container: document.querySelector('#diary-result-panel .result-action-stack') },
        { type: 'storyboard', label: '스토리보드', container: storyboardActionStack }
      ].map(({ type, label, container }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'shared-recommend-button';
        button.dataset.recommendType = type;
        button.dataset.recommendLabel = label;
        container.append(button);
        return button;
      });
      const updateRecommendButtons = () => {
        const count = Math.max(0, Number(options.project?.confirm_count) || 0);
        recommendButtons.forEach((button) => {
          const type = button.dataset.recommendType;
          const label = button.dataset.recommendLabel;
          const confirmed = Boolean(options.project?.[`${type}_recommended_by_me`]);
          button.classList.toggle('is-recommended', confirmed);
          button.setAttribute('aria-pressed', String(confirmed));
          button.textContent = confirmed ? `👍 ${label}를 추천했어요 · 합계 ${count}` : `👍 ${label} 추천해요 · 합계 ${count}`;
          button.disabled = false;
          button.title = confirmed ? `${label} 추천 취소` : `${label}를 추천해요`;
        });
      };
      const toggleRecommendation = async (event) => {
        if (!options.project) return;
        const type = event.currentTarget.dataset.recommendType;
        const label = event.currentTarget.dataset.recommendLabel;
        const recommendedKey = `${type}_recommended_by_me`;
        const nextConfirmed = !options.project[recommendedKey];
        recommendButtons.forEach((button) => { button.disabled = true; });
        try {
          await window.JoseonSupabase.setProjectRecommended(options.project.id, type, nextConfirmed);
          options.project[recommendedKey] = nextConfirmed;
          options.project.confirm_count = Math.max(0, (Number(options.project.confirm_count) || 0) + (nextConfirmed ? 1 : -1));
          updateRecommendButtons();
          notify(nextConfirmed ? `${label}를 추천했어요.` : `${label} 추천을 취소했어요.`);
        } catch (_) {
          updateRecommendButtons();
          notify('추천을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
        }
      };
      recommendButtons.forEach((button) => button.addEventListener('click', toggleRecommendation));
      updateRecommendButtons();
      if (!options.project?.diary_shared) { diaryTab.hidden = true; diaryPanel.hidden = true; }
      if (!options.project?.storyboard_shared) { storyboardTab.hidden = true; storyboardPanel.hidden = true; }
      previewBackButton.textContent = '← 작품관으로';
      completeButton.textContent = '작품관으로 돌아가기';
      const returnToGallery = () => options.onBack?.();
      previewBackButton.addEventListener('click', returnToGallery);
      completeButton.addEventListener('click', returnToGallery);
    } else {
      editDiaryButton.addEventListener('click', () => { state.writingView = 'diary'; save(); go(4, false); });
      editStoryboardButton.addEventListener('click', () => { state.writingView = 'storyboard'; save(); go(4, false); });
      document.getElementById('share-diary-result').addEventListener('click', openShareDialog);
      shareStoryboardButton.addEventListener('click', openShareDialog);
      previewBackButton.addEventListener('click', () => { state.writingView = state.resultView === 'storyboard' ? 'storyboard' : 'diary'; save(); go(4, false); });
      completeButton.addEventListener('click', () => go(6, true));
    }
  }
  function previewSlides() {
    const status = findStatus();
    const fallbackCharacter = characterArt[status?.code]?.[state.protagonist.gender] || '';
    const cast = state.storyboard.find((item) => item.type === 'intro')?.cast || [];
    const speakerColors = ['#d97832', '#7657b7', '#278c68', '#bd4b65'];
    const protagonistSpeaker = { id: 'protagonist', label: state.protagonist.name || '주인공', color: '#1688ae' };
    const speakers = [protagonistSpeaker, ...cast.map((member, index) => ({ id: member.id, label: member.role || `주변 인물 ${index + 1}`, color: speakerColors[index] }))];
    const resolveSpeaker = (speakerId) => speakers.find((speaker) => speaker.id === speakerId) || protagonistSpeaker;
    const conclusionSource = state.storyboard.find((item) => item.type === 'conclusion');
    let previousBackground = Backgrounds.resolve({}, status?.code);
    const storyboardSlides = state.storyboard.map((s, i) => {
      const t = findTopic(s.topicCode);
      const visualScene = t ? { ...s, title: `${t.title} ${t.description}` } : s;
      const selectedBackground = Backgrounds.resolve(visualScene, status?.code);
      const background = s.type === 'conclusion' && selectedBackground.reason === 'default-status-room' ? previousBackground : selectedBackground;
      previousBackground = background;
      const character = Lifestyles.resolve(visualScene, status?.code, state.protagonist.gender, fallbackCharacter);
      const props = s.type === 'scene' ? Props.resolve(visualScene, { statusCode: status?.code, backgroundKey: background.key }) : [];
      if (s.type === 'intro') return { kind: 'intro', storyNumber: i + 1, heading: s.title, description: s.description || `${state.protagonist.name}, ${status ? status.label : ''}의 일기`, dialogue: s.dialogue, speaker: protagonistSpeaker, dialogues: [{ speaker: protagonistSpeaker, text: s.dialogue }], background, character, props: [] };
      if (s.type === 'conclusion') return { kind: 'conclusion', storyNumber: i + 1, heading: '꼭 기억해요', description: '', dialogue: s.dialogue, speaker: protagonistSpeaker, dialogues: [{ speaker: protagonistSpeaker, text: s.dialogue }], background, character, props: [] };
      const dialogues = s.dialogues.filter((line) => line.text.trim()).map((line) => ({ speaker: resolveSpeaker(line.speakerId), text: line.text }));
      return { kind: 'life', storyNumber: i + 1, heading: t ? t.title : `생활 장면 ${i}`, description: s.description, dialogue: dialogues.map((line) => `${line.speaker.label}: ${line.text}`).join(' / '), speaker: dialogues[0]?.speaker || protagonistSpeaker, dialogues, background, character, props };
    });
    const opening = storyboardSlides[0];
    const ending = storyboardSlides[storyboardSlides.length - 1];
    const titleSlide = {
      kind: 'title',
      heading: opening?.heading || '나의 조선 시대 하루',
      description: '',
      dialogue: '',
      speaker: protagonistSpeaker,
      dialogues: [{ speaker: protagonistSpeaker, text: '' }],
      background: opening?.background || previousBackground,
      character: opening?.character || null,
      props: [],
      durationMs: 3000
    };
    const creditsText = conclusionSource?.description || '오늘 하루를 돌아보며 이야기를 마칩니다.';
    const creditsSlide = {
      kind: 'credits',
      heading: '오늘 하루를 보낸 소감',
      description: creditsText,
      dialogue: '',
      speaker: protagonistSpeaker,
      dialogues: [{ speaker: protagonistSpeaker, text: '' }],
      background: ending?.background || previousBackground,
      character: ending?.character || null,
      props: [],
      durationMs: creditsText.length > 90 ? 7000 : 4000
    };
    return [titleSlide, ...storyboardSlides, creditsSlide];
  }
  function renderShooting() {
    const selectedThumb = D.thumbnails.find((x) => x.code === state.shooting.thumbnailCode);
    const shootingCast = state.storyboard.find((item) => item.type === 'intro')?.cast || [];
    const shootingSpeakerLabel = (speakerId) => speakerId === 'protagonist' ? (state.protagonist.name || '주인공') : (shootingCast.find((member) => member.id === speakerId)?.role || '주인공');
    app.innerHTML = `<section class="screen shooting-screen">${header(stageLabel(6), '다음 시간 촬영을 준비해요', '역할·장소·준비물·대표 화면을 한눈에 정리해요.')}<div class="shooting-grid"><div class="card shooting-card"><h2>① 역할 정하기 <span class="required">*</span></h2><div class="roles" id="roles">${state.shooting.roles.map((r) => `<div class="role-row" data-role-id="${r.id}"><input data-role-field="role" maxlength="20" value="${esc(r.role)}" aria-label="역할" placeholder="역할"><input data-role-field="name" maxlength="30" value="${esc(r.name)}" aria-label="맡은 사람" placeholder="맡은 사람"><button class="ghost-button small-button" data-remove-role="${r.id}">삭제</button></div>`).join('')}</div><button id="add-role" class="add-scene compact-add">＋ 역할 추가</button><p id="roles-error" class="error" role="alert"></p><h2>② 촬영 장소 <span class="required">*</span></h2><div class="location-options">${['교실','복도','운동장','기타'].map((x) => `<label><input type="radio" name="location" value="${x}" ${state.shooting.location === x ? 'checked' : ''}><span>${x}</span></label>`).join('')}</div><div class="field" id="custom-location-wrap" style="margin-top:8px;${state.shooting.location === '기타' ? '' : 'display:none'}"><input id="custom-location" maxlength="30" value="${esc(state.shooting.customLocation)}" placeholder="촬영 장소"></div><p id="location-error" class="error" role="alert"></p><h2>③ 준비물 <span class="required">*</span></h2><div class="field"><input id="props" maxlength="100" value="${esc(state.shooting.props)}" placeholder="예: 책, 이름표, 종이 붓"></div><p id="props-error" class="error" role="alert"></p><div class="shooting-tip"><strong>촬영 약속</strong><span>안전한 장소에서</span><span>짧고 또렷하게</span><span>서로 역할을 도우며</span></div></div><div class="card shooting-card"><h2>④ 대표 썸네일 <span class="required">*</span></h2><div class="thumb-grid">${D.thumbnails.map((t) => `<div class="choice thumb-card"><input type="radio" name="thumbnail" id="thumb-${t.code}" value="${t.code}" ${t.code === state.shooting.thumbnailCode ? 'checked' : ''}><label for="thumb-${t.code}"><span class="thumb-art" style="--c1:${t.colors[0]};--c2:${t.colors[1]}">${t.icon}</span><span class="thumb-label">${t.title}</span></label></div>`).join('')}</div><p id="thumbnail-error" class="error" role="alert"></p><div class="completion"><div class="completion-icon">${selectedThumb ? selectedThumb.icon : '🎬'}</div><h2>촬영 준비 완료!</h2><p>다음 시간에는 이 기획안을 보며 직접 촬영해요.</p></div></div><div class="card shooting-card script-card"><h2>⑤ 촬영 대본 최종 확인</h2><div class="script-table">${state.storyboard.map((s,i) => `<div class="script-row"><strong>${i+1}</strong><span>${esc(s.description || s.title)}</span><span>${s.type === 'scene' ? esc(s.dialogues.map((line) => `${shootingSpeakerLabel(line.speakerId)}: ${line.text}`).join(' / ')) : `“${esc(s.dialogue)}”`}</span></div>`).join('')}</div></div></div>${actions(true, '준비 내용 확인하기')}</section>`;
    bindShooting(); commonBindings();
  }
  function bindShooting() {
    app.querySelectorAll('[data-role-field]').forEach((el) => el.addEventListener('input', () => { const r = state.shooting.roles.find((x) => x.id === el.closest('[data-role-id]').dataset.roleId); r[el.dataset.roleField] = el.value.trimStart(); save(); }));
    app.querySelectorAll('[data-remove-role]').forEach((el) => el.addEventListener('click', () => { state.shooting.roles = state.shooting.roles.filter((x) => x.id !== el.dataset.removeRole); save(); render(); }));
    document.getElementById('add-role').addEventListener('click', () => { state.shooting.roles.push({ id: `role-${Date.now()}`, role: '', name: '' }); save(); render(); });
    app.querySelectorAll('[name="location"]').forEach((el) => el.addEventListener('change', () => { state.shooting.location = el.value; save(); render(); }));
    document.getElementById('custom-location').addEventListener('input', (e) => { state.shooting.customLocation = e.target.value.trimStart(); save(); }); document.getElementById('props').addEventListener('input', (e) => { state.shooting.props = e.target.value.trimStart(); save(); });
    app.querySelectorAll('[name="thumbnail"]').forEach((el) => el.addEventListener('change', () => { state.shooting.thumbnailCode = el.value; save(); render(); }));
  }
  function validate(step) {
    clearErrors();
    if (step === 0) { if (!state.student.classNo) return error('start-error','반을 선택해 주세요.'); if (!state.student.groupName.trim()) return error('start-error','모둠 이름을 입력해 주세요.'); if (!state.student.authorName.trim()) return error('start-error','학생 이름을 입력해 주세요.'); }
    if (step === 1) { if (!state.protagonist.status) return error('status-error','주인공의 신분을 선택해 주세요.'); if (!state.protagonist.gender) return error('gender-error','주인공의 성별을 선택해 주세요.'); if (!state.protagonist.name.trim()) return error('hero-error','주인공의 이름을 입력해 주세요.'); }
    if (step === 2 && !state.selectedTopics.length) return error('topics-error','일기의 큰 주제를 하나 선택해 주세요.');
    if (step === 3 && !state.historicalBasis.length) return error('evidence-error','영상에 사용할 교과서 근거를 한 가지 이상 선택해 주세요.');
    if (step === 4) {
      for (let i=0;i<state.storyboard.length;i++) {
        const s=state.storyboard[i];
        if (s.type==='intro' && !s.title.trim()) return error('story-error','첫 장면의 영상 제목을 입력해 주세요.');
        if (!s.description.trim()) return error('story-error',s.type === 'conclusion' ? '오늘 하루를 보낸 소감을 입력해 주세요.' : `${i+1}장면의 설명을 입력해 주세요.`);
        if (s.type === 'scene') {
          if (!s.dialogues.length || s.dialogues.some((line) => !line.text.trim())) return error('story-error',`${i+1}장면의 모든 대사를 입력해 주세요.`);
        } else if (!s.dialogue.trim()) return error('story-error',s.type === 'conclusion' ? '일기를 쓰며 알게 된 역사적 사실을 입력해 주세요.' : `${i+1}장면의 대사를 입력해 주세요.`);
      }
    }
    if (step === 6) { if (!state.shooting.roles.length || state.shooting.roles.some((r) => !r.role.trim() || !r.name.trim())) return error('roles-error','각 역할과 맡은 사람을 모두 입력해 주세요.'); if (!state.shooting.location || (state.shooting.location==='기타' && !state.shooting.customLocation.trim())) return error('location-error','촬영 장소를 선택하거나 직접 입력해 주세요.'); if (!state.shooting.props.trim()) return error('props-error','촬영에 필요한 준비물을 짧게 입력해 주세요.'); if (!state.shooting.thumbnailCode) return error('thumbnail-error','대표 썸네일을 하나 선택해 주세요.'); }
    return true;
  }
  function nextStep() {
    if (state.currentStep === 4 && state.writingView === 'diary') { state.writingView = 'storyboard'; save(); render(); return; }
    if (!validate(state.currentStep)) return;
    if (state.currentStep === 6) { notify('촬영 준비 내용을 모두 확인했어요!'); return; }
    const next = adjacentStep(state.currentStep, 1);
    if (state.currentStep === 4 && state.writingView === 'storyboard' && next === 5) state.resultView = 'storyboard';
    if (next === 4) state.writingView = 'diary';
    go(next, true);
  }
  function go(step, advance) { window.PreviewPlayer.destroy(); if (diaryPreviewCleanup) diaryPreviewCleanup(); state.currentStep = Math.max(0, Math.min(6, step)); if (advance) state.maxVisitedStep = Math.max(state.maxVisitedStep, state.currentStep); save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function render() {
    if (!evidenceStepEnabled && state.currentStep === 3) {
      state.currentStep = 4;
      state.maxVisitedStep = Math.max(state.maxVisitedStep, 4);
      save();
    }
    renderProgress();
    const screens = [renderStart,renderProtagonist,renderTopics,renderEvidence,renderStoryboard,renderPreview,renderShooting];
    if (state.currentStep === 4 && state.writingView === 'diary') renderDiary();
    else screens[state.currentStep]();
    updateInquiryGate();
    updateActivityTimer();
    if (getTimerStart() && !timerInterval) timerInterval = window.setInterval(updateActivityTimer, 1000);
  }
  inquiryScroll.addEventListener('click', () => {
    if (inquiryGate.classList.contains('is-open')) return;
    inquiryGate.classList.add('is-open');
    inquiryScroll.setAttribute('aria-expanded', 'true');
    inquiryStart.disabled = false;
    window.setTimeout(() => inquiryStart.focus(), 1250);
  });
  inquiryStart.addEventListener('click', () => {
    if (!inquiryGate.classList.contains('is-open')) return;
    const isReview = inquiryGate.dataset.mode === 'review';
    if (inquiryGate.dataset.mode === 'intro') { state.inquiryAcknowledged = true; save(); }
    startActivityTimer();
    document.body.classList.remove('inquiry-locked');
    activityBar.inert = false;
    app.inert = false;
    inquiryGate.classList.add('is-leaving');
    window.setTimeout(() => {
      inquiryGate.hidden = true;
      if (isReview && inquiryReturnFocus?.isConnected) inquiryReturnFocus.focus();
      else app.focus();
      inquiryReturnFocus = null;
    }, 420);
  });
  const dialog = document.getElementById('reset-dialog'); document.getElementById('reset-open').addEventListener('click', () => dialog.showModal()); document.getElementById('reset-cancel').addEventListener('click', () => dialog.close()); document.getElementById('reset-confirm').addEventListener('click', () => { window.JoseonStorage.clear(); state = window.JoseonStorage.freshState(); dialog.close(); save(); render(); notify('처음부터 새로 시작합니다.'); });
  document.getElementById('share-submit').addEventListener('click', submitShare);
  const syncShareButton = () => { document.getElementById('share-submit').disabled = !document.getElementById('share-diary-check').checked && !document.getElementById('share-storyboard-check').checked; };
  document.getElementById('share-diary-check').addEventListener('change', syncShareButton);
  document.getElementById('share-storyboard-check').addEventListener('change', syncShareButton);
  window.JoseonGallery?.init({ getCurrentClass: () => Number(state.student.classNo) || 1, onPreview: openSharedProject, onEdit: editSharedProject, onDelete: handleDeletedProject, onNotify: notify });
  document.getElementById('gallery-open').addEventListener('click', () => window.JoseonGallery?.open(Number(state.student.classNo) || 1, 'diary'));
  render();
})();
