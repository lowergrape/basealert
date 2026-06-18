/* =========================================================
   feed.js  (BaseAlert CONTROL)
   - 라이브 피드: 하단 마퀴 티커 + ALERT STACK + 레이더 구장 핑
   - 데이터 소스는 기존 BA.store.getLogs() (monitor.js가 빈자리 발견 시 기록)
     → 별도 이벤트 구독 없이, refreshAll 때마다 최신 로그를 반영한다.
   ========================================================= */

BA.feed = (function () {
  const U = BA.util;
  const esc = U.esc;
  const STADIUMS = [...new Set(BA.TEAMS.map(t => t.stadium))];

  let radarReady = false;
  let lastTopId = null;     // 마지막으로 본 최신 로그 id (신규 핑 판정)
  let lastSig = '';         // 마퀴/스택 재렌더 최소화용 시그니처

  // 구장별 레이더 좌표(고정)
  function blipXY(i) {
    const ang = (i / STADIUMS.length) * Math.PI * 2 - Math.PI / 2;
    const r = 60 + (i % 3) * 52;
    return { x: 200 + Math.cos(ang) * r, y: 200 + Math.sin(ang) * r };
  }

  // 레이더에 구장 점 생성(최초 1회)
  function initRadar() {
    const svg = document.getElementById('dash-radar');
    if (!svg || radarReady) return;
    STADIUMS.forEach((st, i) => {
      const { x, y } = blipXY(i);
      svg.insertAdjacentHTML('beforeend',
        `<circle class="rdr-blip" data-stadium="${esc(st)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"></circle>`);
      svg.insertAdjacentHTML('beforeend',
        `<text class="rdr-label" x="${x.toFixed(1)}" y="${(y - 9).toFixed(1)}" text-anchor="middle">${esc(st.split(' ')[0])}</text>`);
    });
    radarReady = true;
  }

  // 특정 구장 blip을 잠깐 점등(핑)
  function ping(stadium) {
    const svg = document.getElementById('dash-radar');
    if (!svg) return;
    const blip = svg.querySelector(`.rdr-blip[data-stadium="${CSS.escape(stadium)}"]`);
    if (!blip) return;
    blip.classList.add('hot');
    setTimeout(() => blip.classList.remove('hot'), 1600);
  }

  function timeHMS(iso) {
    try { return new Date(iso).toLocaleTimeString('ko-KR', { hour12: false }); }
    catch (e) { return ''; }
  }

  function render() {
    const logs = BA.store.getLogs();
    const top = logs[0];

    // 신규 로그면 해당 구장 레이더 핑
    if (top && top.id !== lastTopId) {
      if (lastTopId !== null && top.stadium) ping(top.stadium);
      lastTopId = top.id;
    }

    // 변화 없으면 마퀴/스택 재렌더 생략(애니메이션 끊김 방지)
    const sig = logs.length + ':' + (top ? top.id : '-');
    if (sig === lastSig) return;
    lastSig = sig;

    // 마퀴 티커 (최근 10건, 끊김 없는 루프 위해 2배 복제)
    const track = document.getElementById('lt-track');
    if (track) {
      if (!logs.length) {
        track.innerHTML = `<span class="lt-item">▶ 전 구장 감시 중 · 취소표(빈자리) 발생 시 즉시 송출합니다 ⚾</span>`.repeat(2);
      } else {
        const items = logs.slice(0, 10).map(l =>
          `<span class="lt-item">🟢 ${esc(l.stadium || '')} · ${esc(l.match)} · ${esc(l.section)} <b>+${Number(l.remaining)}</b></span>`
        ).join('');
        track.innerHTML = items + items;   // 2배 복제
      }
    }

    // ALERT STACK (최근 18건, 최신이 위)
    const stack = document.getElementById('alert-stack');
    if (stack) {
      if (!logs.length) {
        stack.innerHTML = `<div class="as-empty">송출된 알림 없음 · 감시 구역에 빈자리 발생 시 여기에 실시간 기록됩니다.</div>`;
      } else {
        stack.innerHTML = logs.slice(0, 18).map((l, i) =>
          `<div class="as-row ${i === 0 ? 'new' : ''}">
            <span class="as-time">${timeHMS(l.time)}</span>
            <span class="as-tag">[OPEN]</span>
            <span class="as-text">${esc(l.stadium || '')} · ${esc(l.match)} · ${esc(l.section)}</span>
            <b>+${Number(l.remaining)}</b>
          </div>`
        ).join('');
      }
    }
  }

  return { initRadar, render, ping };
})();
