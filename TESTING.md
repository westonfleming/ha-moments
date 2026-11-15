# Deploy and test

How to put a test build of Moments on your Home Assistant and check it on the devices you use, such as a phone, a tablet and a desktop browser. Plan on about 30 minutes for the first time through.

## Before you start

- Intents exist as scenes or scripts in Home Assistant (#5).
- The **File editor** add-on is installed: **Settings → Add-ons → Add-on store → File editor → Install → Start**. Turn on **Show in sidebar**.
- Your user has **Advanced mode** on (click your name at the bottom of the sidebar, then **Advanced mode**). It's needed to see dashboard Resources.

## 1. Get a build

### Test a pull request (no release needed)

Every push to a pull request publishes a **pre-release** with `ha-moments.js` attached, tagged with the next patch version plus the PR and build number, for example `v0.3.1-pr32.7`. Each push replaces the PR's previous pre-release, and all of them are deleted when the PR is merged or closed. The PR's **Checks → PR pre-release** run summary links the one it made.

On Home Assistant, using your normal Moments install:

1. **First time only:** open Moments where you installed it from, ⋮ → **Redownload**, and turn on **Show beta versions**. Leave it on while you're testing.
2. ⋮ → **Update information**, so it sees the newest pre-release straight away instead of at its next scheduled check.
3. ⋮ → **Redownload**, pick the `-pr` version you want (newest is at the top), **Download**, and reload when asked.
4. Check the console banner says the same version, e.g. `MOMENTS 0.3.1-pr32.7`, then reset the frontend cache on each device (step 3 below).

For a newer push to the same PR, repeat steps 2–4.

**Going back to the stable build:** ⋮ → **Redownload**, pick the latest version without `-pr`, and turn **Show beta versions** off. Do this once the PR is merged too, because its pre-release is deleted and the stable release that includes it may come later.

Your dashboards don't change. Only the code behind the `custom:moments-*` cards does, and a redownload of the stable version puts it back.

### Other ways

**From GitHub Actions.** Every push and pull request also builds `ha-moments.js` as a downloadable artifact.
1. Open the repo's **Actions** tab and click the latest green **Build** run for the branch you want to test.
2. Under **Artifacts**, download **ha-moments**. It's a zip; unzip it to get `ha-moments.js`, and deploy it by hand (step 2).

**From a release.** A full release shows as an update in the marketplace. Download it, then reload. Skip step 2 below; the marketplace handles the file and the resource.

**From source.** `npm install && npm run build` gives `dist/ha-moments.js`.

## 2. Deploy it to Home Assistant (manual builds only)

Skip this if you installed through the marketplace, including PR pre-releases.


1. Open **File editor** from the sidebar. Click the folder icon, go to `/homeassistant/` (shown as `/config` in older versions), and create a `www` folder if it isn't there.
2. Open `www`, click the upload icon, and upload `ha-moments.js`.
3. **First time only:** restart Home Assistant (**Settings → ⋮ → Restart Home Assistant**) so it starts serving `www` as `/local/`. Then go to **Settings → Dashboards → ⋮ → Resources → Add resource**, enter `/local/ha-moments.js?v=1`, choose **JavaScript module**, and save.
4. **Every later build:** upload over the old file, then edit the resource and bump the number (`?v=2`, `?v=3`, …). This is what makes the apps fetch the new file.
5. If you haven't yet, compose a dashboard as in the README (**2. Compose a dashboard**), starting from `examples/home.yaml`.

**Check the right build loaded:** open Home Assistant in a desktop browser, open the developer console, and look for the orange `MOMENTS 0.3.0` banner.

## 3. Load it on each device

On each device:

1. Clear the cached frontend after every new build: a hard refresh in a browser, or **Reset frontend cache** in the Home Assistant app's settings (then close and reopen the app).
2. Open the Moments dashboard from the sidebar. To make it the default on that device, open your profile and pick it under **Dashboard**.

## 4. Set up test conditions

You don't need to open doors or drain batteries. **Developer tools → States** lets you set an entity's state temporarily (until the device next reports in):

| To test | Do this |
| --- | --- |
| Open-door chip | Pick a door `binary_sensor`, set state to `on`, **Set state** |
| Low-battery chip | Pick a battery `sensor`, set state to `5`, **Set state** |
| Time of day | Change `input_select.time_of_day` from its entity card, or wait for the clock |
| Media tile | Play something on a media player |
| On now | Turn on two or three lights and open a cover |

## 5. Run the checks

Do every check on a **phone**, a **tablet** in portrait and landscape, and a **desktop browser**, in both light and dark mode (the system setting is enough; the app follows it).

| # | Check | Pass when |
| --- | --- | --- |
| 1 | Dashboard loads | No red "Custom element doesn't exist" cards |
| 2 | Greeting | Matches the time of day, and changes within a minute of changing the helper |
| 3 | Chips | Open-door and low-battery chips appear; tapping one opens its details; they vanish when the state is set back |
| 4 | Intents | Each button runs its scene or script; the one for the current time of day is first |
| 5 | Active intent | A running script, or the last scene, is highlighted (scenes once #10 is done) |
| 6 | On now | Lists exactly what's on; the toggle turns each off; **All lights off** turns off only lights |
| 7 | Quiet house | With everything off, On now says "All quiet" and no chip row shows |
| 8 | Media | The media tile appears only while playing |
| 9 | Home and area views | Each floor lists its areas with the right photo, presence and temperature; tapping an area opens its view, whose sections follow the standard order |
| 10 | Layout | A phone shows one column; a tablet shows two or more; nothing sits under the status bar or a camera cut-out |
| 11 | Touch | Every button is easy to hit with a thumb; no accidental taps while scrolling |
| 12 | Dark mode | All text is readable, including on highlighted (amber) buttons |
| 13 | Tablet area | With `areas_by_user`, signed in as the tablet's user, the header and intents lead with that area; on your own phone they don't |
| 14 | Update | After a new build, bump `?v=`, reset the frontend cache, and the console banner or a visible change confirms the new build |

## 6. Report results

Comment on #15 with the device, orientation and theme, and either "all pass" or the failing check numbers. Add screenshots for anything that looks wrong (side button + volume up). Each failure becomes its own issue.

## Undo

To go back to your old dashboard, pick it under **Dashboard** in your profile on each device. Deleting the Moments resource and dashboard removes it completely.
