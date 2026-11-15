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

## RSVP & admin dashboard

Guests RSVP on the invitation itself (attending yes/no, Bride or Groom side, number of people, optional WhatsApp number). Responses are saved to a Google Sheet that you own. The private dashboard at `admin.html` shows counts and the guest list, and creates personal invites.

**Personal invites.** On `admin.html`, type a guest's name, pick their side, add their WhatsApp number (optional), and press **Create invite**. You get a link like `…/?to=Rahul&i=ab12cd34ef&s=Groom`. It greets the guest by name and prefills their RSVP. Send it with **Send on WhatsApp**, **Copy link** or **Share…**. If someone forwards the plain site link, their RSVP still appears, marked **Walk-in**.

### One-time Google setup (about 5 minutes)

1. Create a new Google Sheet in your own Google account.
2. Open **Extensions → Apps Script**. Delete the sample code and paste in the whole of [`apps-script/Code.gs`](apps-script/Code.gs). Save.
3. Choose `setup` in the function dropdown and press **Run**. Approve the permissions. This creates the `Invites` and `RSVPs` tabs.
4. Open **Project Settings** (the gear icon) → **Script Properties** → **Add property**. Set the name to `ADMIN_KEY` and the value to a passcode only you know. This is the dashboard password.
5. Choose **Deploy → New deployment**, then the gear icon → **Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Press **Deploy** and copy the **Web app URL** (it ends in `/exec`).
6. Paste that URL into [`rsvp-config.js`](rsvp-config.js) as `window.RSVP_API_URL = "https://script.google.com/macros/s/…/exec";`. Commit and push.
7. Open `https://kirafinjacques.github.io/Shibu-Bachelor-Party/admin.html` and enter your passcode.

If you change `Code.gs` later, go to **Deploy → Manage deployments → Edit**, choose **Version: New version** and deploy. The URL stays the same.

**Before setup:** until `RSVP_API_URL` is set, the form doesn't save anything. Guests still see a thank-you screen and can reply on WhatsApp.

**Privacy:** the passcode protects the dashboard, and the data stays in your Sheet. `admin.html` isn't linked from the invitation and asks search engines not to index it. Don't share the passcode.

## Local preview

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying (GitHub Pages)

1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` publishes the site to `https://<username>.github.io/Shibu-Bachelor-Party/`.
