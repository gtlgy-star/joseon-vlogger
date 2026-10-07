(function () {
  'use strict';

  const ROOT = 'assets/props/';
  const items = Object.freeze({
    broom: { src: `${ROOT}prop-broom.png`, label: '빗자루', scale: 0.64 },
    firewood: { src: `${ROOT}prop-firewood.png`, label: '장작', scale: 0.62 },
    'water-bucket': { src: `${ROOT}prop-water-bucket.png`, label: '나무 물통', scale: 0.6 },
    'hoe-seedlings': { src: `${ROOT}prop-hoe-seedlings.png`, label: '호미와 모', scale: 0.62 },
    'rice-sack': { src: `${ROOT}prop-rice-sack.png`, label: '쌀가마니', scale: 0.58 },
    'vegetable-basket': { src: `${ROOT}prop-vegetable-basket.png`, label: '채소 바구니', scale: 0.56 },
    'cloth-rolls': { src: `${ROOT}prop-cloth-rolls.png`, label: '옷감', scale: 0.54 },
    pottery: { src: `${ROOT}prop-pottery.png`, label: '옹기', scale: 0.56 },
    book: { src: `${ROOT}prop-book.png`, label: '책', scale: 0.5 },
    'writing-set': { src: `${ROOT}prop-writing-set.png`, label: '붓과 벼루', scale: 0.48 },
    'official-document': { src: `${ROOT}prop-official-document.png`, label: '관청 문서', scale: 0.5 },
    'medicine-chest': { src: `${ROOT}prop-medicine-chest.png`, label: '약재함', scale: 0.54 },
    'ancestral-tablet': { src: `${ROOT}prop-ancestral-tablet.png`, label: '위패', scale: 0.5 },
    'offering-table': { src: `${ROOT}prop-offering-table.png`, label: '제사상', scale: 0.58 },
    'wedding-goose': { src: `${ROOT}prop-wedding-goose.png`, label: '혼례 목기러기', scale: 0.5 },
    genealogy: { src: `${ROOT}prop-genealogy.png`, label: '족보', scale: 0.5 },
    jige: { src: `${ROOT}prop-jige.png`, label: '지게', scale: 0.58 },
    'bojagi-bundle': { src: `${ROOT}prop-bojagi-bundle.png`, label: '보따리', scale: 0.54 },
    'meal-tray': { src: `${ROOT}prop-meal-tray.png`, label: '밥상', scale: 0.56 },
    'laundry-paddle': { src: `${ROOT}prop-laundry-paddle.png`, label: '빨랫방망이와 옷감', scale: 0.56 },
    'coming-of-age': { src: `${ROOT}prop-coming-of-age.png`, label: '관례 쓰개', scale: 0.5 },
    'mourning-clothes': { src: `${ROOT}prop-mourning-clothes.png`, label: '상복', scale: 0.52 },
    'fishing-net': { src: `${ROOT}prop-fishing-net.png`, label: '그물과 물고기 바구니', scale: 0.6 },
    'military-gear': { src: `${ROOT}prop-military-gear.png`, label: '활과 창', scale: 0.58 }
  });

  const keywordRules = [
    ['wedding-goose', /혼례|혼인|결혼|신랑|신부|시집|장가/],
    ['mourning-clothes', /상례|장례|상복|상중|돌아가신|죽은 사람/],
    ['coming-of-age', /관례|성년|어른이 되었|갓을 쓰|비녀/],
    ['offering-table', /제사상|차례상|제물|음식을 차리|제사를 지내/],
    ['ancestral-tablet', /위패|조상|제례|제사/],
    ['genealogy', /족보|가문|성씨|혈연|양자|대를 잇|상속/],
    ['medicine-chest', /의원|의술|의학|약재|약을|치료|환자|병을|침을/],
    ['official-document', /관청|관아|나랏일|공적인 일|관리|서리|문서|기록/],
    ['military-gear', /군역|군대|병사|활을|화살|창을|훈련/],
    ['fishing-net', /어업|물고기|고기를 잡|그물|낚시/],
    ['water-bucket', /우물|물[을 ]*긷|물동이|물을 나르/],
    ['laundry-paddle', /빨래|세탁|옷을 씻|빨랫/],
    ['hoe-seedlings', /농사|모내기|김매기|논|밭|호미|모를 심/],
    ['rice-sack', /쌀|곡식|가마니|추수|수확|세곡|세금[을 ]*내/],
    ['vegetable-basket', /채소|나물|장보기|장을 보|먹을거리/],
    ['cloth-rolls', /옷감|비단|무명|삼베|베를 짜|천을|바느질/],
    ['pottery', /옹기|항아리|그릇|도자기|질그릇/],
    ['writing-set', /붓|벼루|먹을 갈|글씨|그림을 그|써 내려|글을 쓰/],
    ['book', /공부|책을|책을 읽|글을 읽|경전|유교를 배우|학문/],
    ['broom', /청소|빗자루|마당을 쓸|쓸었다|쓸고/],
    ['firewood', /장작|땔감|불을 피|아궁이/],
    ['jige', /지게|짐을 나르|짐을 지|나무를 나르|옮겨 날/],
    ['bojagi-bundle', /보따리|이사|길을 떠|먼 길|여행|짐을 싸/],
    ['meal-tray', /밥상|식사|밥을 먹|음식을 먹|상을 차리|부모님께 음식을/]
  ];

  const topicDefaults = Object.freeze({
    respect: ['meal-tray'],
    'coming-of-age': ['coming-of-age'],
    wedding: ['wedding-goose'],
    funeral: ['mourning-clothes'],
    'ancestral-rite': ['ancestral-tablet', 'offering-table'],
    'eldest-son': ['ancestral-tablet'],
    adoption: ['genealogy'],
    genealogy: ['genealogy'],
    'marriage-change': ['wedding-goose', 'bojagi-bundle']
  });

  const backgroundDefaults = Object.freeze({
    field: ['hoe-seedlings', 'rice-sack'],
    well: ['water-bucket'],
    market: ['vegetable-basket', 'rice-sack'],
    shop: ['cloth-rolls', 'pottery'],
    workplace: ['pottery', 'cloth-rolls'],
    'government-office': ['official-document', 'writing-set'],
    'yangban-backyard': ['broom', 'firewood'],
    haengrangchae: ['broom', 'jige'],
    'country-road': ['bojagi-bundle', 'jige']
  });

  const statusDefaults = Object.freeze({
    yangban: ['book'],
    jungin: ['writing-set'],
    sangmin: ['hoe-seedlings'],
    cheonmin: ['broom']
  });

  function resolve(scene = {}, context = {}) {
    const text = `${scene.title || ''} ${scene.description || ''} ${scene.dialogue || ''}`.replace(/\s+/g, ' ').trim();
    const selected = [];
    const add = (key, reason) => {
      if (!items[key] || selected.some((entry) => entry.key === key) || selected.length >= 2) return;
      selected.push({ key, reason });
    };

    keywordRules.forEach(([key, pattern]) => {
      if (pattern.test(text)) add(key, 'keyword');
    });
    (topicDefaults[scene.topicCode] || []).forEach((key) => add(key, 'topic'));
    (backgroundDefaults[context.backgroundKey] || []).forEach((key) => add(key, 'background'));
    if (!selected.length && scene.type === 'scene') {
      (statusDefaults[context.statusCode] || []).forEach((key) => add(key, 'status'));
    }

    const positions = selected.length === 1
      ? [{ x: 43, y: 72 }]
      : [{ x: 36, y: 73 }, { x: 49, y: 69 }];
    return selected.map((entry, index) => ({
      ...items[entry.key],
      key: entry.key,
      reason: entry.reason,
      x: positions[index].x,
      y: positions[index].y
    }));
  }

  window.JoseonProps = Object.freeze({ items, resolve });
})();
