/* =========================================================================
   EASY CUSTOMISATION — change these values; text lives in index.html.
   ========================================================================= */
const PARTY = {
  title: "SA's Bachelor Party",
  start: "2026-12-23T15:00:00+05:30", // 3PM IST
  end: "2026-12-23T22:00:00+05:30", // 10PM IST
  venue: "AVOKI RESORT, Kerala",
  venueAddress: "Avoki Hotels and Resorts, Kinfra Film And Video Park, Kazhakkoottam, Thiruvananthapuram, Kerala 695585",
  mapsUrl: "https://maps.app.goo.gl/52Z1EmgSsetAxCZb6?g_st=iw",
  // WhatsApp number that receives RSVPs, digits only with country code (e.g. "919876543210").
  // Leave empty to let each guest pick the chat to send to.
  whatsappNumber: "",
  rsvpMessage: "I'm in for SA's Bachelor Party on 23.12.2026 (3PM–10PM) at Avoki Resort! 🥂🕺 Count me in for the legendary night!",
  // Optional: path to your own MP3 (e.g. "assets/music/party.mp3"). Empty = built-in synthesized party beat.
  musicSource: "assets/music/bindaas.mp3",
};

const partyDate = new Date(PARTY.start);
const partyEndDate = new Date(PARTY.end);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------ Navigation ------------------------------ */
const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  document.querySelector(".site-header").classList.toggle("nav-open", !isExpanded);
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    document.querySelector(".site-header").classList.remove("nav-open");
    sound.whoosh();
  });
});

/* -------------------------------- Sound --------------------------------- */
// Everything is generated with the Web Audio API, so no audio files are needed.
// Nothing is created or played until the visitor presses a button in the intro.
const sound = (() => {
  const audioEl = document.querySelector("#partyMusic");
  let ctx = null;
  let master = null;
  let musicBus = null;
  let enabled = false;
  let musicOn = false;
  let noiseBuffer = null;
  let schedulerId = null;
  let nextNoteTime = 0;
  let step = 0;

  const BPM = 124;
  const stepDur = 60 / BPM / 4; // 16th notes
  // A minor party progression: Am – F – C – G (root frequencies for the bass)
  const bassRoots = [55, 43.65, 65.41, 49];
  const chords = [
    [220, 261.63, 329.63],
    [174.61, 220, 261.63],
    [196, 261.63, 329.63],
    [196, 246.94, 293.66],
  ];

  function init() {
    if (ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return true;
  }

  function noise(time, duration, { type = "highpass", freq = 7000, q = 0.7, gain = 0.2, endFreq, dest = master } = {}) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, time);
    if (endFreq) filter.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    src.connect(filter).connect(g).connect(dest);
    src.start(time);
    src.stop(time + duration + 0.02);
  }

  function tone(time, freq, duration, { type = "sine", gain = 0.2, endFreq, dest = master, attack = 0.005 } = {}) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + attack);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(g).connect(dest);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  function scheduleStep(s, t) {
    const bar = Math.floor(s / 16) % 4;
    const pos = s % 16;
    if (pos % 4 === 0) tone(t, 150, 0.32, { gain: 0.9, endFreq: 42, dest: musicBus }); // kick
    if (pos === 4 || pos === 12) noise(t, 0.16, { type: "bandpass", freq: 1500, q: 0.8, gain: 0.32, dest: musicBus }); // clap
    if (pos % 4 === 2) noise(t, 0.06, { freq: 8000, gain: 0.16, dest: musicBus }); // open-ish hat
    if (pos % 2 === 1) noise(t, 0.025, { freq: 10000, gain: 0.06, dest: musicBus }); // closed hat
    if (pos % 4 === 2) tone(t, bassRoots[bar] * (pos === 14 ? 2 : 1), stepDur * 1.8, { type: "sawtooth", gain: 0.11, dest: musicBus }); // offbeat bass
    if (pos === 0 || pos === 6 || pos === 10) {
      chords[bar].forEach((f) => tone(t, f * 2, 0.22, { type: "square", gain: 0.022, dest: musicBus }));
    }
  }

  function scheduler() {
    while (nextNoteTime < ctx.currentTime + 0.12) {
      scheduleStep(step, nextNoteTime);
      nextNoteTime += stepDur;
      step = (step + 1) % 64;
    }
  }

  function startMusic() {
    if (PARTY.musicSource) {
      if (!audioEl.getAttribute("src")) audioEl.src = PARTY.musicSource; // set once so toggling resumes, not restarts
      audioEl.volume = 0.7;
      audioEl.play().catch((error) => console.error("Could not start party music:", error));
    } else if (ctx) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setTargetAtTime(0.55, ctx.currentTime, 0.4);
      if (!schedulerId) {
        nextNoteTime = ctx.currentTime + 0.05;
        schedulerId = window.setInterval(scheduler, 25);
      }
    }
    musicOn = true;
  }

  function stopMusic() {
    if (PARTY.musicSource) {
      audioEl.pause();
    } else if (ctx) {
      musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      window.clearInterval(schedulerId);
      schedulerId = null;
    }
    musicOn = false;
  }

  const ready = () => enabled && ctx && ctx.state === "running";

  return {
    get enabled() {
      return enabled;
    },
    enable() {
      if (!init()) return;
      enabled = true;
      ctx.resume();
      startMusic();
    },
    disable() {
      enabled = false;
      stopMusic();
    },
    // Pause audio while the tab is hidden (saves battery on phones).
    suspend() {
      if (ctx) ctx.suspend();
      if (PARTY.musicSource && musicOn) audioEl.pause();
    },
    resume() {
      if (!enabled) return;
      if (ctx) ctx.resume();
      if (PARTY.musicSource && musicOn) audioEl.play().catch(() => {});
    },
    click() {
      if (!ready()) return;
      const t = ctx.currentTime;
      tone(t, 880, 0.08, { type: "triangle", gain: 0.14, endFreq: 1320 });
    },
    tick() {
      if (!ready()) return;
      const t = ctx.currentTime;
      tone(t, 2100, 0.035, { type: "square", gain: 0.03 });
    },
    whoosh() {
      if (!ready()) return;
      noise(ctx.currentTime, 0.55, { type: "bandpass", freq: 300, endFreq: 4500, q: 1.4, gain: 0.32 });
    },
    pop() {
      if (!ready()) return;
      const t = ctx.currentTime;
      tone(t, 520, 0.09, { gain: 0.5, endFreq: 140 }); // cork
      noise(t, 0.05, { type: "bandpass", freq: 1800, q: 1, gain: 0.6 });
      noise(t + 0.06, 1.1, { freq: 5000, gain: 0.12 }); // fizz
    },
    fanfare() {
      if (!ready()) return;
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(t + i * 0.09, f, 0.35, { type: "triangle", gain: 0.12 }));
    },
  };
})();

const soundToggle = document.querySelector("#soundToggle");
const soundLabel = soundToggle.querySelector(".sound-label");

function setSoundUI(on) {
  soundToggle.setAttribute("aria-pressed", String(on));
  soundToggle.setAttribute("aria-label", on ? "Turn music off" : "Turn music on");
  soundLabel.textContent = on ? "Music on" : "Music off";
  document.body.classList.toggle("sound-on", on);
}
setSoundUI(false);

soundToggle.addEventListener("click", () => {
  if (sound.enabled) {
    sound.disable();
    setSoundUI(false);
  } else {
    sound.enable();
    setSoundUI(true);
    sound.click();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) sound.suspend();
  else sound.resume();
});

// Small click sound on buttons and links (only when sound is on).
document.addEventListener("click", (event) => {
  if (event.target.closest(".button, .battle-vote-button, .gallery-item, .lightbox-close, .menu-toggle, .hero-cta")) sound.click();
});

/* ------------------------------- Confetti ------------------------------- */
const confetti = (() => {
  const canvas = document.querySelector("#confettiCanvas");
  const c = canvas.getContext("2d");
  const colours = ["#f8c64b", "#ffe193", "#a76bff", "#c3305a", "#fffaf1"];
  let pieces = [];
  let running = false;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function frame() {
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces = pieces.filter((p) => p.y < window.innerHeight + 30 && p.life > 0);
    pieces.forEach((p) => {
      p.vy += 0.16;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;
      p.life -= 1;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.globalAlpha = Math.min(1, p.life / 40);
      c.fillStyle = p.colour;
      c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      c.restore();
    });
    if (pieces.length) {
      window.requestAnimationFrame(frame);
    } else {
      running = false;
      c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  return function burst(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 110) {
    if (reduceMotion) return;
    resize();
    const amount = window.innerWidth < 600 ? Math.round(count * 0.7) : count;
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      pieces.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        size: 6 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.4,
        colour: colours[i % colours.length],
        life: 140 + Math.random() * 60,
      });
    }
    if (!running) {
      running = true;
      window.requestAnimationFrame(frame);
    }
  };
})();

/* ------------------------------ Intro gate ------------------------------ */
const gate = document.querySelector("#gate");
const gateParticles = document.querySelector("#gateParticles");
for (let i = 0; i < 22; i += 1) {
  const dot = document.createElement("span");
  dot.style.left = `${Math.random() * 100}%`;
  dot.style.animationDelay = `${-Math.random() * 9}s`;
  dot.style.animationDuration = `${7 + Math.random() * 6}s`;
  dot.style.setProperty("--size", `${2 + Math.random() * 4}px`);
  gateParticles.appendChild(dot);
}
document.body.classList.add("locked");
window.scrollTo(0, 0);

function enterParty(withSound) {
  if (document.body.classList.contains("entered")) return;
  if (withSound) {
    sound.enable();
    setSoundUI(true);
    sound.pop();
    window.setTimeout(() => sound.whoosh(), 120);
  }
  confetti(window.innerWidth / 2, window.innerHeight * 0.62, 140);
  document.body.classList.add("entered");
  document.body.classList.remove("locked");
  window.setTimeout(() => {
    gate.hidden = true;
  }, reduceMotion ? 0 : 1100);
  document.querySelector(".brand").focus({ preventScroll: true });
}
document.querySelector("#enterParty").addEventListener("click", () => enterParty(true));
document.querySelector("#enterQuiet").addEventListener("click", () => enterParty(false));

/* ----------------------------- Battle poll ------------------------------ */
const battlePoll = document.querySelector("#battlePoll");
const battlePollStatus = document.querySelector("#battlePollStatus");
const battlePollResult = document.querySelector("#battlePollResult");
const battleVoteButton = battlePoll.querySelector(".battle-vote-button");
const battleVoteStorageKey = "sa-battle-team-vote";
const battleVoteOptions = [...battlePoll.querySelectorAll('input[name="battle-team"]')];

function showBattleVote(team) {
  const option = battleVoteOptions.find((voteOption) => voteOption.value === team);
  if (!option) {
    return;
  }

  option.checked = true;
  battlePollResult.textContent = `Your pick: ${team}. Let the showdown begin!`;
  battlePollResult.hidden = false;
  battlePollStatus.textContent = "Vote saved on this device.";
  battleVoteButton.firstChild.textContent = "Update my pick ";
}

try {
  const savedBattleVote = localStorage.getItem(battleVoteStorageKey);
  if (savedBattleVote) {
    showBattleVote(savedBattleVote);
  }
} catch (error) {
  console.error("Could not load the saved battle poll vote:", error);
  battlePollStatus.textContent = "Your browser could not load a saved vote. You can still vote for this visit.";
}

battlePoll.addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedTeam = battleVoteOptions.find((option) => option.checked)?.value;
  if (!selectedTeam) {
    battlePollStatus.textContent = "Choose Bride Squad or Groom Squad before voting.";
    return;
  }

  try {
    localStorage.setItem(battleVoteStorageKey, selectedTeam);
    showBattleVote(selectedTeam);
  } catch (error) {
    console.error("Could not save the battle poll vote:", error);
    battlePollStatus.textContent = "Your browser could not save this vote. Your pick is still selected for this visit.";
    battlePollResult.textContent = `Your pick: ${selectedTeam}. Let the showdown begin!`;
    battlePollResult.hidden = false;
    battleVoteButton.firstChild.textContent = "Update my pick ";
  }
});

/* --------------------------- Scroll reveals ----------------------------- */
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.13 },
);
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

// Section-level hooks: groom reveal fanfare, finale champagne pop + confetti.
const moments = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || !document.body.classList.contains("entered")) return;
      const id = entry.target.id;
      if (id === "reveal" && !entry.target.dataset.done) {
        entry.target.dataset.done = "1";
        sound.fanfare();
      }
      if (id === "finale" && !entry.target.dataset.done) {
        entry.target.dataset.done = "1";
        entry.target.classList.add("is-popped");
        sound.pop();
        const rect = entry.target.querySelector(".finale-bottle").getBoundingClientRect();
        confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 160);
      }
    });
  },
  { threshold: 0.45 },
);
moments.observe(document.querySelector("#reveal"));
moments.observe(document.querySelector("#finale"));

/* ------------------------------ Party rules ----------------------------- */
const rules = [...document.querySelectorAll(".rule")];
const rulesOath = document.querySelector("#rulesOath");
function toggleRule(rule) {
  const agreed = rule.getAttribute("aria-pressed") !== "true";
  rule.setAttribute("aria-pressed", String(agreed));
  rule.classList.toggle("is-agreed", agreed);
  sound.click();
  const total = rules.filter((r) => r.classList.contains("is-agreed")).length;
  if (total === rules.length) {
    rulesOath.textContent = "Oath accepted. You are now officially party-certified! 🎉";
    sound.fanfare();
    const rect = rulesOath.getBoundingClientRect();
    confetti(window.innerWidth / 2, rect.top, 90);
  } else {
    rulesOath.textContent = total ? `${total} of ${rules.length} rules sworn. Keep going, legend.` : "";
  }
}
rules.forEach((rule) => {
  rule.addEventListener("click", () => toggleRule(rule));
  rule.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleRule(rule);
    }
  });
});

/* ------------------------------- Countdown ------------------------------ */
const countdownFields = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};
const countdownMessage = document.querySelector("#countdownMessage");
const countdownTitle = document.querySelector("#countdownTitle");
const countdownSection = document.querySelector(".countdown-section");
let countdownVisible = false;
let partyTimeShown = false;
new IntersectionObserver(([entry]) => {
  countdownVisible = entry.isIntersecting;
}).observe(countdownSection);

function updateCountdown() {
  const remaining = partyDate.getTime() - Date.now();
  if (remaining <= 0) {
    Object.values(countdownFields).forEach((field) => (field.textContent = "00"));
    countdownFields.days.textContent = "000";
    if (!partyTimeShown) {
      partyTimeShown = true;
      countdownSection.classList.add("is-party-time");
      countdownTitle.innerHTML = "IT'S<br /><span>PARTY TIME!</span>";
      countdownMessage.textContent = "IT'S PARTY TIME! 🎉 Get to Avoki Resort now!";
    }
    return;
  }
  countdownFields.days.textContent = String(Math.floor(remaining / 86_400_000)).padStart(3, "0");
  countdownFields.hours.textContent = String(Math.floor((remaining / 3_600_000) % 24)).padStart(2, "0");
  countdownFields.minutes.textContent = String(Math.floor((remaining / 60_000) % 60)).padStart(2, "0");
  countdownFields.seconds.textContent = String(Math.floor((remaining / 1000) % 60)).padStart(2, "0");
  if (countdownVisible) {
    sound.tick();
    if (!reduceMotion) {
      countdownFields.seconds.classList.remove("tick");
      void countdownFields.seconds.offsetWidth;
      countdownFields.seconds.classList.add("tick");
    }
  }
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

/* --------------------------- Calendar & links --------------------------- */
const toCalStamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const eventStart = toCalStamp(partyDate);
const eventEnd = toCalStamp(partyEndDate);
const eventDescription = `Good friends. Bad ideas. Unforgettable memories! Directions: ${PARTY.mapsUrl}`;
const calendarEvent = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//SA's Bachelor Party//Invitation//EN",
  "BEGIN:VEVENT",
  `UID:sa-bachelor-party-${eventStart}@invite`,
  `DTSTAMP:${toCalStamp(new Date())}`,
  `DTSTART:${eventStart}`,
  `DTEND:${eventEnd}`,
  `SUMMARY:${PARTY.title}`,
  `LOCATION:${PARTY.venueAddress.replace(/,/g, "\\,")}`,
  `DESCRIPTION:${eventDescription.replace(/,/g, "\\,")}`,
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
const calendarLink = document.querySelector("#calendarLink");
calendarLink.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarEvent)}`;
calendarLink.download = "sa-bachelor-party.ics";

const googleCalendarParams = new URLSearchParams({
  action: "TEMPLATE",
  text: PARTY.title,
  dates: `${eventStart}/${eventEnd}`,
  location: PARTY.venueAddress,
  details: eventDescription,
});
document.querySelector("#googleCalendarLink").href = `https://calendar.google.com/calendar/render?${googleCalendarParams}`;
document.querySelector("#mapsLink").href = PARTY.mapsUrl;

const rsvpButton = document.querySelector("#rsvpButton");
rsvpButton.href = PARTY.whatsappNumber
  ? `https://wa.me/${PARTY.whatsappNumber}?text=${encodeURIComponent(PARTY.rsvpMessage)}`
  : `https://api.whatsapp.com/send?text=${encodeURIComponent(PARTY.rsvpMessage)}`;
rsvpButton.addEventListener("click", () => {
  sound.pop();
  const rect = rsvpButton.getBoundingClientRect();
  confetti(rect.left + rect.width / 2, rect.top, 120);
});

/* -------------------------------- Lightbox ------------------------------ */
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxCaption = document.querySelector("#lightboxCaption");
document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    lightboxImage.src = item.dataset.image;
    lightboxImage.alt = item.querySelector("img").alt;
    lightboxCaption.textContent = item.dataset.caption;
    lightbox.showModal();
  });
});
document.querySelector("#lightboxClose").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
