# Install

Add Moments to Home Assistant from its built-in store, or copy one file by hand. Either way, the dashboard resource points at a single file, `ha-moments.js`.

## From Home Assistant

1. Add `https://github.com/westonfleming/ha-moments` as a custom repository of type **Dashboard**, then find **Moments** and choose **Download**.
2. Reload the page when asked. The dashboard resource is added for you.

Only full releases show up by default. Pre-releases (betas) appear once you enable beta versions for Moments.

## Manual install

1. Download `ha-moments.js` from the [latest release](https://github.com/westonfleming/ha-moments/releases/latest).
2. Copy it to `/config/www/ha-moments.js` on your Home Assistant. The **File editor** or **Samba share** add-on both work. Create the `www` folder if it doesn't exist, then restart Home Assistant once so it serves the folder.
3. Go to **Settings → Dashboards → ⋮ → Resources → Add resource**. If you don't see Resources, turn on **Advanced mode** in your user profile first.
4. Enter the URL `/local/ha-moments.js?v={{version}}`, choose **JavaScript module**, and save.

To update a manual install, replace the file and bump the `?v=` number in the resource URL, so the apps fetch the new version.

## Check it works

Open any dashboard, choose **✎ Edit → Add card → Manual**, and paste:

```yaml demo
type: custom:moments-tile
entity: light.living_room_lamp     # use one of your own lights
tap_action: toggle
```

You should see the tile above, with your light's name and state. If the card says "Custom element doesn't exist", see [troubleshooting](troubleshooting.md#custom-element-doesnt-exist).

## Make it the default on each device

1. Open your Moments dashboard from the sidebar.
2. Open your profile (your user name at the bottom of the sidebar) and under **Dashboard**, choose it. This makes it the default on that device only, so set it on the iPad and the iPhone separately.
3. On a wall-mounted iPad, iOS **Guided Access** keeps the Home Assistant app on screen.

## Next

[Compose a dashboard](compose.md) with a Home view and an area view per area.
