# catarinalouriceira.github.io

Catarina Louriceira's portfolio. A static site served by GitHub Pages from the root of `main`: no build step, no dependencies.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All copy and structure |
| `assets/css/style.css` | Design tokens (colours, fonts) at the top, then one block per section |
| `assets/js/main.js` | Shade and AM/PM switches, tabs, the work viewer, clocks |
| `assets/Catarina-Louriceira-CV.pdf` | The file behind every "Download CV" button |
| `assets/og.png` | Preview image shown when the link is shared (1200×630) |

## Preview locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. `?shade=roma|figo|pessego|matcha` and `?theme=am|pm` force a look.

## Common edits

**Change copy.** Edit `index.html`. Each section has an id (`#about`, `#work`, `#voice`, `#routine`, `#resume`, `#contact`).

**Replace the CV.** Overwrite `assets/Catarina-Louriceira-CV.pdf`, keeping the file name.

**Add a piece of work.** Two steps:

1. In `assets/js/main.js`, add an entry to `PIECES`. Use `ig('reel' | 'p', code)` for an Instagram link (the code is the part after `/reel/` or `/p/`) and `li(urn, slug)` for a LinkedIn post (the URN comes from the post's "Embed this post" option).
2. In `index.html`, add an `<a class="cover" data-piece="your-key">` inside the right `.covers` group. Its `href` is the original post, so the card still works without JavaScript.

**Change a colour.** The four shades are `--c-roma`, `--c-figo`, `--c-pessego` and `--c-matcha` at the top of `style.css`, once for AM and once for PM.
