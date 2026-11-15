const partyDate = new Date("2026-12-23T15:00:00+05:30");
const partyEndDate = new Date("2026-12-23T22:00:00+05:30");
const audio = document.querySelector("#partyMusic");
const soundToggle = document.querySelector("#soundToggle");
const soundLabel = soundToggle.querySelector(".sound-label");
const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");
const musicSource = ""; // Add a licensed audio file path here to enable background music.

if (musicSource) {
  audio.src = musicSource;
}

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
  });
});

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

soundToggle.addEventListener("click", async () => {
  if (!musicSource) {
    soundLabel.textContent = "Add music";
    soundToggle.setAttribute("aria-label", "Add a music file to enable sound");
    return;
  }

  if (audio.paused) {
    try {
      await audio.play();
      soundToggle.setAttribute("aria-pressed", "true");
      soundToggle.setAttribute("aria-label", "Turn music off");
      soundLabel.textContent = "Sound on";
    } catch (error) {
      console.error("Could not start party music:", error);
    }
  } else {
    audio.pause();
    soundToggle.setAttribute("aria-pressed", "false");
    soundToggle.setAttribute("aria-label", "Turn music on");
    soundLabel.textContent = "Sound off";
  }
});

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

const countdownFields = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};
const countdownMessage = document.querySelector("#countdownMessage");

function updateCountdown() {
  const remaining = partyDate.getTime() - Date.now();
  if (remaining <= 0) {
    Object.values(countdownFields).forEach((field) => (field.textContent = "00"));
    countdownMessage.textContent = "IT'S PARTY TIME!";
    return;
  }
  countdownFields.days.textContent = String(Math.floor(remaining / 86_400_000)).padStart(3, "0");
  countdownFields.hours.textContent = String(Math.floor((remaining / 3_600_000) % 24)).padStart(2, "0");
  countdownFields.minutes.textContent = String(Math.floor((remaining / 60_000) % 60)).padStart(2, "0");
  countdownFields.seconds.textContent = String(Math.floor((remaining / 1000) % 60)).padStart(2, "0");
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

const eventStart = partyDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const eventEnd = partyEndDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const calendarEvent = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//SA's Bachelor Party//Invitation//EN",
  "BEGIN:VEVENT",
  `DTSTART:${eventStart}`,
  `DTEND:${eventEnd}`,
  "SUMMARY:SA's Bachelor Party",
  "LOCATION:AVOKI RESORT\\, Kerala",
  "DESCRIPTION:A bachelor party celebration for the groom and bride. A million memories.",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");
document.querySelector("#calendarLink").href = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarEvent)}`;
document.querySelector("#calendarLink").download = "sa-bachelor-party.ics";

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
