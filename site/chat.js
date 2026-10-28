/* ============================================================
   Zedu chat — Rewind
   A channel that remembers where the room was, not just what
   was said. Drag the timeline; the room rewinds with you.
   ============================================================ */

(() => {
  "use strict";

  /* ---------------- time model ---------------- */

  const START = 540; // 09:00
  const NOW = 940; // 15:40 — where the room is
  const END = NOW;
  const SPAN = END - START;
  const LAST_READ = 581; // 09:41 — when you stepped out

  const hhmm = (m) => {
    const v = ((Math.round(m) % 1440) + 1440) % 1440;
    return String(Math.floor(v / 60)).padStart(2, "0") + ":" + String(v % 60).padStart(2, "0");
  };
  const pct = (m) => ((m - START) / SPAN) * 100;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"></use></svg>`;

  const span = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };
  const ago = (mins) =>
    mins < 1 ? "just now" : mins < 60 ? `${Math.round(mins)}m ago` : `${span(mins)} ago`;
  const ahead = (mins) => (mins < 1 ? "now" : mins < 60 ? `in ${Math.round(mins)}m` : `in ${span(mins)}`);

  /* ---------------- data ---------------- */

  const PEOPLE = {
    ada: { name: "Ada", initial: "A", cls: "av-a", role: "Lead" },
    toyo: { name: "Toyo", initial: "T", cls: "av-t", role: "Maintainer" },
    zainab: { name: "Zainab", initial: "Z", cls: "av-z" },
    chidi: { name: "Chidi", initial: "C", cls: "av-c" },
    priya: { name: "Priya", initial: "P", cls: "av-p" },
    milo: { name: "Milo", initial: "M", cls: "av-k" },
    ai: { name: "Zedu AI", initial: "", cls: "av-ai", ai: true },
    you: { name: "You", initial: "Y", cls: "av-you" },
  };

  const KINDS = {
    decision: { label: "Decision", tag: "Decision", icon: "i-check" },
    resource: { label: "Resource", tag: "Resource", icon: "i-file" },
    session: { label: "Session", tag: "Session", icon: "i-clock" },
    question: { label: "Open question", tag: "Question", icon: "i-help" },
  };

  const MESSAGES = [
    { id: "m1", at: 542, who: "ada", text: "Morning — can we lock the spacing scale before the design review?" },
    { id: "m2", at: 544, who: "toyo", text: "Yes. 4 / 8 / 16 / 24. No one-offs, no 12." },
    { id: "m3", at: 546, who: "milo", text: "12 was nice for dense rows though." },
    { id: "m4", at: 548, who: "ada", text: "Then bring it to the review — I don't want it decided in a thread.", reacts: [{ emoji: "👀", n: 4 }] },
    { id: "m5", at: 558, who: "priya", text: "Token sheet is updated with the four steps and the type ramp." },
    { id: "m6", at: 560, who: "priya", text: "Filed it in #resources so nobody hunts for it later." },
    { id: "m7", at: 605, who: "chidi", text: "Dark mode pass is done. Ship v1 or fold it into v2?" },
    { id: "m8", at: 607, who: "toyo", text: "v2. v1 ships light only — half a dark theme is worse than none.", reacts: [{ emoji: "💯", n: 9, mine: true }] },
    { id: "m9", at: 642, who: "zainab", text: "Illustrations for the empty states are in the review deck." },
    { id: "m10", at: 646, who: "priya", text: "Deck is 12 slides. Review order is in the speaker notes." },
    { id: "m11", at: 662, who: "milo", text: "Is the design review still Thursday?" },
    { id: "m12", at: 665, who: "toyo", text: "Thursday 16:00. Same room as last week." },
    { id: "m13", at: 667, who: "ada", text: "Invite is out — calendar says 16:00 Thursday." },
    { id: "m14", at: 800, who: "zainab", text: "Pushed the sidebar nav. It collapses to icons under 1100px." },
    { id: "m15", at: 804, who: "chidi", text: "Do we keep the sidebar on desktop and the bottom bar on mobile?" },
    { id: "m16", at: 806, who: "zainab", text: "One nav pattern: sidebar on desktop, bottom bar on mobile." },
    { id: "m17", at: 811, who: "ada", text: "Locked. Write it down before someone redraws it.", reacts: [{ emoji: "🔒", n: 7, mine: true }] },
    { id: "m18", at: 842, who: "priya", text: "Updated the deck. Nav pattern is slide 7." },
    { id: "m19", at: 902, who: "chidi", text: "Last one: card grid gap — 12 or 16?" },
    { id: "m20", at: 906, who: "milo", text: "Same question as the spacing scale, honestly." },
    { id: "m21", at: 912, who: "ada", text: "Let's decide async. Reply here by 18:00 and I'll call it." },
    { id: "m22", at: 920, who: "toyo", text: "Reply by 18:00, then I'll lock the grid." },
    {
      id: "m23",
      at: 936,
      who: "ai",
      text: "Two new records filed while you were out. One question still open — the card grid gap, due 18:00.",
    },
  ];

  const RECORDS = [
    { id: "k1", at: 552, kind: "decision", title: "Spacing scale: 4 / 8 / 16 / 24", src: ["m1", "m2"] },
    { id: "k2", at: 560, kind: "resource", title: "Token sheet — Figma file", src: ["m5", "m6"] },
    { id: "k3", at: 607, kind: "decision", title: "Dark mode ships in v2, not v1", src: ["m7", "m8"] },
    { id: "k4", at: 667, kind: "session", title: "Design review · Thursday 16:00", when: 960, src: ["m11", "m12", "m13"] },
    { id: "k5", at: 811, kind: "decision", title: "Nav: sidebar desktop, bottom bar mobile", src: ["m14", "m15", "m16", "m17"] },
    { id: "k6", at: 920, kind: "question", title: "Card grid gap: 12 or 16?", due: 1080, src: ["m19", "m20", "m21", "m22"] },
  ];

  const TAG = {};
  RECORDS.forEach((r) => {
    TAG[r.src[0]] = r.kind;
  });

  const filed = new Set(RECORDS.map((r) => r.id));

  /* ---------------- elements ---------------- */

  const $ = (id) => document.getElementById(id);

  const threadEl = $("thread");
  const threadWrap = $("threadWrap");
  const track = $("track");
  const dotsEl = $("dots");
  const handle = $("handle");
  const hint = $("hint");
  const rwBar = document.querySelector(".rw");
  const stateChip = $("stateChip");
  const stateText = $("stateText");
  const unreadBand = $("unreadBand");
  const meMark = $("meMark");
  const stateCard = $("stateCard");
  const memWhen = $("memWhen");
  const memChip = $("memChip");
  const keptList = $("keptList");
  const keptCount = $("keptCount");
  const keptPill = $("keptPill");
  const recapCount = $("recapCount");
  const awayLine = $("awayLine");
  const memCatch = $("memCatch");
  const catchBtn = $("catchBtn");
  const composer = $("composer");
  const say = $("say");
  const sendBtn = $("sendBtn");
  const side = $("side");
  const memory = $("memory");
  const backdrop = $("backdrop");
  const openSideBtn = $("openSide");
  const openMemoryBtn = $("openMemory");
  const progressBtn = $("progressBtn");
  const toastEl = $("toast");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const S = { t: NOW, scrub: false, playing: false, token: 0 };
  const dotEls = {};
  let dayEl;
  let newLineEl;
  let curtainEl;
  let msgEls = [];
  let lastKeptSig = "";
  let composerLocked = null;
  let traceTimer = 0;

  /* ---------------- thread ---------------- */

  function buildMessage(m, cont) {
    const p = PEOPLE[m.who] || PEOPLE.you;
    const isAI = !!p.ai;
    const li = document.createElement("li");
    li.className = "msg-wrap";
    li.dataset.id = m.id;
    li.dataset.at = m.at;

    const msg = document.createElement("div");
    msg.className =
      "msg" +
      (cont ? " is-cont" : "") +
      (isAI ? " msg-ai" : "") +
      (m.who === "you" ? " msg-you" : "");

    const av = document.createElement("span");
    av.className = "msg-av " + p.cls;
    av.setAttribute("aria-hidden", "true");
    if (isAI) av.innerHTML = icon("i-spark");
    else av.textContent = p.initial;

    const body = document.createElement("div");
    body.className = "msg-body";

    if (!cont) {
      const head = document.createElement("div");
      head.className = "msg-head";

      const name = document.createElement("span");
      name.className = "msg-name";
      name.textContent = p.name;
      head.append(name);

      if (p.role) {
        const role = document.createElement("span");
        role.className = "msg-role";
        role.textContent = p.role;
        head.append(role);
      }

      const time = document.createElement("time");
      time.className = "msg-time";
      time.textContent = m.at >= NOW ? "now" : hhmm(m.at);
      head.append(time);

      body.append(head);
    }

    const text = document.createElement("p");
    text.className = "msg-text";
    text.textContent = m.text;
    body.append(text);

    if (m.reacts) {
      const row = document.createElement("div");
      row.className = "msg-reacts";
      m.reacts.forEach((r) => {
        const chip = document.createElement("span");
        chip.className = "react" + (r.mine ? " is-mine" : "");
        chip.textContent = `${r.emoji} ${r.n}`;
        row.append(chip);
      });
      body.append(row);
    }

    msg.append(av, body);

    const kind = TAG[m.id];
    if (kind) {
      const tag = document.createElement("span");
      tag.className = "msg-tag";
      tag.dataset.kind = kind;
      tag.textContent = KINDS[kind].tag;
      msg.append(tag);
    }

    li.append(msg);
    return li;
  }

  function buildThread() {
    const frag = document.createDocumentFragment();

    dayEl = document.createElement("li");
    dayEl.className = "day-divider";
    dayEl.textContent = "Today · Tuesday 27 October";
    frag.append(dayEl);

    let prev = null;
    MESSAGES.forEach((m) => {
      const cont = !!prev && prev.who === m.who && m.at - prev.at <= 6;
      const el = buildMessage(m, cont);
      msgEls.push(el);
      frag.append(el);
      if (m.at === 560) {
        newLineEl = document.createElement("li");
        newLineEl.className = "new-line";
        newLineEl.innerHTML = `<span>New · ${MESSAGES.filter((x) => x.at > LAST_READ).length} messages since ${hhmm(LAST_READ)}</span>`;
        frag.append(newLineEl);
      }
      prev = m;
    });

    curtainEl = document.createElement("li");
    curtainEl.className = "curtain";
    curtainEl.hidden = true;
    curtainEl.innerHTML = `${icon("i-rewind")}<span class="curtain-text"></span><button type="button">Jump to now ${icon("i-arrow")}</button>`;
    curtainEl.querySelector("button").addEventListener("click", jumpToNow);
    frag.append(curtainEl);

    threadEl.append(frag);
  }

  /* ---------------- dial ---------------- */

  function buildDial() {
    RECORDS.forEach((r) => {
      const d = document.createElement("span");
      d.className = "rw-dot k-" + r.kind;
      d.dataset.id = r.id;
      d.style.left = pct(r.at).toFixed(3) + "%";
      dotsEl.append(d);
      dotEls[r.id] = d;
    });

    const a = pct(LAST_READ);
    const b = pct(NOW);
    unreadBand.style.left = a.toFixed(3) + "%";
    unreadBand.style.width = (b - a).toFixed(3) + "%";
    meMark.style.left = a.toFixed(3) + "%";
  }

  /* ---------------- chrome ---------------- */

  function updateChrome(t, live) {
    stateText.textContent = live ? "Live" : "Jump to now";
    stateChip.disabled = live;
    stateChip.setAttribute(
      "aria-label",
      live ? "Channel is live" : `You are rewound to ${hhmm(t)} — jump to now`
    );

    track.setAttribute("aria-valuenow", String(t));
    track.setAttribute(
      "aria-valuetext",
      live
        ? `Now, ${hhmm(t)} — ${MESSAGES.length} messages in view`
        : `${hhmm(t)} — ${MESSAGES.filter((m) => m.at <= t).length} of ${MESSAGES.length} messages in view`
    );

    const pill = handle.querySelector("b");
    pill.textContent = live ? "Now" : hhmm(t);
    const p = pct(t);
    handle.dataset.edge = p > 86 ? "r" : p < 14 ? "l" : "c";
    rwBar.classList.toggle("is-rewound", !live);
  }

  function updateComposer(t) {
    const live = t >= NOW;
    composer.classList.toggle("is-locked", !live);
    say.readOnly = !live;
    say.placeholder = live ? "Reply in #frontend-04…" : "Jump to now to reply";

    if (composerLocked === !live) return;
    composerLocked = !live;

    if (live) {
      sendBtn.innerHTML = icon("i-arrow");
      sendBtn.setAttribute("aria-label", "Send message");
    } else {
      sendBtn.innerHTML = "<span>Jump to now</span>";
      sendBtn.setAttribute("aria-label", "Jump to now");
    }
  }

  function rowHTML(r) {
    const kind = KINDS[r.kind];
    return `<div class="state-row${r.muted ? " is-muted" : ""}">
      <span class="k-ico k-${r.kind}">${icon(kind.icon)}</span>
      <div>
        <span class="state-label">${r.label}</span>
        <strong>${r.title}</strong>
        ${r.meta ? `<span class="state-meta">${r.meta}</span>` : ""}
      </div>
    </div>`;
  }

  function renderSide(t) {
    const live = t >= NOW;
    const kept = RECORDS.filter((r) => r.at <= t && filed.has(r.id));
    const aheadN = MESSAGES.filter((m) => m.at > t).length;

    memWhen.textContent = live
      ? "Where the room is · filed as it happens"
      : `Where the room was at ${hhmm(t)}`;
    memChip.classList.toggle("is-rewound", !live);
    memChip.innerHTML = `<i></i>${live ? "Live" : "Rewound"}`;
    recapCount.textContent = String(kept.length);

    const open = [...RECORDS].reverse().find((r) => r.kind === "question" && r.at <= t);
    const lastDecision = [...RECORDS].reverse().find((r) => r.kind === "decision" && r.at <= t);
    const nextSession = RECORDS.find(
      (r) => r.kind === "session" && r.at <= t && (r.when || r.at) >= t
    );

    const rows = [];

    rows.push(
      open
        ? {
            kind: "question",
            label: "Open question",
            title: open.title,
            meta: `asked ${ago(t - open.at)}${open.due ? ` · <em>due ${hhmm(open.due)}</em>` : ""}`,
          }
        : { kind: "question", label: "Open questions", title: "Nothing waiting on the room", muted: true }
    );

    rows.push(
      lastDecision
        ? {
            kind: "decision",
            label: "Last decision",
            title: lastDecision.title,
            meta: `${hhmm(lastDecision.at)} · from ${lastDecision.src.length} messages`,
          }
        : { kind: "decision", label: "Decisions", title: "Nothing decided yet", muted: true }
    );

    rows.push(
      nextSession
        ? {
            kind: "session",
            label: "Next session",
            title: nextSession.title,
            meta: `starts ${ahead((nextSession.when || nextSession.at) - t)}`,
          }
        : { kind: "session", label: "Next session", title: "Nothing on the books", muted: true }
    );

    const foot = live
      ? `${MESSAGES.filter((m) => m.at > LAST_READ).length} messages since you left · <b>${kept.length}</b> records kept`
      : `<b>${aheadN}</b> messages ahead · you're ${span(NOW - t)} back`;

    stateCard.innerHTML = `
      <div class="state-when">${icon("i-clock")}<b>${live ? "Where the room is" : "Where the room was"}</b><span>${hhmm(t)}</span></div>
      <div class="state-rows">${rows.map(rowHTML).join("")}</div>
      <div class="state-foot">${foot}</div>`;

    awayLine.innerHTML = live
      ? `You left at <b>${hhmm(LAST_READ)}</b> · ${MESSAGES.filter((m) => m.at > LAST_READ).length} messages filed into <b>${RECORDS.filter((r) => r.at > LAST_READ).length}</b> records.`
      : `You're <b>${span(NOW - t)}</b> back · <b>${aheadN}</b> messages ahead.`;

    renderKept(kept);
  }

  function renderKept(kept) {
    const sig = kept.map((r) => r.id).join(",");
    if (sig === lastKeptSig) return;
    const grew = kept.length > (lastKeptSig ? lastKeptSig.split(",").length : 0);
    lastKeptSig = sig;

    keptCount.textContent = String(kept.length);

    if (grew) {
      keptPill.classList.remove("is-pop");
      void keptPill.offsetWidth;
      keptPill.classList.add("is-pop");
    }

    if (!kept.length) {
      keptList.innerHTML = `<li class="kept-empty">Nothing kept yet at this point. The room hasn't decided anything.</li>`;
      return;
    }

    const focused = keptList.contains(document.activeElement)
      ? document.activeElement.closest(".kept-card")?.dataset.id
      : null;

    keptList.innerHTML = [...kept]
      .reverse()
      .map((r) => {
        const kind = KINDS[r.kind];
        const dots = r.src
          .slice(0, 3)
          .map((_, i) => `<i class="dot dot-${i + 1}"></i>`)
          .join("");
        const count = `${r.src.length} ${r.src.length === 1 ? "message" : "messages"}`;
        return `<li class="kept-card" data-kind="${r.kind}" data-id="${r.id}" data-at="${r.at}">
          <button class="kept-open" type="button" aria-label="Show the ${count} behind ${r.title}">
            <span class="kept-icon">${icon(kind.icon)}</span>
            <span class="kept-copy">
              <span class="kept-kind">${kind.label} · ${hhmm(r.at)}</span>
              <strong>${r.title}</strong>
              <span class="kept-src">${dots}from ${count}</span>
            </span>
          </button>
          <button class="kept-unfile" type="button" aria-label="Unfile ${r.title} — the messages stay in the thread">
            <svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg>
          </button>
        </li>`;
      })
      .join("");

    if (focused) {
      keptList.querySelector(`.kept-card[data-id="${focused}"] .kept-open`)?.focus({ preventScroll: true });
    }
  }

  /* ---------------- time ---------------- */

  function measureWrap(el) {
    if (!el || el.classList.contains("is-future")) return;
    const prev = el.style.maxHeight;
    el.style.maxHeight = "none";
    const h = el.offsetHeight;
    el.style.maxHeight = prev;
    el.style.setProperty("--h", h + "px");
  }

  function measureAll() {
    msgEls.forEach(measureWrap);
  }

  function remeasure() {
    const hidden = [];
    msgEls.forEach((el) => {
      if (el.classList.contains("is-future")) {
        hidden.push(el);
        el.classList.remove("is-future");
      }
    });

    threadEl.classList.add("is-scrubbing");
    measureAll();
    hidden.forEach((el) => el.classList.add("is-future"));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => threadEl.classList.remove("is-scrubbing"));
    });
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      remeasure();
      pinBottom();
    }, 180);
  });

  function pinBottom() {
    threadWrap.scrollTop = threadWrap.scrollHeight;
  }

  function setTime(value) {
    const t = clamp(Math.round(value), START, END);
    const live = t >= NOW;
    S.t = t;

    track.style.setProperty("--p", pct(t).toFixed(3) + "%");

    RECORDS.forEach((r) => dotEls[r.id].classList.toggle("is-low", r.at > t));

    let anchor = dayEl;
    msgEls.forEach((el) => {
      const future = +el.dataset.at > t;
      el.classList.toggle("is-future", future);
      if (!future) anchor = el;
    });

    const showNew = t >= LAST_READ;
    newLineEl.hidden = !showNew;
    if (showNew && (anchor === dayEl || +anchor.dataset.at < LAST_READ)) anchor = newLineEl;

    const futureCount = MESSAGES.filter((m) => m.at > t).length;
    if (live) {
      curtainEl.hidden = true;
    } else {
      curtainEl.hidden = false;
      curtainEl.querySelector(".curtain-text").innerHTML = futureCount
        ? `<b>${futureCount} ${futureCount === 1 ? "message" : "messages"}</b>, still in the future`
        : "Nothing else has been said yet";
      anchor.after(curtainEl);
    }

    updateChrome(t, live);
    renderSide(t);
    updateComposer(t);

    if (!S.playing) {
      const unread = MESSAGES.filter((m) => m.at > LAST_READ).length;
      setLabel(catchBtn, live ? "Catch me up" : "Play forward");
      setLabel(memCatch, live ? `Catch me up · ${unread} msgs` : "Play forward");
    }

    if (!S.scrub) pinBottom();
  }

  /* ---------------- trace ---------------- */

  function trace(id) {
    const rec = RECORDS.find((r) => r.id === id);
    if (!rec) return;
    threadEl.classList.add("is-tracing");
    msgEls.forEach((el) => el.classList.toggle("is-src", rec.src.includes(el.dataset.id)));
    keptList.querySelectorAll(".kept-card").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.id === id);
    });
  }

  function clearTrace() {
    threadEl.classList.remove("is-tracing");
    msgEls.forEach((el) => el.classList.remove("is-src"));
    keptList.querySelectorAll(".kept-card").forEach((card) => card.classList.remove("is-active"));
  }

  /* ---------------- playback ---------------- */

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function setLabel(btn, text) {
    const label = btn.querySelector("span");
    if (label) label.textContent = text;
    else if (btn.lastChild && btn.lastChild.nodeType === 3) btn.lastChild.nodeValue = text;
    else btn.append(document.createTextNode(text));
  }

  function setPlaying(on) {
    S.playing = on;
    catchBtn.classList.toggle("is-playing", on);
    memCatch.classList.toggle("is-playing", on);
    catchBtn.querySelector("use").setAttribute("href", on ? "#i-close" : "#i-play");
    memCatch.querySelector("use").setAttribute("href", on ? "#i-close" : "#i-play");
    setLabel(catchBtn, on ? "Stop" : "Catch me up");
    setLabel(memCatch, on ? "Stop" : S.t >= NOW ? `Catch me up · ${MESSAGES.filter((m) => m.at > LAST_READ).length} msgs` : "Play forward");
    catchBtn.setAttribute("aria-label", on ? "Stop playback" : "Catch me up from where you left off");
  }

  function stopPlayback() {
    S.token += 1;
    if (S.playing) setPlaying(false);
  }

  function tween(from, to, dur) {
    return new Promise((resolve) => {
      const token = S.token;
      const t0 = performance.now();
      const step = (now) => {
        if (token !== S.token) return resolve();
        const k = clamp((now - t0) / dur, 0, 1);
        const ease = 1 - Math.pow(1 - k, 3);
        setTime(from + (to - from) * ease);
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  function flashRecord(at) {
    const rec = RECORDS.find((r) => r.at === at);
    if (!rec) return;
    const card = keptList.querySelector(`.kept-card[data-id="${rec.id}"]`);
    const dot = dotEls[rec.id];
    card?.classList.add("is-active", "is-filed");
    if (dot) {
      dot.classList.remove("is-hit");
      void dot.offsetWidth;
      dot.classList.add("is-hit");
    }
    window.setTimeout(() => {
      card?.classList.remove("is-active", "is-filed");
      dot?.classList.remove("is-hit");
    }, 1250);
  }

  async function catchUp() {
    if (S.playing) {
      stopPlayback();
      return;
    }

    stopPlayback();
    const token = S.token;
    hideHint();
    clearTrace();

    if (S.t >= NOW) {
      setTime(LAST_READ);
      if (!reduceMotion.matches) await sleep(540);
      if (token !== S.token) return;
    }

    const from = S.t;
    setPlaying(true);

    const stops = RECORDS.filter((r) => r.at > from && r.at < NOW)
      .map((r) => r.at)
      .concat(NOW);

    for (let i = 0; i < stops.length; i += 1) {
      const to = stops[i];
      const startAt = S.t;

      if (reduceMotion.matches) {
        setTime(to);
        await sleep(220);
      } else {
        await tween(startAt, to, 420 + Math.min(1100, (to - startAt) * 5));
      }
      if (token !== S.token) return;

      if (to !== NOW) {
        flashRecord(to);
        await sleep(820);
        if (token !== S.token) return;
      }
    }

    setPlaying(false);

    toast(
      `Caught up · ${RECORDS.filter((r) => r.at > LAST_READ).length} records from ${MESSAGES.filter((m) => m.at > LAST_READ).length} messages. None lost.`,
      { label: "Rewind again", run: () => setTime(LAST_READ) }
    );
  }

  function jumpToNow() {
    stopPlayback();
    hideHint();
    clearTrace();
    setTime(NOW);
  }

  /* ---------------- toast ---------------- */

  let toastTimer = 0;

  function toast(html, action) {
    toastEl.hidden = false;
    toastEl.innerHTML = `${icon("i-check")}<span>${html}</span>`;

    if (action) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = action.label;
      btn.addEventListener("click", () => {
        hideToast();
        action.run();
      });
      toastEl.append(btn);
    }

    requestAnimationFrame(() => toastEl.classList.add("is-on"));
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 5200);
  }

  function hideToast() {
    toastEl.classList.remove("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      if (!toastEl.classList.contains("is-on")) toastEl.hidden = true;
    }, 260);
  }

  /* ---------------- hint ---------------- */

  let hintTimer = 0;

  function hideHint() {
    window.clearTimeout(hintTimer);
    hint.classList.add("is-gone");
  }

  /* ---------------- dial input ---------------- */

  function timeAt(clientX) {
    const rect = track.getBoundingClientRect();
    const k = clamp((clientX - rect.left) / rect.width, 0, 1);
    return START + k * SPAN;
  }

  function startScrub(e) {
    if (e.button !== undefined && e.button !== 0) return;
    stopPlayback();
    hideHint();
    clearTrace();
    S.scrub = true;
    threadEl.classList.add("is-scrubbing");
    try {
      track.setPointerCapture(e.pointerId);
    } catch (_) {
      /* synthetic pointers have no capture target */
    }
    setTime(timeAt(e.clientX));
    e.preventDefault();
  }

  function endScrub() {
    if (!S.scrub) return;
    S.scrub = false;
    threadEl.classList.remove("is-scrubbing");

    let t = S.t;
    if (Math.abs(t - NOW) <= 4) {
      t = NOW;
    } else {
      let best = null;
      RECORDS.forEach((r) => {
        if (!best || Math.abs(r.at - t) < Math.abs(best.at - t)) best = r;
      });
      if (best && Math.abs(best.at - t) <= 5) t = best.at;
    }

    setTime(t);
  }

  track.addEventListener("pointerdown", startScrub);
  track.addEventListener("pointermove", (e) => {
    if (S.scrub) setTime(timeAt(e.clientX));
  });
  track.addEventListener("pointerup", endScrub);
  track.addEventListener("pointercancel", endScrub);
  track.addEventListener("lostpointercapture", endScrub);

  track.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 15 : 5;
    let t = S.t;

    if (e.key === "ArrowLeft" || e.key === "ArrowDown") t -= step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") t += step;
    else if (e.key === "Home") t = START;
    else if (e.key === "End") t = NOW;
    else if (e.key === "PageUp") t += 30;
    else if (e.key === "PageDown") t -= 30;
    else return;

    e.preventDefault();
    stopPlayback();
    hideHint();
    setTime(t);
  });

  /* ---------------- kept records ---------------- */

  keptList.addEventListener("mouseover", (e) => {
    const card = e.target.closest(".kept-card");
    if (card) trace(card.dataset.id);
  });

  keptList.addEventListener("mouseleave", () => {
    if (!keptList.contains(document.activeElement)) clearTrace();
  });

  keptList.addEventListener("focusin", (e) => {
    const card = e.target.closest(".kept-card");
    if (card && e.target.closest(".kept-open")) trace(card.dataset.id);
  });

  keptList.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!keptList.contains(document.activeElement)) clearTrace();
    }, 0);
  });

  function unfile(id) {
    const rec = RECORDS.find((r) => r.id === id);
    if (!rec || !filed.has(id)) return;

    filed.delete(id);
    clearTrace();
    lastKeptSig = "";
    renderSide(S.t);

    toast(`Unfiled “${rec.title}” · the messages stay in the thread.`, {
      label: "Undo",
      run: () => {
        filed.add(id);
        lastKeptSig = "";
        renderSide(S.t);
      },
    });
  }

  keptList.addEventListener("click", (e) => {
    const un = e.target.closest(".kept-unfile");
    if (un) {
      const card = un.closest(".kept-card");
      if (card) unfile(card.dataset.id);
      return;
    }

    const open = e.target.closest(".kept-open");
    if (!open) return;

    const card = open.closest(".kept-card");
    const rec = card && RECORDS.find((r) => r.id === card.dataset.id);
    if (!rec) return;

    stopPlayback();
    hideHint();
    setTime(rec.at);
    trace(rec.id);

    const first = msgEls.find((el) => el.dataset.id === rec.src[0]);
    if (first) {
      first.scrollIntoView({
        block: "center",
        behavior: reduceMotion.matches ? "auto" : "smooth",
      });
    }

    window.clearTimeout(traceTimer);
    traceTimer = window.setTimeout(clearTrace, 2600);
  });

  /* ---------------- composer ---------------- */

  stateChip.addEventListener("click", () => {
    if (S.t < NOW) jumpToNow();
  });

  catchBtn.addEventListener("click", catchUp);
  memCatch.addEventListener("click", catchUp);

  sendBtn.addEventListener("click", () => {
    if (S.t < NOW) {
      jumpToNow();
      say.focus();
      return;
    }
    send();
  });

  composer.addEventListener("click", (e) => {
    if (S.t >= NOW) return;
    if (e.target.closest(".comp-add, .comp-emoji, .send")) return;
    jumpToNow();
    say.focus();
  });

  say.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    if (S.t < NOW) {
      e.preventDefault();
      jumpToNow();
      say.focus();
      return;
    }

    e.preventDefault();
    send();
  });

  function send() {
    const text = say.value.trim();
    if (!text) {
      say.focus();
      return;
    }

    const prev = MESSAGES[MESSAGES.length - 1];
    const m = { id: "you-" + Date.now(), at: NOW, who: "you", text };
    const cont = !!prev && prev.who === "you" && NOW - prev.at <= 6;
    const el = buildMessage(m, cont);
    el.classList.add("is-sent");

    MESSAGES.push(m);
    msgEls.push(el);
    threadEl.insertBefore(el, curtainEl);
    measureWrap(el);

    say.value = "";
    pinBottom();
    window.setTimeout(() => el.classList.remove("is-sent"), 600);
  }

  document.querySelectorAll(".chip[data-say]").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (S.t < NOW) jumpToNow();
      say.value = chip.dataset.say;
      say.focus();
      say.setSelectionRange(say.value.length, say.value.length);
    });
  });

  progressBtn.addEventListener("click", () => {
    toast("Week 3 checkpoint · 14 of 24 in. Nudge sent to the 10 quiet learners.");
  });

  /* ---------------- drawers ---------------- */

  let drawer = null;

  function setDrawer(next) {
    drawer = next;
    side.classList.toggle("is-open", next === "side");
    memory.classList.toggle("is-open", next === "memory");
    openSideBtn.setAttribute("aria-expanded", String(next === "side"));
    openMemoryBtn.setAttribute("aria-expanded", String(next === "memory"));

    if (next) {
      backdrop.hidden = false;
      requestAnimationFrame(() => backdrop.classList.add("is-on"));
      const target = next === "side" ? side : memory;
      (target.querySelector("a, button"))?.focus({ preventScroll: true });
    } else {
      backdrop.classList.remove("is-on");
      window.setTimeout(() => {
        if (!drawer) backdrop.hidden = true;
      }, 240);
    }
  }

  openSideBtn.addEventListener("click", () => setDrawer(drawer === "side" ? null : "side"));
  openMemoryBtn.addEventListener("click", () => setDrawer(drawer === "memory" ? null : "memory"));
  backdrop.addEventListener("click", () => setDrawer(null));

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (drawer) {
      setDrawer(null);
      return;
    }
    if (S.playing) stopPlayback();
  });

  /* ---------------- boot ---------------- */

  buildDial();
  buildThread();
  setTime(NOW);
  measureAll();
  pinBottom();

  requestAnimationFrame(() => {
    measureAll();
    pinBottom();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      measureAll();
      pinBottom();
    });
  }

  hintTimer = window.setTimeout(hideHint, 8000);
})();
