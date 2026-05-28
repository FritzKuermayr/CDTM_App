# CDTM Application Website

Single-page static portfolio site for the CDTM application:

- `index.html` - Building viewport with one robot video, four building cards, delayed What's next overlay, and CDTM module section.
- `cdtm.html` - Redirects to the CDTM section for old links.

Crop media by editing the inline `--x` and `--y` values on each card in `index.html`.
They map to CSS `object-position`, for example `--x: 58%; --y: 42%`.
Media starts greyed out; hover or focus makes it color and plays any video in that card.

Run locally:

```bash
npm run dev
```

Then open `http://localhost:3000`.
