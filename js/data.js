(function () {
  'use strict';
  window.JoseonData = {
    // 역사적 근거 찾기 화면이 다시 필요하면 아래 값을 true로 바꾸세요.
    features: { historicalEvidenceStep: false },
    steps: ['탐구질문 확인', '① 주인공 정하기', '② 일기 주제 정하기', '③ 역사적 근거 찾기', '④ 일기 만들기', '⑤ 완성·미리보기', '⑥ 촬영 준비하기'],
    statuses: [
      { code: 'yangban', label: '양반', hanja: '兩班', icon: '📖', summary: '문관과 무관을 함께 부르는 말이에요. 주로 높은 관직을 맡고 땅과 노비를 가진 지배층이었어요.', situations: [
        { code: 'yangban-study', title: '유교 책 공부하기', detail: '유교의 가르침이 담긴 책을 공부해요.' },
        { code: 'yangban-official', title: '관리로 나랏일 하기', detail: '관리가 되어 나랏일에 참여해요.' }
      ]},
      { code: 'jungin', label: '중인', hanja: '中人', icon: '🖌️', summary: '양반과 상민 사이의 신분이에요. 통역·의술·그림 같은 전문 기술이나 관청의 실무를 맡았어요.', situations: [
        { code: 'jungin-office', title: '관청에서 일하기', detail: '주로 관청에서 실무를 맡아 일해요.' },
        { code: 'jungin-specialist', title: '전문적인 일 하기', detail: '의학·법률 등의 전문적인 일을 하거나 통역을 해요.' }
      ]},
      { code: 'sangmin', label: '상민', hanja: '常民', icon: '🌾', summary: '조선 백성 가운데 가장 수가 많았어요. 농사나 물건 만들기·장사 등을 하며 세금과 여러 의무를 맡았어요.', situations: [
        { code: 'sangmin-farm', title: '농업으로 생산하기', detail: '농사를 지으며 생산 활동을 해요.' },
        { code: 'sangmin-work', title: '어업·수공업·상업 하기', detail: '물고기를 잡거나 물건을 만들고 팔아요.' },
        { code: 'sangmin-duty', title: '세금과 군역 맡기', detail: '나라에 세금을 내고 군대에 가는 의무를 맡아요.' }
      ]},
      { code: 'cheonmin', label: '천민', hanja: '賤民', icon: '🧹', summary: '가장 낮은 신분으로 노비가 대표적이에요. 노비는 사람인데도 재산처럼 사고팔거나 물려주는 대상이 되기도 했어요.', situations: [
        { code: 'cheonmin-office', title: '관청에서 일하기', detail: '관청에서 여러 허드렛일을 하며 생활해요.' },
        { code: 'cheonmin-yangban-house', title: '양반집에서 일하기', detail: '양반집의 노비로 생활하며 집안의 여러 일을 해요.' }
      ]}
    ],
    topics: [
      { code: 'status-life', category: '신분에 따른 생활 모습', title: '신분에 맞는 역할과 생활', icon: '👥', description: '태어날 때 정해진 신분에 따라 맡은 일과 생활 모습이 달랐어요.', moreInfo: ['법은 양인·천인, 실제 사회는 네 신분으로 나뉘었어요.', '후기에는 부유한 상민이 돈·곡식을 내고 품계를 얻기도 했어요.'], pages: '70~71쪽' },
      { code: 'respect', category: '유교의 가르침', title: '부모와 웃어른을 공경하는 생활', icon: '🙇', description: '나라에 충성하고 부모와 웃어른을 공손히 모시며 예절을 지켰어요.', moreInfo: ['향약은 선행을 권하고 어려울 때 서로 돕는 마을 약속이었어요.', '《삼강행실도》는 글을 모르는 백성도 알도록 그림을 넣었어요.'], pages: '72쪽' },
      { code: 'confucian-life', category: '유교에 따른 생활', title: '관혼상제와 가족생활의 변화', icon: '🎎', description: '관혼상제를 치르고 큰아들·족보·양자·혼인 풍습을 중요하게 여겼어요.', moreInfo: ['《주자가례》를 기준으로 조선 풍습에 맞게 고쳐 실천했어요.', '여성의 성인식인 계례는 머리를 올리고 비녀를 꽂았어요.'], pages: '73~74쪽' }
    ],
    evidence: {
      'status-life': [
        { code: 'ev-status-fixed', text: '조선 시대에는 태어날 때 신분이 정해졌고, 사람들은 주어진 신분에 맞게 생활했어요.', page: '70쪽' },
        { code: 'ev-status-work', text: '양반·중인·상민·천민은 맡은 일과 생활 모습이 서로 달랐어요.', page: '70~71쪽' }
      ],
      respect: [
        { code: 'ev-respect-order', text: '조선은 유교를 나라의 기본 정신으로 삼아 질서와 예절이 바른 나라를 만들고자 했어요.', page: '72쪽' },
        { code: 'ev-respect-life', text: '백성은 부모와 웃어른을 공손히 모시고 사람 사이의 예절을 지키며 생활했어요.', page: '72쪽' }
      ],
      'confucian-life': [
        { code: 'ev-coming', text: '관례는 성인이 되었음을 알리는 의식이에요.', page: '73쪽' },
        { code: 'ev-wedding', text: '혼례는 어른이 된 처녀와 총각이 혼인하는 의식이에요.', page: '73쪽' },
        { code: 'ev-funeral', text: '상례는 사람이 죽었을 때 죽은 사람을 기리며 치르는 의식이에요.', page: '73쪽' },
        { code: 'ev-rite', text: '제례는 조상에게 제사를 지내는 의식이며, 관혼상제 가운데 중요하게 여겼어요.', page: '73쪽' },
        { code: 'ev-eldest', text: '유교가 퍼지면서 큰아들이 제사를 이어 맡고 재산을 물려받을 때 우대를 받았어요.', page: '74쪽' },
        { code: 'ev-adoption', text: '아들이 없는 집안은 같은 성씨의 남자를 양자로 들여 제사를 지내게 했어요.', page: '74쪽' },
        { code: 'ev-genealogy', text: '아버지 쪽 혈연과 같은 성씨를 중요하게 생각하고 족보를 중요하게 여겼어요.', page: '74쪽' },
        { code: 'ev-marriage', text: '혼례 뒤 신랑이 신부 집에서 살던 풍습이 신부가 신랑 집에서 사는 풍습으로 바뀌어 갔어요.', page: '74쪽' }
      ]
    },
    thumbnails: [
      { code: 'hanok', icon: '🏡', title: '한옥 마당', colors: ['#ead7b8', '#8b3f2f'] },
      { code: 'book', icon: '📖', title: '책과 붓', colors: ['#d8e4cd', '#355c4b'] },
      { code: 'family', icon: '👨‍👩‍👧', title: '가족의 하루', colors: ['#f5d7c7', '#9c4f3d'] },
      { code: 'ceremony', icon: '🎎', title: '전통 의식', colors: ['#d9d4ec', '#5f527c'] }
    ]
  };
})();
