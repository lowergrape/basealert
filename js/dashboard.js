/* =========================================================
   dashboard.js  (BaseAlert CONTROL)
   - 관제 대시보드: LED 게이지 바 + (레이더/ALERT STACK은 feed.js가 담당)
   - 알림 기록(로그) 화면
   - 브라우저 알림 권한 배너 + 배지 갱신
   ========================================================= */

BA.dashboard = (function () {
  const $ = s => document.querySelector(s);
  const U = BA.util;
  const esc = U.esc;

  /* ---------- 관제 대시보드 ---------- */
  function renderDash() {
    const now = Date.now();
    const games = BA.store.getGames();
    const upcoming = games.filter(g => new Date(g.date).getTime() > now);
    const todayStr = U.localDay();
    const todayGames = games.filter(g => U.localDay(g.date) === todayStr).length;
    const activeAlerts = BA.store.getAlerts().filter(a => a.active);
    const logs = BA.store.getLogs();

    renderNotifBanner();

    // LED 게이지 바 (통계 카드 4개 대체 — 칸막이 하나의 패널)
    const gauges = [
      { n: activeAlerts.length, l: '감시중', c: 'lime' },
      { n: logs.length, l: '빈자리 발견', c: 'live' },
      { n: todayGames, l: '오늘 경기', c: 'neon' },
      { n: upcoming.length, l: '예정 경기', c: 'amber' }
    ];
    $('#led-gauges').innerHTML = gauges.map(g =>
      `<div class="led-gauge g-${g.c}"><b class="led-num">${String(g.n).padStart(2, '0')}</b><span>${g.l}</span></div>`
    ).join('');

    // 레이더 핑 + 마퀴 + ALERT STACK 갱신
    if (BA.feed) BA.feed.render();
  }

  /* ---------- 알림 기록(전체) ---------- */
  function renderLog() {
    const logs = BA.store.getLogs();
    const box = $('#full-log');
    if (!box) return;
    if (!logs.length) {
      box.innerHTML = `<div class="empty"><div class="em-ico">📭</div><p>송출된 알림이 없습니다.<br>감시 구역에 빈자리가 생기면 여기에 기록됩니다.</p></div>`;
      return;
    }
    box.innerHTML = logs.map(l => `
      <div class="log-item">
        <span class="log-ico">⚾</span>
        <div class="log-body">
          <div class="log-title">${esc(l.match)} · ${esc(l.section)}</div>
          <div class="log-sub">${l.gameDate ? U.fmtGame(l.gameDate) + ' · ' : ''}${esc(l.stadium || '')} · ${U.won(l.price)} (잔여 ${Number(l.remaining).toLocaleString('ko-KR')}석)</div>
        </div>
        <span class="log-time">${U.ago(l.time)}</span>
      </div>`).join('');
  }

  /* ---------- 브라우저 알림 권한 배너 ---------- */
  function renderNotifBanner() {
    const view = $('#view-dashboard');
    let banner = $('#notif-banner');
    const supported = 'Notification' in window;
    const need = supported && Notification.permission === 'default';

    if (!need) { if (banner) banner.remove(); return; }
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'notif-banner';
      banner.className = 'panel notif-banner';
      view.insertBefore(banner, view.firstChild);
    }
    banner.innerHTML = `<span>🔔 브라우저 알림을 켜면 다른 탭을 보고 있어도 빈자리 알림을 받을 수 있어요.</span>
      <button class="btn btn-primary btn-sm" id="enable-notif">알림 켜기</button>`;
    banner.querySelector('#enable-notif').addEventListener('click', () => {
      Notification.requestPermission().then(p => {
        if (p === 'granted') BA.toast('브라우저 알림을 켰어요 🔔', 'ok');
        renderNotifBanner();
      });
    });
  }

  /* ---------- 배지 갱신 ---------- */
  function updateBadges() {
    const unseen = BA.state.unseen || 0;
    const dot = $('#notify-dot');
    const badge = $('#log-badge');
    if (dot) dot.classList.toggle('hidden', unseen === 0);
    if (badge) {
      if (unseen > 0) { badge.textContent = unseen; badge.classList.remove('hidden'); }
      else badge.classList.add('hidden');
    }
  }

  return { renderDash, renderLog, updateBadges };
})();
