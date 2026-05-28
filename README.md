# CDTM Application Website

Single-page static portfolio site for the CDTM application:

- `index.html` - Building viewport, animated What's next scroll cue, and CDTM module section.
- `cdtm.html` - Redirects to the CDTM section for old links.

Crop media by editing the inline `--x` and `--y` values on each card in `index.html`.
They map to CSS `object-position`, for example `--x: 58%; --y: 42%`.

Run locally:

```bash
npm run dev
```

Then open `http://localhost:3000`.
