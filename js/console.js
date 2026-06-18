/* =========================================================
   console.js  (BaseAlert CONTROL)
   - 로그인 화면 "관제 콘솔" 연출 + 진입 흐름 글루
   - 부팅 로그 타이핑 / KST 시계 / 패널 flip(회원가입) / WATCH-ONLY(관전 모드 데모)
   - 기존 auth.js 핸들러(#login-form/#signup-form/#demo-login)는 그대로 재사용한다.
   ========================================================= */

BA.console = (function () {
  const $ = s => document.querySelector(s);
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BOOT_LINES = [
    '[OK] KBO FEED 연결... 10개 구장 온라인',
    '[OK] 레이더 스윕 가동',
    '[ * ] 오퍼레이터 인증 대기 ▋'
  ];

  function boot() {
    const screen = $('#auth-screen');
    const log = $('#boot-log');
    if (!screen) return;

    if (reduced || !log) {
      if (log) log.textContent = BOOT_LINES.join('\n');
      screen.classList.remove('booting');
      return;
    }
    // 부팅 로그를 한 줄씩 출력 후 마스트헤드 점등
    let i = 0;
    log.textContent = '';
    const t = setInterval(() => {
      log.textContent += (i ? '\n' : '') + BOOT_LINES[i];
      i++;
      if (i >= BOOT_LINES.length) {
        clearInterval(t);
        setTimeout(() => screen.classList.remove('booting'), 400);
      }
    }, 420);
  }

  function clock() {
    const a = $('#kst-clock'), b = $('#kst-clock2');
    const tick = () => {
      const now = new Date().toLocaleTimeString('ko-KR', { hour12: false });
      if (a) a.textContent = now;
      if (b) b.textContent = now;
    };
    tick();
    setInterval(tick, 1000);
  }

  function entryFlow() {
    const flip = $('#access-flip');
    const go = $('#go-register'), back = $('#back-login');
    if (go && flip) go.addEventListener('click', () => {
      flip.classList.add('flipped');
      const e = $('#login-error'); if (e) e.textContent = '';
    });
    if (back && flip) back.addEventListener('click', () => flip.classList.remove('flipped'));

    // WATCH-ONLY(관전 모드) = 데모 진입. 고스트 버튼 대신 물리 토글.
    const wo = $('#watch-only');
    const form = $('#login-form');
    if (wo && form) {
      const front = document.querySelector('.access-front');
      const btn = form.querySelector('.btn-connect');
      const inputs = form.querySelectorAll('input');
      wo.addEventListener('change', () => {
        const on = wo.checked;
        if (front) front.classList.toggle('watching', on);
        inputs.forEach(inp => { inp.disabled = on; });
        if (btn) {
          btn.type = on ? 'button' : 'submit';
          btn.innerHTML = on ? '▸ 관전 모드로 입장' : '▸ 콘솔 접속 <b>CONNECT</b>';
        }
      });
      // 관전 모드일 때 CONNECT 버튼은 제출 대신 데모 진입(기존 #demo-login 핸들러 재사용)
      if (btn) btn.addEventListener('click', e => {
        if (wo.checked) { e.preventDefault(); $('#demo-login').click(); }
      });
    }
  }

  function init() { boot(); clock(); entryFlow(); }

  return { init };
})();
