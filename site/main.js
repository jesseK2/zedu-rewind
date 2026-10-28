(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header elevation
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  const toggle = document.querySelector(".nav-toggle");

  // Nav dropdowns
  const dropdowns = [...document.querySelectorAll("[data-dropdown]")];
  const hoverCapable = window.matchMedia("(hover: hover) and (min-width: 901px)");
  const desktopWidth = window.matchMedia("(min-width: 901px)");

  const setDropdown = (item, open) => {
    item.classList.toggle("is-open", open);
    item.querySelector(".nav-trigger").setAttribute("aria-expanded", String(open));
  };

  const closeDropdowns = (except) => {
    dropdowns.forEach((item) => {
      if (item === except) return;
      item.dataset.pinned = "false";
      setDropdown(item, false);
    });
  };

  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    closeDropdowns();
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (!open) closeDropdowns();
  });

  dropdowns.forEach((item) => {
    const trigger = item.querySelector(".nav-trigger");
    const isOpen = () => item.classList.contains("is-open");

    trigger.addEventListener("click", () => {
      if (isOpen() && item.dataset.pinned === "true") {
        item.dataset.pinned = "false";
        setDropdown(item, false);
        return;
      }
      closeDropdowns(item);
      item.dataset.pinned = "true";
      setDropdown(item, true);
    });

    item.addEventListener("pointerenter", () => {
      if (!hoverCapable.matches) return;
      closeDropdowns(item);
      setDropdown(item, true);
    });

    item.addEventListener("pointerleave", () => {
      if (!hoverCapable.matches || item.dataset.pinned === "true") return;
      setDropdown(item, false);
    });

    item.addEventListener("focusin", () => {
      if (!desktopWidth.matches) return;
      closeDropdowns(item);
      setDropdown(item, true);
    });

    item.addEventListener("focusout", (event) => {
      if (!desktopWidth.matches || item.contains(event.relatedTarget)) return;
      if (item.dataset.pinned === "true") return;
      setDropdown(item, false);
    });

    item.querySelectorAll(".nav-menu a").forEach((link) =>
      link.addEventListener("click", closeMenu)
    );
  });

  document.addEventListener("pointerdown", (event) => {
    dropdowns.forEach((item) => {
      if (item.contains(event.target)) return;
      item.dataset.pinned = "false";
      setDropdown(item, false);
    });
  });

  desktopWidth.addEventListener("change", (event) => {
    if (event.matches) return;
    closeDropdowns();
  });

  nav
    .querySelectorAll(".nav-links > a")
    .forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeMenu();
  });

  // Scroll reveal
  const reveals = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !reduceMotion) {
    reveals.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
      const index = siblings.indexOf(el);
      el.style.setProperty("--d", `${Math.min(index, 4) * 70}ms`);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // Count-up stats
  const counters = [...document.querySelectorAll("[data-count]")];
  const format = (value) => Math.round(value).toLocaleString("en-US");

  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = format(target) + suffix;
      return;
    }
    const start = performance.now();
    const duration = 1300;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          counterIO.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterIO.observe(el));
  }

  // Hand-drawn swoosh
  const swoosh = document.querySelector(".swoosh path");
  const swooshHost = document.querySelector("h1.reveal");

  if (swoosh && swooshHost && !reduceMotion) {
    const length = swoosh.getTotalLength();
    swoosh.style.strokeDasharray = `${length}`;
    swoosh.style.strokeDashoffset = `${length}`;
    swoosh.style.transition = "stroke-dashoffset 1.05s cubic-bezier(0.5, 0.05, 0.3, 1) 0.4s";

    const drawSwoosh = () => {
      swoosh.style.strokeDashoffset = "0";
    };

    if (swooshHost.classList.contains("in")) {
      requestAnimationFrame(drawSwoosh);
    } else {
      const watch = new MutationObserver(() => {
        if (!swooshHost.classList.contains("in")) return;
        watch.disconnect();
        drawSwoosh();
      });
      watch.observe(swooshHost, { attributes: true, attributeFilter: ["class"] });
    }
  }

  // Kept — the hero thread files itself
  const app = document.querySelector(".app");

  if (app) {
    const thread = app.querySelector(".thread");
    const keptList = app.querySelector(".kept-list");
    const keptCount = app.querySelector(".kept-count");
    const keptCountNum = app.querySelector(".kept-count b");
    const recapCount = app.querySelector(".recap-count");
    const keptEmpty = app.querySelector(".kept-empty");
    const footText = app.querySelector(".kept-foot-text");
    const undoBtn = app.querySelector(".kept-undo");
    const live = app.querySelector(".kept-live");
    const readText = app.querySelector(".read-text");
    const typing = app.querySelector(".typing");
    const composer = app.querySelector(".composer");
    const input = app.querySelector(".composer-input");
    const chips = [...app.querySelectorAll(".chip")];
    const checkpoint = app.querySelector(".progress-card");
    const appMain = app.querySelector(".app-main");
    const traceNet = app.querySelector(".trace-net");
    const tracePath = app.querySelector(".trace-path");
    const traceTail = app.querySelector(".trace-tail");
    const traceDots = [...app.querySelectorAll(".trace-dot")];

    const KINDS = {
      decision: {
        label: "Decision",
        icon: "i-check",
        reply: "Kept as a decision — pinned to Week 3.",
      },
      session: {
        label: "Session",
        icon: "i-video",
        reply: "Added it to Week 3. It’s on the calendar.",
      },
      resource: {
        label: "Resource",
        icon: "i-file",
        reply: "Indexed it in resources. The thread stays clean.",
      },
      note: {
        label: "Note",
        icon: "i-chat",
        reply: "Saved it for today’s recap — nothing lost.",
      },
    };

    let touched = false;
    let hold = false;
    let pinned = null;
    let undoState = null;
    let uid = 0;
    let tourTimer = 0;
    let tourIndex = -1;
    let tourAllowed = false;
    let tourReady = false;
    let inView = false;
    let netFrame = 0;

    const cards = () => [...keptList.querySelectorAll(".kept-card")];

    const el = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    };

    const setRead = (text) => {
      readText.textContent = text;
    };

    const popCount = () => {
      keptCount.classList.remove("is-pop");
      void keptCount.offsetWidth;
      keptCount.classList.add("is-pop");
    };

    const updateCount = () => {
      const total = cards().length;
      keptCountNum.textContent = String(total);
      if (recapCount) recapCount.textContent = String(total);
      keptEmpty.hidden = total > 0;
    };

    const titleOf = (text) => {
      const clean = text.replace(/\s+/g, " ").replace(/[.!?]+$/, "").trim();
      return clean.length > 52 ? `${clean.slice(0, 49).trim()}…` : clean;
    };

    const replyFor = (kind, text) => {
      if (kind !== "session") return KINDS[kind].reply;
      const when = text.match(
        /\b(?:mon|tues|wednes|thurs|fri|satur|sun)day\b(?:\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s?(?:am|pm)?)?|\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i
      );
      return when ? `Added ${when[0]} to Week 3. It’s on the calendar.` : KINDS.session.reply;
    };

    const classify = (text) => {
      const value = text.toLowerCase();
      if (
        /\b(mon|tues|wednes|thurs|fri|satur|sun)day\b|\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b|\b(tomorrow|tonight|next week|retro|review|class|session|meeting|demo|sync|workshop)\b/.test(
          value
        )
      ) {
        return "session";
      }
      if (
        /\b(file|files|sheet|link|doc|docs|slides?|pdf|repo|figma|upload(?:ed)?|resources?|notes?)\b/.test(
          value
        )
      ) {
        return "resource";
      }
      if (
        /\b(lock|locked|decide|decided|decision|agree|agreed|final|approved?|we'll|we will|keep|standard|scale|no one-offs?|confirm(?:ed)?|ship)\b/.test(
          value
        )
      ) {
        return "decision";
      }
      return "note";
    };

    const addMsg = ({ name, initial, tone, ai, you, time, text, kind, id }) => {
      const item = el("li", `msg${ai ? " msg-ai" : you ? " msg-you" : ""} is-new`);
      if (id) item.dataset.src = id;

      const avatar = el("span", `msg-av ${ai ? "msg-av-ai" : you ? "msg-av-you" : tone}`);
      avatar.setAttribute("aria-hidden", "true");
      if (ai) {
        avatar.innerHTML = '<svg class="icon"><use href="#i-spark"></use></svg>';
      } else {
        avatar.textContent = initial;
      }

      const body = el("div", "msg-body");
      const meta = el("p", "msg-meta");
      meta.append(el("b", null, name), el("i", null, time));
      body.append(meta, el("p", "msg-bubble", text));

      item.append(avatar, body);
      if (kind) item.append(el("span", "msg-tag", KINDS[kind].label));
      thread.append(item);

      if (thread.scrollHeight > thread.clientHeight) thread.scrollTop = thread.scrollHeight;
      window.setTimeout(() => item.classList.remove("is-new"), 620);
      return item;
    };

    const addCard = ({ kind, title, sources, count }) => {
      const card = el("li", "kept-card is-fresh");
      card.dataset.kind = kind;
      card.dataset.src = sources.join(" ");

      const open = el("button", "kept-open");
      open.type = "button";
      open.setAttribute("aria-pressed", "false");
      open.setAttribute(
        "aria-label",
        `Show the ${count} message${count === 1 ? "" : "s"} behind: ${title}`
      );

      const icon = el("span", "kept-icon");
      icon.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#${KINDS[kind].icon}"></use></svg>`;

      const copy = el("span", "kept-copy");
      copy.append(el("span", "kept-kind", KINDS[kind].label), el("strong", null, title));

      const src = el("span", "kept-src");
      for (let i = 0; i < Math.min(count, 3); i += 1) src.append(el("i", `dot dot-${i + 1}`));
      src.append(document.createTextNode(`from ${count} message${count === 1 ? "" : "s"}`));
      copy.append(src);

      open.append(icon, copy);

      const unfile = el("button", "kept-unfile");
      unfile.type = "button";
      unfile.title = "Unfile";
      unfile.setAttribute("aria-label", `Unfile “${title}” — the messages stay in the thread`);
      unfile.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg>';

      card.append(open, unfile);
      keptList.prepend(card);
      updateCount();
      popCount();
      tourIndex = -1;
      return card;
    };

    const drawNet = (card, sources) => {
      if (!traceNet || window.innerWidth <= 1080 || !sources.length) {
        tracePath.setAttribute("d", "");
        traceTail.setAttribute("d", "");
        traceDots.forEach((dot) => dot.setAttribute("r", "0"));
        return;
      }

      const net = traceNet.getBoundingClientRect();
      const main = appMain.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      traceNet.setAttribute(
        "viewBox",
        `0 0 ${Math.round(net.width)} ${Math.round(net.height)}`
      );

      const spine = main.right - net.left - 10;
      const arm = main.right - net.left - 26;
      const ys = sources.map((msg) => {
        const box = msg.getBoundingClientRect();
        return box.top + box.height / 2 - net.top;
      });
      const top = Math.min(...ys);
      const bottom = Math.max(...ys);
      const tailY = cardBox.top - net.top + Math.min(26, cardBox.height / 2);
      const bend = 6;

      tracePath.setAttribute(
        "d",
        `M ${arm} ${top} H ${spine - bend} Q ${spine} ${top} ${spine} ${top + bend} V ${
          bottom - bend
        } Q ${spine} ${bottom} ${spine - bend} ${bottom} H ${arm}`
      );
      traceTail.setAttribute("d", `M ${spine} ${tailY} H ${cardBox.left - net.left - 4}`);

      traceDots.forEach((dot, index) => {
        dot.setAttribute("cx", arm);
        dot.setAttribute("cy", index === 0 ? top : bottom);
        dot.setAttribute("r", "2.3");
      });
    };

    const clearTrace = () => {
      app.classList.remove("is-tracing", "is-touring");
      thread.classList.remove("is-tracing");
      cards().forEach((card) => {
        card.classList.remove("is-active", "is-dim");
      });
      thread.querySelectorAll(".msg").forEach((msg) => msg.classList.remove("is-src"));
      tracePath.setAttribute("d", "");
      traceTail.setAttribute("d", "");
      traceDots.forEach((dot) => dot.setAttribute("r", "0"));
      if (!typing.classList.contains("is-on")) setRead("Zedu AI is keeping up");
    };

    const paintTrace = (card, touring) => {
      if (!card || !card.isConnected) {
        clearTrace();
        return;
      }
      const ids = (card.dataset.src || "").trim().split(/\s+/).filter(Boolean);
      app.classList.add("is-tracing");
      app.classList.toggle("is-touring", Boolean(touring));
      thread.classList.add("is-tracing");

      const sources = [];
      thread.querySelectorAll(".msg").forEach((msg) => {
        const on = Boolean(msg.dataset.src) && ids.includes(msg.dataset.src);
        msg.classList.toggle("is-src", on);
        if (on) sources.push(msg);
      });
      cards().forEach((item) => {
        item.classList.toggle("is-active", item === card);
        item.classList.toggle("is-dim", item !== card);
      });
      setRead(`Reading ${ids.length} message${ids.length === 1 ? "" : "s"}`);
      drawNet(card, sources);
    };

    const cardForMessage = (id) =>
      cards().find((card) => (card.dataset.src || "").split(/\s+/).includes(id));

    const stopTour = () => {
      window.clearTimeout(tourTimer);
      tourTimer = 0;
    };

    const tourStep = () => {
      if (reduceMotion || touched || hold || pinned || !tourAllowed) return;
      const items = cards();
      if (!items.length) return;
      tourIndex = (tourIndex + 1) % items.length;
      paintTrace(items[tourIndex], true);
      tourTimer = window.setTimeout(() => {
        if (touched || hold || pinned) return;
        clearTrace();
        tourTimer = window.setTimeout(tourStep, 1500);
      }, 3000);
    };

    const startTour = () => {
      stopTour();
      if (reduceMotion || touched || hold || pinned || !tourAllowed || !tourReady) return;
      tourTimer = window.setTimeout(tourStep, 1600);
    };

    const userTrace = (card) => {
      stopTour();
      hold = true;
      paintTrace(card, false);
    };

    const endUserTrace = () => {
      hold = false;
      if (pinned) return;
      clearTrace();
      startTour();
    };

    const revealSources = (ids) => {
      ids.forEach((id) => {
        const msg = thread.querySelector(`.msg[data-src="${id}"]`);
        if (!msg) return;
        msg.classList.add("is-flash");
        window.setTimeout(() => msg.classList.remove("is-flash"), 1500);
      });
    };

    const unfileCard = (card) => {
      if (!card) return;
      const next = card.nextElementSibling;
      const title = card.querySelector("strong").textContent;
      const ids = (card.dataset.src || "").split(/\s+/).filter(Boolean);

      if (pinned === card) {
        pinned = null;
        clearTrace();
      }
      card.remove();
      undoState = { card, next };
      updateCount();
      footText.textContent = "Record unfiled · messages untouched";
      undoBtn.hidden = false;
      touched = true;
      hold = false;
      stopTour();
      revealSources(ids);
      live.textContent = `Unfiled “${title}”. The messages stay in the thread.`;
    };

    if (undoBtn) {
      undoBtn.addEventListener("click", () => {
        if (!undoState) return;
        const { card, next } = undoState;
        keptList.insertBefore(card, next && next.isConnected ? next : null);
        undoState = null;
        undoBtn.hidden = true;
        footText.textContent = "Nothing lost · messages stay in the thread";
        updateCount();
        popCount();
        tourIndex = -1;
        live.textContent = "Record restored.";
      });
    }

    keptList.addEventListener("pointerover", (event) => {
      const card = event.target.closest(".kept-card");
      if (!card || pinned || card.contains(event.relatedTarget)) return;
      userTrace(card);
    });

    keptList.addEventListener("pointerout", (event) => {
      const card = event.target.closest(".kept-card");
      if (!card || pinned || card.contains(event.relatedTarget)) return;
      endUserTrace();
    });

    keptList.addEventListener("focusin", (event) => {
      const open = event.target.closest(".kept-open");
      if (!open || pinned) return;
      userTrace(open.closest(".kept-card"));
    });

    keptList.addEventListener("focusout", (event) => {
      const card = event.target.closest(".kept-card");
      if (!card || pinned) return;
      window.setTimeout(() => {
        if (!card.contains(document.activeElement)) endUserTrace();
      }, 0);
    });

    keptList.addEventListener("click", (event) => {
      const unfile = event.target.closest(".kept-unfile");
      if (unfile) {
        unfileCard(unfile.closest(".kept-card"));
        return;
      }
      const open = event.target.closest(".kept-open");
      if (!open) return;
      const card = open.closest(".kept-card");
      const next = pinned === card ? null : card;
      pinned = next;
      hold = false;
      stopTour();
      keptList.querySelectorAll(".kept-open").forEach((btn) => {
        btn.setAttribute(
          "aria-pressed",
          String(Boolean(pinned) && btn.closest(".kept-card") === pinned)
        );
      });
      if (pinned) {
        paintTrace(pinned, false);
        const first = thread.querySelector(".msg.is-src");
        if (first && thread.scrollHeight > thread.clientHeight) {
          const box = thread.getBoundingClientRect();
          const target = first.getBoundingClientRect();
          const delta = target.top - box.top;
          if (delta < 0 || delta > box.height - target.height) {
            thread.scrollTop += delta - 12;
          }
        }
      } else {
        clearTrace();
        startTour();
      }
    });

    thread.addEventListener("pointerover", (event) => {
      const msg = event.target.closest(".msg");
      if (!msg || pinned || msg.contains(event.relatedTarget)) return;
      const id = msg.dataset.src;
      if (!id) return;
      const card = cardForMessage(id);
      if (!card) return;
      userTrace(card);
    });

    thread.addEventListener("pointerout", (event) => {
      const msg = event.target.closest(".msg");
      if (!msg || pinned || msg.contains(event.relatedTarget)) return;
      endUserTrace();
    });

    thread.addEventListener("scroll", () => {
      const active = keptList.querySelector(".kept-card.is-active");
      if (!active) return;
      window.cancelAnimationFrame(netFrame);
      netFrame = window.requestAnimationFrame(() =>
        drawNet(active, [...thread.querySelectorAll(".msg.is-src")])
      );
    }, { passive: true });

    window.addEventListener("resize", () => {
      const active = keptList.querySelector(".kept-card.is-active");
      if (!active) return;
      window.cancelAnimationFrame(netFrame);
      netFrame = window.requestAnimationFrame(() =>
        drawNet(active, [...thread.querySelectorAll(".msg.is-src")])
      );
    });

    const send = (raw) => {
      const text = String(raw || "").replace(/\s+/g, " ").trim();
      if (!text) {
        input.focus();
        return;
      }

      touched = true;
      hold = false;
      stopTour();
      if (pinned) {
        pinned = null;
        keptList.querySelectorAll(".kept-open").forEach((btn) => btn.setAttribute("aria-pressed", "false"));
      }
      clearTrace();

      const kind = classify(text);
      uid += 1;
      const id = `u${uid}`;
      addMsg({ name: "You", initial: "Y", you: true, time: "now", text, kind, id });
      input.value = "";
      typing.classList.add("is-on");
      setRead("Zedu AI is filing");

      window.setTimeout(() => {
        typing.classList.remove("is-on");
        addMsg({ name: "Zedu AI", ai: true, time: "now", text: replyFor(kind, text) });
        addCard({ kind, title: titleOf(text), sources: [id], count: 1 });
        setRead("Zedu AI is keeping up");
        live.textContent = `Kept a ${KINDS[kind].label.toLowerCase()}: ${titleOf(text)}.`;
      }, reduceMotion ? 0 : 900);
    };

    composer.addEventListener("submit", (event) => {
      event.preventDefault();
      send(input.value);
    });

    chips.forEach((chip) => {
      chip.addEventListener("click", () => send(chip.dataset.say || chip.textContent));
    });

    if (checkpoint) {
      checkpoint.addEventListener("click", () => {
        if (checkpoint.disabled) return;
        checkpoint.disabled = true;
        checkpoint.classList.add("is-on");
        checkpoint.querySelector(".hint-text").textContent = "Sent";
        checkpoint.querySelector(".progress-sub").textContent =
          "Nudges sent to the 10 quiet learners";
        checkpoint.setAttribute(
          "aria-label",
          "Week 3 checkpoint — nudges sent to the 10 quiet learners"
        );
        touched = true;
        hold = false;
        stopTour();
        addMsg({
          name: "Zedu AI",
          ai: true,
          time: "now",
          text: "Nudged the 10 quiet learners. Replies will land here.",
        });
        setRead("Zedu AI is nudging");
        live.textContent = "Nudges sent to 10 quiet learners.";
        window.setTimeout(() => setRead("Zedu AI is keeping up"), 2000);
      });
    }

    // Live beat: the last two messages arrive, the session record files itself.
    const armBeat = () => {
      const beat = [...app.querySelectorAll('[data-beat="live"]')];
      if (reduceMotion || !beat.length) {
        tourReady = true;
        return;
      }
      beat.forEach((node) => node.classList.add("is-arming"));
      keptCountNum.textContent = String(Math.max(0, cards().length - 1));
      if (recapCount) recapCount.textContent = String(Math.max(0, cards().length - 1));

      const reveal = () => {
        beat.forEach((node) => node.classList.remove("is-arming"));
        updateCount();
        popCount();
        if (!app.classList.contains("is-tracing")) setRead("Zedu AI is keeping up");
        if (thread.scrollHeight > thread.clientHeight + 4) thread.scrollTop = thread.scrollHeight;
        tourReady = true;
        startTour();
      };

      let fired = false;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (fired || !entry.isIntersecting) return;
          fired = true;
          io.disconnect();
          window.setTimeout(() => {
            if (touched) {
              reveal();
              return;
            }
            typing.classList.add("is-on");
            setRead("Zedu AI is filing");
            window.setTimeout(() => {
              typing.classList.remove("is-on");
              reveal();
            }, 1200);
          }, 650);
        },
        { threshold: 0.3 }
      );
      io.observe(app);
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          tourAllowed = inView && !document.hidden;
          if (tourAllowed) startTour();
          else stopTour();
        },
        { threshold: 0.18 }
      );
      io.observe(app);
      document.addEventListener("visibilitychange", () => {
        tourAllowed = inView && !document.hidden;
        if (tourAllowed) startTour();
        else stopTour();
      });
    }

    updateCount();
    armBeat();
  }
})();
