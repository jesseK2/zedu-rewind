# Zedu Rewind

A whimsical marketing site for [Zedu](https://zedu.chat) — the learning platform that keeps bootcamps, schools and cohorts in one structured place instead of scattered chats.

The landing page walks a visitor from "everything lives in three apps" to a single considered product story, and the demo opens a Zedu chat dashboard where a **Rewind** control replays how a cohort's day actually unfolded.

## What's inside

| Path              | What it is                                                     |
| ----------------- | -------------------------------------------------------------- |
| `site/landing.html` | The marketing page: hero, product mechanisms, pricing, FAQ    |
| `site/index.html`   | The chat dashboard demo, including the Rewind interaction     |
| `site/styles.css`   | Marketing styles, including the subtle motion and theme work   |
| `site/chat.css` / `site/chat.js` | Dashboard layout and Rewind replay logic          |
| `site/assets/`      | Zedu wordmark and mark                                         |
| `dist/`             | The published copy (`cp -r site/* dist/`)                      |

No build step, no framework — plain HTML, CSS and JavaScript, so the whole page opens from a file.

## Run it locally

```sh
cd site
python -m http.server 8096
# http://localhost:8096/landing.html
```

## Live

| Surface | URL |
| --- | --- |
| Landing page | https://zedu-rewind-kec16q5gjt9.qoder.website/landing.html |
| Chat dashboard demo | https://zedu-rewind-kec16q5gjt9.qoder.website/ |

## Notes

- Light and dark both hold up; the dashboard respects `prefers-color-scheme`.
- The narrative is deliberately product-led: every section explains a mechanism (how a post gets filed, how a deadline is surfaced) rather than listing features.
