# Audio (music tracks)

Put your music MP3s here, then wire each one up in
[`_data/passions.yml`](../../_data/passions.yml) under the **music** entry's
`sections:` list.

For a track to play inline on the Passions → Music panel, set its `file:` to the
path of the MP3 in this folder, for example:

```yaml
sections:
  - name: "Pop"
    tracks:
      - title: "Sunset Drive"
        file: /assets/audio/pop-sunset-drive.mp3
```

- Leave `file:` blank (`""`) to show an upload placeholder instead of a player.
- You can list more than one track per section.
- Suggested naming: lowercase, hyphenated, prefixed by style — e.g.
  `pop-*.mp3`, `edm-*.mp3`, `rap-*.mp3`.
- MP3 is the safest format for cross-browser playback; keep files reasonably
  sized (these load on demand — the players use `preload="none"`).
