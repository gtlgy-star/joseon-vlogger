# Supabase 연결 방법

1. Supabase 대시보드에서 사용할 프로젝트를 엽니다.
2. 왼쪽 **Authentication → Providers → Anonymous Sign-Ins**를 켭니다.
3. 왼쪽 **SQL Editor → New query**를 열고 `schema.sql` 전체를 붙여 넣은 뒤 **Run**을 누릅니다.
4. **Project Settings → API**에서 **Project URL**과 **Publishable key**(이전 프로젝트는 `anon public` key)를 확인합니다.
5. `js/supabase-client.js` 맨 위의 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`에 두 값을 입력합니다.
6. `service_role` key, 데이터베이스 비밀번호, 개인 secret은 입력하지 않습니다.
7. VS Code Live Server처럼 HTTP 서버로 `index.html`을 엽니다. 파일을 직접 더블 클릭한 `file://` 환경은 권장하지 않습니다.
8. 활동을 작성하고 4단계 미리보기에서 **결과 공유하기(작품관)**을 누릅니다.
9. 공유할 결과를 선택해 등록한 뒤 **작품관 보기**로 이동합니다.
10. 같은 작품을 다시 공유해도 카드가 늘어나지 않고 갱신되는지, 다른 브라우저에서는 관리 메뉴가 보이지 않는지 확인합니다.

GitHub Pages에서도 상대 경로와 HTTPS CDN을 사용하므로 동일하게 동작합니다. 배포 전 Supabase의 Authentication URL 설정에서 실제 GitHub Pages 주소를 허용 URL에 추가하세요.
