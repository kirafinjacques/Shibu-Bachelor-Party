const partyDate = new Date("2026-12-23T15:00:00+05:30");
const partyEndDate = new Date("2026-12-23T22:00:00+05:30");
const audio = document.querySelector("#partyMusic");
const soundToggle = document.querySelector("#soundToggle");
const soundLabel = soundToggle.querySelector(".sound-label");
const musicSource = ""; // Add a licensed audio file path here to enable background music.

if (musicSource) {
  audio.src = musicSource;
}

document.querySelector("#enterParty").addEventListener("click", async () => {
  document.body.classList.add("entered");
  document.body.classList.remove("locked");
  window.setTimeout(() => document.querySelector("#home").focus({ preventScroll: true }), 900);
  if (musicSource) {
    try {
      await audio.play();
      soundToggle.setAttribute("aria-pressed", "true");
      soundToggle.setAttribute("aria-label", "Turn music off");
      soundLabel.textContent = "Sound on";
    } catch (error) {
      console.error("Could not start party music:", error);
    }
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
