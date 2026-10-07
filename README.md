# 나도 조선 브이로거

초등학교 5학년 사회 수업에서 조선 시대 유교 문화와 생활 모습을 일기와 영상일기 스토리보드로 표현하는 수업용 웹앱입니다.

## 주요 기능

- 주인공 선택
- 일기 작성
- 붓 애니메이션 일기 미리보기
- 영상일기 스토리보드
- 스토리보드 자동 미리보기
- 반별 작품관
- Supabase 작품 공유

## 실행

정적 웹앱이므로 `index.html`을 Live Server 같은 HTTP 서버로 실행합니다. GitHub Pages에서는 저장소 루트를 배포 경로로 사용합니다.

Supabase를 새로 구성할 때는 `supabase/schema.sql`을 SQL Editor에서 실행하고, `js/supabase-client.js`에 Project URL과 Publishable key만 설정합니다. 브라우저 코드에는 Secret key나 `service_role` key를 넣지 않습니다.
