(function () {
  'use strict';

  const ROOT = 'assets/backgrounds/';
  const files = Object.freeze({
    'yangban-room': { src: `${ROOT}bg_yangban_room.png`, label: '양반 집안' },
    'jungin-room': { src: `${ROOT}bg_jungin_room.png`, label: '중인 집안' },
    'sangmin-room': { src: `${ROOT}bg_sangmin_room.png`, label: '상민 집안' },
    'cheonmin-room': { src: `${ROOT}bg_cheonmin_room.png`, label: '천민 집안' },
    'yangban-yard': { src: `${ROOT}bg_yangban_yard.png`, label: '양반집 마당' },
    'jungin-yard': { src: `${ROOT}bg_jungin_yard.png`, label: '중인 집 마당' },
    'sangmin-yard': { src: `${ROOT}bg_sangmin_yard.png`, label: '상민 집 마당' },
    'cheonmin-yard': { src: `${ROOT}bg_cheonmin_yard.png`, label: '천민 집 마당' },
    'yangban-backyard': { src: `${ROOT}bg_yangban_backyard.png`, label: '양반집 뒷마당' },
    haengrangchae: { src: `${ROOT}bg_haengrangchae.png`, label: '행랑채' },
    'village-road': { src: `${ROOT}bg_village_road.png`, label: '마을길' },
    'country-road': { src: `${ROOT}bg_country_road.png`, label: '산길' },
    well: { src: `${ROOT}bg_well.png`, label: '우물가' },
    'village-square': { src: `${ROOT}bg_village_square.png`, label: '마을 공터' },
    field: { src: `${ROOT}bg_field.png`, label: '논밭' },
    market: { src: `${ROOT}bg_market.png`, label: '장터' },
    workplace: { src: `${ROOT}bg_workplace.png`, label: '작업장' },
    shop: { src: `${ROOT}bg_shop.png`, label: '가게' },
    'government-office': { src: `${ROOT}bg_government_office.png`, label: '관청' },
    ceremony: { src: `${ROOT}bg_ceremony.png`, label: '의례 장소' }
  });

  const roomByStatus = Object.freeze({
    yangban: 'yangban-room',
    jungin: 'jungin-room',
    sangmin: 'sangmin-room',
    cheonmin: 'cheonmin-room'
  });
  const yardByStatus = Object.freeze({
    yangban: 'yangban-yard',
    jungin: 'jungin-yard',
    sangmin: 'sangmin-yard',
    cheonmin: 'cheonmin-yard'
  });
  const ceremonyTopics = new Set(['coming-of-age', 'wedding', 'funeral', 'ancestral-rite', 'marriage-change']);

  function result(key, reason) {
    const item = files[key] || files['sangmin-room'];
    return { key, src: item.src, label: item.label, reason };
  }

  function resolve(scene = {}, statusCode = '') {
    const text = `${scene.title || ''} ${scene.description || ''} ${scene.dialogue || ''}`.replace(/\s+/g, ' ').trim();
    const has = (pattern) => pattern.test(text);

    if ((has(/양반집|양반 댁|양반댁/) && has(/청소|장작|심부름/)) || has(/뒷마당|뒤뜰/)) {
      return result('yangban-backyard', 'keyword-yangban-backyard');
    }
    if (has(/혼례|결혼|제사|상례|장례|관례|의례/)) return result('ceremony', 'keyword-ceremony');
    if (has(/관청|관아|관리|서리|공적인 일|나랏일/)) return result('government-office', 'keyword-government-office');
    if (has(/우물|물[을 ]*긷|물 긷기|빨래/)) return result('well', 'keyword-well');
    if (has(/논|밭|농사|모내기|수확|곡식/)) return result('field', 'keyword-field');
    if (has(/장터|시장|사고팔|물건[을 ]*(사|팔)/)) return result('market', 'keyword-market');
    if (has(/가게|노점|장사/)) return result('shop', 'keyword-shop');
    if (has(/만들기|만들다|만드는|수공업|작업장|일하다|일을 하/)) return result('workplace', 'keyword-workplace');
    if (has(/마을 사람|마을사람|모임|공터|광장/)) return result('village-square', 'keyword-village-square');
    if (has(/산길|나무|숲길|먼 길/)) return result('country-road', 'keyword-country-road');
    if (has(/노비|행랑채/)) return result('haengrangchae', 'keyword-haengrangchae');
    if (has(/마을|길|이동|심부름/)) return result('village-road', 'keyword-village-road');
    if (has(/마당|뜰/)) return result(yardByStatus[statusCode] || 'sangmin-yard', 'keyword-status-yard');
    if (ceremonyTopics.has(scene.topicCode)) return result('ceremony', 'topic-ceremony');
    return result(roomByStatus[statusCode] || 'sangmin-room', 'default-status-room');
  }

  window.JoseonBackgrounds = Object.freeze({ files, roomByStatus, yardByStatus, resolve });
})();
