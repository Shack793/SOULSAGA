/** Image specs shown to the admin in upload forms. Sliders crop with object-cover so any
 *  image fits, but these sizes give the best result on phones, tablets and desktops. */
export const IMAGE_SPECS = {
  slide: { w: 1600, h: 700, note: "Hero slider: 1600×700 px (landscape, ~16:7). Keep key content in the centre 60% – phones crop the sides. JPG/WebP, under 400 KB." },
  cover: { w: 600, h: 800, note: "Book/course cover: 600×800 px (3:4 portrait). JPG/WebP, under 250 KB." },
  article: { w: 1200, h: 630, note: "Article image: 1200×630 px (also used for social sharing). JPG/WebP, under 300 KB." },
  ad: { w: 728, h: 200, note: "Ad banner: 728×200 px (or 300×250 for sidebar). JPG/PNG/WebP, under 150 KB." },
} as const;
