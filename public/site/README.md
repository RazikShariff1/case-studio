# Site photos (cosmetic, not products)

Save each file in this folder named exactly like the slot, any extension
(`.jpeg`, `.jpg`, `.png`, `.webp`; video `.mp4`). Then restart `npm run dev`
(it scans this folder on start) or run `npm run assets`. If two files share a name, the newest wins.
Missing required slots show a soft grey case silhouette, so nothing breaks.

General: no baked-in text, logos, watermarks or other brands' names.

| # | File name | Used for | Shape and size | What to download |
|---|---|---|---|---|
| 1 | hero-mobile | Phone home screen, top | Portrait, ~900x1100 | One case (or a pair), back view, on a WHITE / very light plain background |
| 2 | hero-desktop | Laptop home screen, top | Portrait 4:5, ~1200x1500 | Styled shot of cases (lifestyle ok) |
| 3 | banner-mobile | Phone "Bold Styles" banner | Landscape-ish, ~900x700 | One case on WHITE / very light plain background |
| 4 | banner-wide | Home "Browse Collections" banner | Wide 2:1, ~1600x800 | Several cases arranged, calm background |
| 5 | cat-minimal | Category tile | Square, ~600x600 | One minimal / frosted case on white |
| 6 | cat-trendy | Category tile | Square, ~600x600 | One printed trendy case on white |
| 7 | cat-luxury | Category tile | Square, ~600x600 | One leather / chrome case on white |
| 8 | cat-colorful | Category tile | Square, ~600x600 | One bright colourful case on white |
| 9 | showcase (.mp4) | "Frosted, magnetic" video block | Portrait 4:5 or 9:16, 5-10 s, under 3 MB | Slow, close case video, no audio needed |
| 10 | showcase-poster | Still shown before the video loads | Portrait 4:5, ~900x1125 | A frame from the video |

Optional, shown at the top of the shop page when a category is opened (no file = no banner):

| File name | Shape and size | What to download |
|---|---|---|
| collection-minimal | Wide ~16:7, ~1600x700 | Minimal cases, soft neutral scene |
| collection-trendy | same | Printed / trendy cases |
| collection-luxury | same | Leather / chrome cases |
| collection-colorful | same | Bright, colourful cases |
