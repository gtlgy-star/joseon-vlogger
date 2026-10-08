(function () {
  'use strict';

  // Supabase 대시보드의 Project URL과 Publishable(또는 anon) key만 입력하세요.
  // service_role key와 데이터베이스 비밀번호는 절대 브라우저 코드에 넣지 마세요.
  const SUPABASE_URL = 'https://wpqbzpywqvvaerxzoizw.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XkofL_4CefvbQKiuA9C6Rg_1riGhnEX';
  // 초기 '작품 확인' 기능의 DB 이름을 추천 기능에서도 호환 목적으로 유지합니다.
  const RECOMMENDATIONS_TABLE = 'project_confirms';
  let client = null;
  let sessionPromise = null;

  function debug(event, details = {}) {
    console.info(`[JoseonSupabase] ${event}`, details);
  }

  function throwDbError(operation, error) {
    console.error(`[JoseonSupabase] DB ${operation} failed`, error);
    throw error;
  }

  function isConfigured() {
    return /^https:\/\/.+\.supabase\.co\/?$/.test(SUPABASE_URL) && SUPABASE_PUBLISHABLE_KEY.length > 20;
  }

  function getClient() {
    if (!isConfigured()) throw new Error('SUPABASE_NOT_CONFIGURED');
    if (!window.supabase?.createClient) throw new Error('SUPABASE_SDK_UNAVAILABLE');
    if (!client) {
      debug('SDK loaded', { createClient: true });
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
    }
    return client;
  }

  async function ensureSession() {
    debug('ensureSession start', { pending: Boolean(sessionPromise) });
    if (sessionPromise) return sessionPromise;
    sessionPromise = (async () => {
      const api = getClient();
      const { data, error } = await api.auth.getSession();
      if (error) {
        console.error('[JoseonSupabase] getSession failed', error);
        throw error;
      }
      debug('existing session', { exists: Boolean(data.session), userId: data.session?.user?.id || null });
      if (data.session?.user?.id) return data.session;
      const signedIn = await api.auth.signInAnonymously();
      if (signedIn.error) {
        console.error('[JoseonSupabase] signInAnonymously failed', signedIn.error);
        throw signedIn.error;
      }
      if (!signedIn.data.session?.user?.id) throw new Error('SUPABASE_ANONYMOUS_SESSION_MISSING');
      debug('signInAnonymously succeeded', { userId: signedIn.data.session.user.id });
      return signedIn.data.session;
    })().catch((error) => {
      sessionPromise = null;
      throw error;
    });
    return sessionPromise;
  }

  async function currentUserId() {
    return (await ensureSession()).user.id;
  }

  async function sessionForDb(operation) {
    const session = await ensureSession();
    debug(`DB ${operation} request`, { hasSession: Boolean(session), userId: session?.user?.id || null });
    return session;
  }

  async function upsertProject(project) {
    const session = await sessionForDb('UPSERT');
    const payload = { ...project, owner_id: session.user.id, updated_at: new Date().toISOString() };
    const { data, error } = await getClient().from('projects').upsert(payload, { onConflict: 'owner_id,client_project_id' }).select().single();
    if (error) throwDbError('UPSERT', error);
    return data;
  }

  async function listProjects(classNumber, type, limit = 12) {
    const session = await sessionForDb('SELECT');
    let query = getClient().from('projects').select('id,owner_id,client_project_id,grade,class_number,group_number,display_name,title,social_status,thumbnail,snapshot,diary_shared,storyboard_shared,created_at,updated_at').eq('class_number', Number(classNumber));
    if (type === 'storyboard') query = query.eq('storyboard_shared', true);
    else if (type === 'diary') query = query.eq('diary_shared', true);
    else query = query.or('diary_shared.eq.true,storyboard_shared.eq.true');
    const { data, error } = await query.order('updated_at', { ascending: false }).limit(limit);
    if (error) throwDbError('SELECT', error);
    const rows = data || [];
    if (!rows.length) return rows;
    const confirmed = await getClient().from(RECOMMENDATIONS_TABLE).select('project_id,user_id,content_type').in('project_id', rows.map((project) => project.id));
    if (confirmed.error) {
      console.warn('[JoseonSupabase] project confirmations unavailable', confirmed.error);
      return rows.map((project) => ({ ...project, confirm_count: 0, diary_recommended_by_me: false, storyboard_recommended_by_me: false }));
    }
    const counts = new Map();
    const mine = new Set();
    (confirmed.data || []).forEach((item) => {
      counts.set(item.project_id, (counts.get(item.project_id) || 0) + 1);
      if (item.user_id === session.user.id) mine.add(`${item.project_id}:${item.content_type}`);
    });
    return rows.map((project) => ({
      ...project,
      confirm_count: counts.get(project.id) || 0,
      diary_recommended_by_me: mine.has(`${project.id}:diary`),
      storyboard_recommended_by_me: mine.has(`${project.id}:storyboard`)
    }));
  }

  async function listProjectCountsByClass() {
    await sessionForDb('COUNT');
    const { data, error } = await getClient()
      .from('projects')
      .select('class_number')
      .or('diary_shared.eq.true,storyboard_shared.eq.true');
    if (error) throwDbError('COUNT', error);
    const counts = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((number) => [number, 0]));
    (data || []).forEach((project) => {
      const classNumber = Number(project.class_number);
      if (classNumber >= 1 && classNumber <= 7) counts[classNumber] += 1;
    });
    return counts;
  }

  async function setProjectRecommended(projectId, contentType, recommended) {
    if (contentType !== 'diary' && contentType !== 'storyboard') throw new Error('INVALID_RECOMMENDATION_TYPE');
    const session = await sessionForDb(recommended ? 'RECOMMEND' : 'UNRECOMMEND');
    if (recommended) {
      const result = await getClient().from(RECOMMENDATIONS_TABLE).upsert({ project_id: projectId, user_id: session.user.id, content_type: contentType }, { onConflict: 'project_id,user_id,content_type', ignoreDuplicates: true });
      if (result.error) throwDbError('CONFIRM', result.error);
    } else {
      const result = await getClient().from(RECOMMENDATIONS_TABLE).delete().eq('project_id', projectId).eq('user_id', session.user.id).eq('content_type', contentType);
      if (result.error) throwDbError('UNCONFIRM', result.error);
    }
    return recommended;
  }

  async function updateSharing(id, changes) {
    await sessionForDb('UPDATE');
    const { error } = await getClient().from('projects').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throwDbError('UPDATE', error);
    if (!changes.diary_shared && !changes.storyboard_shared) {
      await sessionForDb('DELETE');
      const removed = await getClient().from('projects').delete().eq('id', id);
      if (removed.error) throwDbError('DELETE', removed.error);
    }
    return changes;
  }

  async function deleteProject(id) {
    const session = await sessionForDb('DELETE');
    const { error } = await getClient().from('projects').delete().eq('id', id).eq('owner_id', session.user.id);
    if (error) throwDbError('DELETE', error);
  }

  window.JoseonSupabase = { isConfigured, ensureSession, currentUserId, upsertProject, listProjects, listProjectCountsByClass, setProjectRecommended, updateSharing, deleteProject };
})();
