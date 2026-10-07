(function () {
  'use strict';

  const ROOT = 'assets/lifestyles/';
  const poseSets = Object.freeze({
    yangban: Object.freeze({
      '남': Object.freeze({
        basic: { src: `${ROOT}yangban_male_01_basic.png`, label: '기본 자세', x: 22, bottom: 1, height: 88, maxWidth: 46 },
        talking: { src: `${ROOT}yangban_male_02_talking.png`, label: '말하는 자세', x: 22, bottom: -2, height: 72, maxWidth: 44 },
        walking: { src: `${ROOT}yangban_male_03_walking.png`, label: '걷는 자세', x: 23, bottom: 0, height: 91, maxWidth: 48 },
        bow: { src: `${ROOT}yangban_male_04_bow.png`, label: '인사하는 자세', x: 22, bottom: 0, height: 88, maxWidth: 46 },
        study: { src: `${ROOT}yangban_male_05_study.png`, label: '공부하는 자세', x: 22, bottom: 0, height: 87, maxWidth: 47 },
        writing: { src: `${ROOT}yangban_male_06_writing.png`, label: '글 쓰는 자세', x: 25, bottom: -1, height: 84, maxWidth: 53 },
        thinking: { src: `${ROOT}yangban_male_07_thinking.png`, label: '생각하는 자세', x: 22, bottom: 0, height: 87, maxWidth: 46 }
      }),
      '여': Object.freeze({
        basic: { src: `${ROOT}yangban_female_01_basic.png`, label: '기본 자세', x: 22, bottom: 1, height: 88, maxWidth: 47 },
        talking: { src: `${ROOT}yangban_female_02_talking.png`, label: '말하는 자세', x: 22, bottom: -2, height: 72, maxWidth: 45 },
        walking: { src: `${ROOT}yangban_female_03_walking.png`, label: '걷는 자세', x: 23, bottom: 0, height: 91, maxWidth: 50 },
        bow: { src: `${ROOT}yangban_female_04_bow.png`, label: '인사하는 자세', x: 22, bottom: 0, height: 88, maxWidth: 48 },
        manners: { src: `${ROOT}yangban_female_05_manners.png`, label: '예절을 갖춘 자세', x: 22, bottom: 0, height: 88, maxWidth: 47 },
        tray: { src: `${ROOT}yangban_female_06_tray.png`, label: '쟁반을 든 자세', x: 23, bottom: 0, height: 87, maxWidth: 50 },
        'tray-walking': { src: `${ROOT}yangban_female_07_tray_walking.png`, label: '쟁반을 들고 걷는 자세', x: 24, bottom: 0, height: 91, maxWidth: 52 }
      })
    }),
    jungin: Object.freeze({
      '남': Object.freeze({
        basic: { src: `${ROOT}jungin_male_01_basic.png`, label: '기본 자세', x: 22, bottom: 1, height: 88, maxWidth: 46 },
        talking: { src: `${ROOT}jungin_male_02_talking.png`, label: '말하는 자세', x: 22, bottom: -2, height: 72, maxWidth: 44 },
        walking: { src: `${ROOT}jungin_male_03_walking.png`, label: '걷는 자세', x: 23, bottom: 0, height: 91, maxWidth: 48 },
        bow: { src: `${ROOT}jungin_male_04_bow.png`, label: '인사하는 자세', x: 22, bottom: 0, height: 88, maxWidth: 46 },
        document: { src: `${ROOT}jungin_male_05_document.png`, label: '문서를 확인하는 자세', x: 23, bottom: 0, height: 86, maxWidth: 48 },
        writing: { src: `${ROOT}jungin_male_06_writing.png`, label: '기록하는 자세', x: 23, bottom: 0, height: 86, maxWidth: 48 },
        explaining: { src: `${ROOT}jungin_male_07_explaining.png`, label: '설명하는 자세', x: 23, bottom: 0, height: 86, maxWidth: 50 }
      }),
      '여': Object.freeze({
        basic: { src: `${ROOT}jungin_female_01_basic.png`, label: '기본 자세', x: 22, bottom: 1, height: 88, maxWidth: 47 },
        talking: { src: `${ROOT}jungin_female_02_talking.png`, label: '말하는 자세', x: 22, bottom: -2, height: 72, maxWidth: 45 },
        walking: { src: `${ROOT}jungin_female_03_walking.png`, label: '걷는 자세', x: 23, bottom: 0, height: 91, maxWidth: 50 },
        bow: { src: `${ROOT}jungin_female_04_bow.png`, label: '인사하는 자세', x: 22, bottom: 0, height: 88, maxWidth: 47 },
        'carry-books': { src: `${ROOT}jungin_female_05_carry_books.png`, label: '책을 나르는 자세', x: 24, bottom: 0, height: 90, maxWidth: 51 },
        'hand-document': { src: `${ROOT}jungin_female_06_hand_document.png`, label: '문서를 건네는 자세', x: 23, bottom: 0, height: 88, maxWidth: 50 },
        tray: { src: `${ROOT}jungin_female_07_tray.png`, label: '쟁반을 나르는 자세', x: 24, bottom: 0, height: 90, maxWidth: 52 }
      })
    }),
    sangmin: Object.freeze({
      '남': Object.freeze({
        basic: { src: `${ROOT}sangmin_male_01_basic.png`, label: '기본 자세', x: 22, bottom: 1, height: 88, maxWidth: 47 },
        talking: { src: `${ROOT}sangmin_male_02_talking.png`, label: '말하는 자세', x: 22, bottom: -2, height: 72, maxWidth: 45 },
        walking: { src: `${ROOT}sangmin_male_03_walking.png`, label: '걷는 자세', x: 23, bottom: 0, height: 91, maxWidth: 49 },
        bow: { src: `${ROOT}sangmin_male_04_bow.png`, label: '인사하는 자세', x: 22, bottom: 0, height: 88, maxWidth: 47 },
        farming: { src: `${ROOT}sangmin_male_05_farming.png`, label: '밭을 가는 자세', x: 23, bottom: -1, height: 90, maxWidth: 51 },
        harvest: { src: `${ROOT}sangmin_male_06_harvest.png`, label: '곡식을 거두는 자세', x: 23, bottom: 0, height: 90, maxWidth: 51 },
        resting: { src: `${ROOT}sangmin_male_07_resting.png`, label: '일하다 쉬는 자세', x: 23, bottom: -1, height: 88, maxWidth: 51 }
      }),
      '여': Object.freeze({
        basic: { src: `${ROOT}sangmin_female_01_basic.png`, label: '기본 자세', x: 22, bottom: 1, height: 88, maxWidth: 47 },
        talking: { src: `${ROOT}sangmin_female_02_talking.png`, label: '말하는 자세', x: 22, bottom: -2, height: 72, maxWidth: 45 },
        walking: { src: `${ROOT}sangmin_female_03_walking.png`, label: '걷는 자세', x: 23, bottom: 0, height: 91, maxWidth: 50 },
        bow: { src: `${ROOT}sangmin_female_04_bow.png`, label: '인사하는 자세', x: 22, bottom: 0, height: 88, maxWidth: 48 },
        'carry-vegetables': { src: `${ROOT}sangmin_female_05_carry_vegetables.png`, label: '채소 바구니를 나르는 자세', x: 24, bottom: 0, height: 90, maxWidth: 52 },
        'pounding-grain': { src: `${ROOT}sangmin_female_06_pounding_grain.png`, label: '곡식을 찧는 자세', x: 23, bottom: -1, height: 88, maxWidth: 52 },
        washing: { src: `${ROOT}sangmin_female_07_washing.png`, label: '빨래하는 자세', x: 23, bottom: -1, height: 88, maxWidth: 52 }
      })
    }),
    cheonmin: Object.freeze({
      '남': Object.freeze({
        basic: { src: `${ROOT}cheonmin_male_01_basic.png`, label: '기본 자세', x: 22, bottom: 1, height: 88, maxWidth: 46 },
        talking: { src: `${ROOT}cheonmin_male_02_talking.png`, label: '말하는 자세', x: 22, bottom: -1, height: 75, maxWidth: 49 },
        walking: { src: `${ROOT}cheonmin_male_03_walking.png`, label: '걷는 자세', x: 23, bottom: 0, height: 88, maxWidth: 48 },
        bow: { src: `${ROOT}cheonmin_male_04_bow.png`, label: '인사하는 자세', x: 22, bottom: 0, height: 82, maxWidth: 46 },
        cleaning: { src: `${ROOT}cheonmin_male_05_cleaning.png`, label: '빗자루로 청소하는 자세', x: 23, bottom: -1, height: 82, maxWidth: 50 },
        firewood: { src: `${ROOT}cheonmin_male_06_firewood.png`, label: '장작을 나르는 자세', x: 23, bottom: 0, height: 86, maxWidth: 49 },
        'carry-water': { src: `${ROOT}cheonmin_male_07_carry_water.png`, label: '물을 나르는 자세', x: 24, bottom: -1, height: 84, maxWidth: 52 }
      }),
      '여': Object.freeze({
        basic: { src: `${ROOT}cheonmin_female_01_basic.png`, label: '기본 자세', x: 22, bottom: 1, height: 88, maxWidth: 46 },
        talking: { src: `${ROOT}cheonmin_female_02_talking.png`, label: '말하는 자세', x: 22, bottom: -1, height: 75, maxWidth: 49 },
        walking: { src: `${ROOT}cheonmin_female_03_walking.png`, label: '걷는 자세', x: 23, bottom: 0, height: 88, maxWidth: 48 },
        bow: { src: `${ROOT}cheonmin_female_04_bow.png`, label: '인사하는 자세', x: 22, bottom: 0, height: 82, maxWidth: 46 },
        washing: { src: `${ROOT}cheonmin_female_05_washing.png`, label: '빨래하는 자세', x: 23, bottom: -1, height: 82, maxWidth: 50 },
        'carry-water': { src: `${ROOT}cheonmin_female_06_carry_water.png`, label: '물을 나르는 자세', x: 24, bottom: -1, height: 84, maxWidth: 51 },
        cleaning: { src: `${ROOT}cheonmin_female_07_cleaning.png`, label: '빗자루로 청소하는 자세', x: 23, bottom: -1, height: 82, maxWidth: 50 }
      })
    })
  });

  const poseRules = [
    ['washing', /빨래|세탁|옷[을 ]*(?:빨|씻)|빨랫/],
    ['carry-water', /물[을 ]*(?:긷|길|나르|옮기)|물동이|물지게|우물[^.]*(?:물|긷|길)/],
    ['cleaning', /청소|빗자루|마당[을 ]*쓸|방[을 ]*쓸|쓸고|쓸었다/],
    ['firewood', /장작|땔감|나무[를 ]*(?:하|패|나르|지)|불쏘시개/],
    ['pounding-grain', /절구|방아|곡식[을 ]*(?:빻|찧)|쌀[을 ]*(?:빻|찧)/],
    ['harvest', /수확|추수|벼[를 ]*베|곡식[을 ]*거두|볏단|벼를 나르/],
    ['carry-vegetables', /(?:채소|나물|배추|무)[^.]*(?:바구니|나르|들고|옮기|장터|시장)|(?:바구니)[^.]*(?:채소|나물|배추|무)/],
    ['resting', /(?:일하다|농사|일을 하다)[^.]*(?:쉬|휴식)|땀[을 ]*닦|힘들어|지쳐|잠시 쉬/],
    ['farming', /농사|밭[을 ]*(?:갈|매)|김매기|모내기|모[를 ]*심|씨[를 ]*뿌|호미|괭이|논일|밭일/],
    ['tray-walking', /(?:차|다과|음식|밥상|쟁반|상을)[^.]*(?:나르|들고 가|옮기|가져가|가져갔)/],
    ['tray', /차를 내|다과|음식|밥상|쟁반|상을 차리|시중/],
    ['hand-document', /(?:문서|서류|편지)[^.]*(?:건네|전달|내밀|가져다)/],
    ['writing', /글[을 ]*쓰|글씨|붓|벼루|먹을 갈|기록|편지를 쓰|써 내려/],
    ['document', /문서|서류|장부|공문|관청의 일|관청에서 일/],
    ['carry-books', /책[을 ]*(?:나르|옮기|안고|가져가)|책 꾸러미/],
    ['study', /공부|책[을 ]*읽|경전|유교를 배우|학문|배우|익히/],
    ['manners', /몸가짐|예의 바른|예절을 지|단정하게/],
    ['bow', /인사|절을|절하|공경|예를 올|예절|허리를 숙|시부모|관례|혼례|상례|장례|제례|제사/],
    ['walking', /걷|걸어|걸었|길을 가|길을 나서|이동|심부름|찾아가|데려오|떠나|도착/],
    ['thinking', /생각|고민|궁리|계획|깨달|떠올|마음먹/],
    ['explaining', /설명|가르치|알려 주|풀이|통역/],
    ['talking', /말하|말했|이야기|대화|묻|물어|대답|전하|장사|흥정|물건[을 ]*(?:팔|사고팔)/]
  ];

  function availablePose(set, requestedKey) {
    if (set[requestedKey]) return requestedKey;
    return set.talking ? 'talking' : 'basic';
  }

  function resolve(scene = {}, statusCode = '', gender = '', fallbackSrc = '') {
    const set = poseSets[statusCode]?.[gender];
    if (!set) {
      return fallbackSrc ? {
        key: 'legacy',
        src: fallbackSrc,
        label: '기본 인물',
        x: 23,
        bottom: 1,
        height: 86,
        maxWidth: 46,
        legacy: true,
        reason: 'legacy-fallback'
      } : null;
    }

    const text = `${scene.title || ''} ${scene.description || ''} ${scene.dialogue || ''}`.replace(/\s+/g, ' ').trim();
    let requestedKey = scene.type === 'intro' || scene.type === 'conclusion' ? 'talking' : '';
    if (!requestedKey) requestedKey = poseRules.find(([, pattern]) => pattern.test(text))?.[0] || 'talking';
    const key = availablePose(set, requestedKey);
    const reason = requestedKey === 'talking'
      ? 'default-talking'
      : key === requestedKey
        ? 'exact-action'
        : 'talking-fallback';
    return { key, requestedKey, ...set[key], legacy: false, reason };
  }

  window.JoseonLifestyles = Object.freeze({ poseSets, resolve });
})();
