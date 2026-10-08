(function () {
  'use strict';
  const layer = () => document.getElementById('gallery-layer');
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  let hooks = {};
  let activeClass = 1;
  let projects = [];
  let currentUserId = '';
  let visibleCount = 8;
  let classCounts = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((number) => [number, 0]));

  function shell(content) {
    return `<div class="gallery-shell"><header class="gallery-header"><div><span>5학년 사회</span><h1>🏛 조선 브이로거 작품관</h1><p>풍무초등학교 친구들이 만든 조선 시대의 하루를 감상해 보세요.</p></div><button id="gallery-close" class="secondary-button" type="button">내 작품으로 돌아가기</button></header><nav class="gallery-class-tabs" aria-label="반 선택">${[1,2,3,4,5,6,7].map((number) => `<button type="button" data-gallery-class="${number}" class="${number === activeClass ? 'active' : ''}">${number}반(${classCounts[number] || 0}작품 수록)</button>`).join('')}</nav><main class="gallery-content">${content}</main></div>`;
  }

  function bindNavigation() {
    document.getElementById('gallery-close')?.addEventListener('click', close);
    layer().querySelectorAll('[data-gallery-class]').forEach((button) => button.addEventListener('click', () => open(Number(button.dataset.galleryClass))));
  }

  function renderMessage(kind) {
    const messages = {
      loading: '<div class="gallery-message"><span>⌛</span><strong>작품을 불러오고 있어요…</strong></div>',
      empty: `<div class="gallery-message"><span>🖼️</span><strong>아직 공유된 작품이 없어요.</strong><p>우리 모둠의 첫 작품을 공유해 보세요!</p></div>`,
      setup: '<div class="gallery-message"><span>🔌</span><strong>작품관 연결이 필요해요.</strong><p>supabase/README.md의 순서대로 설정해 주세요.</p></div>',
      error: '<div class="gallery-message"><span>⚠️</span><strong>작품을 불러오지 못했어요.</strong><p>잠시 후 다시 시도해 주세요.</p><button id="gallery-retry" class="primary-button">다시 불러오기</button></div>'
    };
    layer().innerHTML = shell(messages[kind]);
    bindNavigation();
    document.getElementById('gallery-retry')?.addEventListener('click', refresh);
  }

  function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function sceneHasContent(scene) {
    return Boolean(scene && (
      hasText(scene.title) || hasText(scene.description) || hasText(scene.details) ||
      hasText(scene.dialogue) || hasText(scene.topicCode) ||
      scene.dialogues?.some((line) => hasText(line?.text))
    ));
  }

  function resolveVisual(scene, snapshot) {
    const hero = snapshot.protagonist || {};
    const topic = window.JoseonData?.topics?.find((item) => item.code === scene.topicCode);
    const source = topic ? { ...scene, title: `${scene.title || ''} ${topic.title}`, description: `${scene.description || ''} ${topic.description}` } : scene;
    return {
      background: window.JoseonBackgrounds?.resolve(source, hero.status),
      character: window.JoseonLifestyles?.resolve(source, hero.status, hero.gender, '')
    };
  }

  function thumbnailModel(project) {
    const snapshot = project.snapshot || {};
    const hero = snapshot.protagonist || {};
    const storyboard = Array.isArray(snapshot.storyboard) ? snapshot.storyboard : [];
    const firstStoryboardScene = storyboard.find((scene) => scene.type === 'scene' && sceneHasContent(scene));

    if (project.storyboard_shared && firstStoryboardScene) {
      return { kind: 'storyboard', label: '스토리보드 첫 장면', subtitle: `${hero.name || '주인공'}의 하루`, ...resolveVisual(firstStoryboardScene, snapshot) };
    }

    const diary = snapshot.diary || {};
    if (project.diary_shared && (hasText(diary.title) || hasText(diary.body))) {
      const topicCode = snapshot.selectedTopics?.[0] || '';
      const topic = window.JoseonData?.topics?.find((item) => item.code === topicCode);
      const diaryScene = {
        type: 'scene',
        topicCode,
        title: `${diary.title || ''} ${topic?.title || ''}`,
        description: `${snapshot.topicNotes?.[topicCode] || ''} ${diary.body || ''}`,
        dialogue: diary.body || ''
      };
      return { kind: 'diary', label: '일기 첫 화면', subtitle: `${hero.name || '주인공'}의 일기`, ...resolveVisual(diaryScene, snapshot) };
    }

    const legacy = window.JoseonData?.thumbnails?.find((item) => item.code === (project.thumbnail || snapshot.thumbnail));
    return { kind: 'placeholder', label: '대표 이미지', subtitle: hero.name ? `${hero.name}의 하루` : '조선의 하루', icon: legacy?.icon || '🏛', colors: legacy?.colors || ['#547d78', '#9c6945'] };
  }

  function renderThumbnail(project) {
    const thumbnail = thumbnailModel(project);
    const title = project.title || '제목 없는 작품';
    if (thumbnail.kind === 'placeholder') {
      const style = `--gallery-c1:${esc(thumbnail.colors[0])};--gallery-c2:${esc(thumbnail.colors[1])}`;
      return `<div class="gallery-card-art is-placeholder" style="${style}"><span class="gallery-thumbnail-icon" aria-hidden="true">${thumbnail.icon}</span><div class="gallery-thumbnail-copy"><small>${esc(thumbnail.subtitle)}</small><b>${esc(title)}</b></div></div>`;
    }
    const pose = thumbnail.character;
    const characterStyle = `--thumb-character-x:${pose?.x ?? 22}%;--thumb-character-bottom:${pose?.bottom ?? 0}%;--thumb-character-height:${pose?.height ?? 88}%;--thumb-character-max-width:${pose?.maxWidth ?? 48}%`;
    return `<div class="gallery-card-art is-${thumbnail.kind}">${thumbnail.background?.src ? `<img class="gallery-thumbnail-background" src="${esc(thumbnail.background.src)}" alt="">` : ''}${pose?.src ? `<img class="gallery-thumbnail-character" src="${esc(pose.src)}" alt="" style="${characterStyle}">` : ''}<div class="gallery-thumbnail-overlay" aria-hidden="true"></div><div class="gallery-thumbnail-copy"><small>${esc(thumbnail.subtitle)}</small><b>${esc(title)}</b></div></div>`;
  }

  function card(project) {
    const own = Boolean(currentUserId && currentUserId === project.owner_id);
    const posterType = project.storyboard_shared ? 'storyboard' : 'diary';
    const diaryAction = `<button type="button" class="gallery-play-button is-diary" ${project.diary_shared ? `data-preview="${esc(project.id)}" data-preview-type="diary"` : 'disabled aria-disabled="true"'}>📜 일기 <span aria-hidden="true">▶</span></button>`;
    const storyboardAction = `<button type="button" class="gallery-play-button is-storyboard" ${project.storyboard_shared ? `data-preview="${esc(project.id)}" data-preview-type="storyboard"` : 'disabled aria-disabled="true"'}>🎬 스토리보드 <span aria-hidden="true">▶</span></button>`;
    const displayName = String(project.display_name || '').trim();
    const groupName = /^\d+$/.test(displayName) ? `${displayName}모둠` : (displayName || '우리 모둠');
    const count = Math.max(0, Number(project.confirm_count) || 0);
    const confirmed = Boolean(project.confirmed_by_me);
    const confirmButton = `<button type="button" class="gallery-confirm-button${confirmed ? ' is-confirmed' : ''}" data-confirm="${esc(project.id)}" data-confirmed="${confirmed}" aria-pressed="${confirmed}" title="${confirmed ? '추천 취소' : '이 작품을 추천해요'}"><span aria-hidden="true">👍</span><small>추천</small><strong>${count}</strong></button>`;
    const manageActions = own ? `<div class="gallery-owner-actions"><button type="button" class="gallery-edit-button" data-edit="${esc(project.id)}">수정</button><button type="button" class="gallery-delete-button" data-delete-project="${esc(project.id)}">삭제</button></div>` : '';
    return `<article class="gallery-card${own ? ' is-own' : ''}" data-project-id="${esc(project.id)}"><button class="gallery-card-poster" type="button" data-preview="${esc(project.id)}" data-preview-type="${posterType}" aria-label="${esc(project.title || '제목 없는 작품')} ${posterType === 'storyboard' ? '스토리보드' : '일기'} 미리보기">${renderThumbnail(project)}</button>${confirmButton}<div class="gallery-card-details"><h2>${esc(project.title || '제목 없는 작품')}</h2><p>${esc(groupName)}</p><div class="gallery-card-actions">${diaryAction}${storyboardAction}</div>${manageActions}</div></article>`;
  }

  function renderCards() {
    const visibleProjects = projects.slice(0, visibleCount);
    const moreButton = projects.length > visibleCount ? `<div class="gallery-more-wrap"><button id="gallery-more" class="secondary-button" type="button">작품 더 보기 (${projects.length - visibleCount})</button></div>` : '';
    layer().innerHTML = shell(projects.length ? `<div class="gallery-grid">${visibleProjects.map(card).join('')}</div>${moreButton}` : '<div class="gallery-message"><span>🖼️</span><strong>아직 공유된 작품이 없어요.</strong><p>우리 모둠의 첫 작품을 공유해 보세요!</p></div>');
    bindNavigation();
    layer().querySelectorAll('[data-preview]').forEach((button) => button.addEventListener('click', () => {
      const project = projects.find((item) => item.id === button.dataset.preview);
      if (project) hooks.onPreview?.({ ...project, is_own: project.owner_id === currentUserId }, button.dataset.previewType);
    }));
    layer().querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
      const project = projects.find((item) => item.id === button.dataset.edit);
      if (!project || project.owner_id !== currentUserId) return;
      if (!window.confirm(`“${project.title || '제목 없는 작품'}”을 불러와 수정할까요?\n현재 작성 중인 내용은 이 작품의 내용으로 바뀝니다.`)) return;
      hooks.onEdit?.(project);
    }));
    layer().querySelectorAll('[data-delete-project]').forEach((button) => button.addEventListener('click', async () => {
      const project = projects.find((item) => item.id === button.dataset.deleteProject);
      if (!project || project.owner_id !== currentUserId || button.disabled) return;
      if (!window.confirm(`“${project.title || '제목 없는 작품'}”을 작품관에서 삭제할까요?\n삭제한 작품은 되돌릴 수 없습니다.`)) return;
      button.disabled = true;
      try {
        await window.JoseonSupabase.deleteProject(project.id);
        projects = projects.filter((item) => item.id !== project.id);
        classCounts[activeClass] = Math.max(0, (classCounts[activeClass] || 0) - 1);
        hooks.onDelete?.(project);
        hooks.onNotify?.('작품을 삭제했어요.');
        renderCards();
      } catch (_) {
        button.disabled = false;
        hooks.onNotify?.('작품을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    }));
    layer().querySelectorAll('[data-confirm]').forEach((button) => button.addEventListener('click', async () => {
      const project = projects.find((item) => item.id === button.dataset.confirm);
      if (!project || button.disabled) return;
      const nextConfirmed = button.dataset.confirmed !== 'true';
      button.disabled = true;
      try {
        await window.JoseonSupabase.setProjectConfirmed(project.id, nextConfirmed);
        project.confirmed_by_me = nextConfirmed;
        project.confirm_count = Math.max(0, (Number(project.confirm_count) || 0) + (nextConfirmed ? 1 : -1));
        button.dataset.confirmed = String(nextConfirmed);
        button.setAttribute('aria-pressed', String(nextConfirmed));
        button.title = nextConfirmed ? '추천 취소' : '이 작품을 추천해요';
        button.classList.toggle('is-confirmed', nextConfirmed);
        button.querySelector('strong').textContent = String(project.confirm_count);
      } catch (_) {
        hooks.onNotify?.('추천을 저장하지 못했어요.');
      } finally {
        button.disabled = false;
      }
    }));
    document.getElementById('gallery-more')?.addEventListener('click', () => { visibleCount += 8; renderCards(); });
  }

  async function refresh() {
    if (!window.JoseonSupabase?.isConfigured()) { renderMessage('setup'); return; }
    renderMessage('loading');
    try {
      currentUserId = await window.JoseonSupabase.currentUserId();
      [projects, classCounts] = await Promise.all([
        window.JoseonSupabase.listProjects(activeClass, 'all', 32),
        window.JoseonSupabase.listProjectCountsByClass()
      ]);
      renderCards();
    } catch (_) { renderMessage('error'); }
  }

  function open(classNumber) {
    activeClass = Math.max(1, Math.min(7, Number(classNumber) || hooks.getCurrentClass?.() || 1));
    visibleCount = 8;
    layer().hidden = false; document.body.classList.add('gallery-open');
    refresh();
  }
  function close() { layer().hidden = true; document.body.classList.remove('gallery-open'); }
  function init(nextHooks) { hooks = nextHooks || {}; }

  window.JoseonGallery = { init, open, close, refresh };
})();
