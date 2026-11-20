# Updating and troubleshooting

## Updating

**From Home Assistant:** when a new release is out, Home Assistant offers the update. Install it and reload the page when asked.

**Manual install:** replace `/config/www/ha-moments.js` with the new file and bump the `?v=` number in the resource URL (**Settings → Dashboards → ⋮ → Resources**), so the apps fetch the new version.

Moments is pre-1.0, so a release can still change card options. The [release notes](https://github.com/westonfleming/ha-moments/releases) say what to update in your YAML.

## Custom element doesn't exist

The device still has the old frontend cached, or the resource isn't loaded.

- In a browser, do a hard refresh.
- In the Home Assistant app, use **Reset frontend cache** in the app's settings, then reopen the app.
- For a manual install, check the resource exists and its type is **JavaScript module**, and that `/local/ha-moments.js` opens in a browser.

## A card is missing something

Every option beyond the required ones is optional, and anything a device can't report is left out. If an area header has no temperature, check the sensor is assigned to that area in **Settings → Areas**, or set `temperature:` to the entity.

## Longer history

The charts and logs read Home Assistant's history, which keeps 10 days by default. For a 30-day outage log or longer run history, raise it in `configuration.yaml`:

```yaml
recorder:
  purge_keep_days: 90
```

## Uninstall

Remove the Moments cards from your dashboards, then remove Moments where you installed it. For a manual install, delete `/config/www/ha-moments.js` and its resource.

## Still stuck?

[Open an issue](https://github.com/westonfleming/ha-moments/issues) with your Home Assistant version, the card's YAML and what you expected to see.
