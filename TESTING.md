# Deploy and test

How to put a test build of Moments on your Home Assistant and check it on the iPhone and iPad companion apps. Plan on about 30 minutes for the first time through.

## Before you start

- Intents exist as scenes or scripts in Home Assistant (#5).
- The **File editor** add-on is installed: **Settings → Add-ons → Add-on store → File editor → Install → Start**. Turn on **Show in sidebar**.
- Your user has **Advanced mode** on (click your name at the bottom of the sidebar, then **Advanced mode**). It's needed to see dashboard Resources.

## 1. Get a build

Pick one.

**From GitHub (no tools needed).** Every push and pull request builds `ha-moments.js`.
1. Open the repo's **Actions** tab and click the latest green **Build** run for the branch you want to test (`main`, or a PR's branch).
2. Under **Artifacts**, download **ha-moments**. It's a zip; unzip it to get `ha-moments.js`.

**From HACS (simplest).** Moments is installed through HACS, so a new release shows as an update there. Download it, then reload. Skip step 2 below; HACS handles the file and the resource.

**From a pre-release.** Publish a GitHub release with **Set as a pre-release** ticked and a tag such as `v0.1.0-beta.1`. The release workflow attaches `ha-moments.js` to it within a couple of minutes. HACS ignores pre-releases unless beta versions are enabled for Moments, so either enable them in HACS or install the file by hand (step 2).

**From source.** `npm install && npm run build` gives `dist/ha-moments.js`.

## 2. Deploy it to Home Assistant

1. Open **File editor** from the sidebar. Click the folder icon, go to `/homeassistant/` (shown as `/config` in older versions), and create a `www` folder if it isn't there.
2. Open `www`, click the upload icon, and upload `ha-moments.js`.
3. **First time only:** restart Home Assistant (**Settings → ⋮ → Restart Home Assistant**) so it starts serving `www` as `/local/`. Then go to **Settings → Dashboards → ⋮ → Resources → Add resource**, enter `/local/ha-moments.js?v=1`, choose **JavaScript module**, and save.
4. **Every later build:** upload over the old file, then edit the resource and bump the number (`?v=2`, `?v=3`, …). This is what makes the apps fetch the new file.
5. If you haven't yet, create the dashboard as in the README (**2. Create the dashboard**), using your intents from #5.

**Check the right build loaded:** open Home Assistant in a desktop browser, open the developer console, and look for the orange `MOMENTS 0.1.0` banner.

## 3. Load it on each device

In the companion app on the iPhone, then the iPad:

1. **Settings → Companion App → Debugging → Reset frontend cache**, then close and reopen the app. Do this after every new build.
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

Do every check on **iPhone**, **iPad portrait** and **iPad landscape**, in both light and dark mode (the iOS setting is enough; the app follows it).

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
| 9 | Rooms tab | Every area with devices is there, and nothing hidden or diagnostic shows |
| 10 | Layout | iPhone shows one column; iPad shows two; nothing sits under the status bar or Dynamic Island |
| 11 | Touch | Every button is easy to hit with a thumb; no accidental taps while scrolling |
| 12 | Dark mode | All text is readable, including on highlighted (amber) buttons |
| 13 | iPad room | Signed in as the iPad user, "This room" shows; on your own phone it doesn't (once #8 is done) |
| 14 | Update | After a new build, bump `?v=`, reset the frontend cache, and the console banner or a visible change confirms the new build |

## 6. Report results

Comment on #15 with the device, orientation and theme, and either "all pass" or the failing check numbers. Add screenshots for anything that looks wrong (side button + volume up). Each failure becomes its own issue.

## Undo

To go back to your old dashboard, pick it under **Dashboard** in your profile on each device. Deleting the Moments resource and dashboard removes it completely.
