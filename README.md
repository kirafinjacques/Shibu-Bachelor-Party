# SA's Bachelor Party – Last Night of Freedom

An animated, mobile-first digital invitation. Plain HTML, CSS and JavaScript, with no build step.
It deploys to GitHub Pages automatically on every push to `main`.

## Experience

1. **Intro gate:** "WARNING! WARNING!" and "GROOM & BRIDE – ONE LAST BASH!", then **Enter the party** (with sound) or **Enter without sound**. No audio plays before this click.
2. **Couple reveal:** 3D gold "SA", a spotlight, sunglasses dropping in, a champagne glass, and funny status captions.
3. **Invitation card**, the **Bride vs Groom battle poll**, and **five quotes** revealed one by one.
4. **Bachelor Party Details:** animated calendar, clock and pin icons, an embedded map, an `.ics` download, Google Calendar, and Google Maps directions.
5. **Party rules:** tap each rule to "swear" by it. Swearing all five triggers confetti.
6. **Gallery:** tap a photo to open it in a lightbox.
7. **Freedom countdown:** live until 23.12.2026, 3PM IST, then it switches to "IT'S PARTY TIME!".
8. **Finale:** disco ball, light beams, a champagne pop, confetti, dancing silhouettes, and a WhatsApp RSVP.

Background music is `assets/music/sms_bar_bgm.mp3` (a ~29-second loop, about 0.5 MB). It only downloads and plays after the visitor taps **Enter the party**. The sound effects (cork pop, whoosh, clicks, countdown ticks) are generated in the browser with the Web Audio API. The **Music on/off** button in the header controls all sound.

## Customising

| What | Where |
| --- | --- |
| Date, time, venue, map link, WhatsApp RSVP number and message, music file | The `PARTY` object at the top of `script.js` |
| All visible text (names, quotes, rules, captions) | `index.html` |
| Gallery photos | Put files in `assets/photos/`, then edit `data-image` and `src` on each `.gallery-item` in `index.html` |
| Music | Replace `assets/music/sms_bar_bgm.mp3`, or point `PARTY.musicSource` at another MP3 in `assets/music/`. Set it to `""` for the built-in synthesized beat |

If you change the date, also update the date and time shown in `index.html`, including the "23.12.26" note in the countdown section.

After editing CSS or JS, increase the `?v=` number on `styles.css` and `script.js` in `index.html` so phones don't keep an old cached copy.

## Local preview

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying (GitHub Pages)

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` publishes the site to `https://<username>.github.io/Shibu-Bachelor-Party/`.
