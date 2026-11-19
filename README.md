# ntell.ai

The company site for ntell, an AI transformation company working across
financial services, government, FMCG and consumer, and M&A and value creation.

A static, scroll-driven single page. No framework and no build step: serve the
folder with any web server and it runs.

## Run locally

```bash
python3 -m http.server 4173
```

Then open http://127.0.0.1:4173/. It must be served over HTTP, not opened as a
file, so that the fonts and the logo animation load.

## Structure

```
index.html              All content and markup
css/fonts.css           Self-hosted font faces
css/style.css           Design tokens and every section's styles
js/main.js              Motion layer (see below)
js/satellites.js        The orb's satellites: four 3D models and their orbit (WebGL)
assets/brand/           Signal-orb logo kit (SVG) and favicons
assets/video/           Opening logo sting (MP4 and WebM)
assets/img/             AVA character cut-outs and the share image
assets/fonts/           Newsreader, Stack Sans Headline, Stack Sans Text, JetBrains Mono
assets/vendor/          GSAP 3.13 (core, ScrollTrigger, SplitText), Lenis 1.3 and three.js r180
```

`nersa-hub/` is a separate piece of work: a front-end prototype of a regulatory
data hub and market surveillance platform, with its own README. It is not
linked from the site and carries `noindex`.

## Page outline

1. Hero: "We build AI-native enterprises", with the signal orb in its field
   and four satellites in orbit round it, one per industry. Turning the orb
   brings the next satellite to the front, and the headline and text follow it
2. Who we are: one partner for AI transformation, mission and values
3. What we do: advise, build, equip, embed
4. What is changing, then what is missing and what it takes
5. How we work: bespoke deployment, strategic partnership, change management
6. How we engage: five stages
7. Industries, one chapter each, with the capabilities and what we bring to
   them (a tag with a filled dot names an ntell product, one with a hollow dot
   is bespoke work):
   - Financial services (payments, core banking, fraud, risk,
     modelling, decisioning, reporting, data sharing, AI governance), with the
     Portfolio 360°, Model Studio and Arbiter gallery inside it, shown as some
     of our deployments
   - Government services
   - FMCG and consumer
   - M&A and value creation
   - AI transformation
8. How we deliver, and where we operate
9. Who builds it, and contact

## Design language

An off-white page with an editorial serif (Newsreader) for statements and
Stack Sans for everything you read and use. The palette comes from the logo:
ink, crimson and a deep maroon for the dark panels. Product screens in the
gallery keep their own colours. Tokens live at the top of `css/style.css`.

## Motion

Everything is progressive. With reduced motion requested the page is complete
and static. With JavaScript off it is readable from top to bottom with a solid
nav; the two scenes that only exist as script (the organisation chart and the
adoption dots) are left out.

- **Opening sting**: the logo animation plays on every load, then the page
  lifts in. "Skip intro" or Escape ends it early. A screen with a mouse plays
  the supplied video. A phone or tablet is not sent the video (a phone may be
  slow to fetch one, may refuse to autoplay it, and does not always play it
  smoothly): it shows the same sequence drawn in code by `drawSting` in
  `js/main.js`, from the logo's own shapes. The n rises, the orb lands on its
  shoulder, the orb drops and the n draws back, and the other letters come up
  one by one and push the orb along to its place as the full stop. Its
  positions and timings were measured from the video frame by frame, and it
  ends on the video's last frame exactly. Any screen whose video has not
  started within a second and a half shows the drawn one too.
- **The signal orb**: the logo's orb, drawn as a real sphere on a canvas so its
  six-circle pattern turns in 3D. It sits large in the hero, rolls with the
  scroll, lands on the full stop of each chapter heading, rides a rail at the
  page edge between them, passes through the five stages, and ends as the dot
  of the footer wordmark. Any element with `data-orb` is an anchor, in document
  order.
- **The field**: canvas, on one fixed layer behind the whole page so no section
  edge ever cuts it. The orb sits in a field of lines the way a pole sits in a
  magnetic field: lines are drawn into it, a few leave the far side, the rest
  sweep round it. Every line is a streamline of one smooth field, retraced on
  each frame, so nothing jumps. The field leans with the scroll and settles
  like a compass needle, shrinks with the orb as it rolls away, and parts
  round the pointer as it would round a second pole.
- **Hero interactions**: drag the orb to spin it (mouse or touch, with
  momentum); move over the lines to bend them; press and hold to push them
  further apart; tap the orb to make the whole field ring.
- **The satellites**: four small 3D models orbit the orb: a headquarters
  (enterprises), a bank (financial services), a capitol (government services)
  and a shelf of products (consumer brands). They are built from code in `js/satellites.js` and lit in
  WebGL on a transparent layer over the orb. An invisible sphere the size of
  the orb holds the depth, so a satellite that passes behind the orb is hidden
  by it, and one that passes in front casts its shadow on it. Each model runs
  its own loop: windows light floor by floor, a coin drops into the bank, the
  flag flies, a scanner sweeps the shelf.
  Whichever satellite is at the front sets the last words of the headline
  ("We build AI-native enterprises / financial services / government services /
  consumer brands"), the label above it, the paragraph below and the second
  button. The headline's size is taken from its longest version, so every one
  fits on a single line. On load the
  satellites swing out of the orb and come to rest on Enterprise; as the page
  scrolls they draw back into it. Everything heavy (models, shaders, one unseen
  frame) is prepared in pieces, where it cannot be seen as a stutter: under the
  opening video while it plays, or, where the opening is drawn in code, in the
  moments that drawing stands still. So the satellites are ready when the hero
  appears and swing out with it. The 3D library itself is fetched once the
  opening is under way, and not at all when the browser asks to save data.
- **The view**: the orbit runs round the orb at its equator and is seen from
  only just above its own plane, tipped a little towards the viewer. So each
  model is met from the front, and the one at the front, which faces straight
  out of the page, sits just below the middle of the orb.
- **Three things to turn**: a drag that starts on the orb turns the orb alone.
  A drag that starts in the orbit round it, on a satellite at the side or in
  the space between them, turns the orbit: sideways brings the next satellite
  to the front and it settles there, up and down tips the plane of the orbit,
  far enough to look down on the satellites or see them from underneath but
  never over the top. A drag that starts on the satellite at the front turns
  that one model on its own disc, a little to either side; it stays as it is
  left until another satellite takes its place, and a drag that goes past the
  end of that turn carries on into turning the orbit. On a touch screen a
  drag that reaches the end of the tilt carries on into the page. A sideways
  trackpad swipe turns the orbit too. The arrow keys turn it a satellite at a
  time, and the list at the foot of the hero picks one directly. Moving the
  pointer over the field bends the lines only: the orb and the satellites do
  not react to it.
- **Pressing a satellite**: a click or tap on a satellite gets its answer (it
  comes to the front, or, if it is there already, its pieces rise again) and
  then, after a moment, the page goes down to that industry's section. The
  section is the `data-href` on that industry's paragraph in the hero. Only a
  deliberate press goes anywhere: the pointer moved less than 6 pixels, was
  down for less than 0.6 seconds, and the page was not scrolling under it. A
  drag turns the orbit and never counts. A press that was held, or that only
  stopped a scroll, gets the answer and the page stays. Taking hold of the
  orbit again, or scrolling, before the page has set off calls it off. From
  the keyboard, Tab to a satellite and Enter does the same.
- **Sound and touch**: one sound for everything, a short dry tick like a
  picker wheel passing a value. It is heard when a satellite comes to the
  front and each time the orb lands on a heading's full stop as the reader
  scrolls; on phones that support it the tick is felt as well. When a link or
  a press takes the page somewhere, the orb passes many headings on the way;
  that journey makes one tick only: as it arrives, or, for a press on a
  satellite, at the press and none after. It is synthesised in `js/main.js` (no
  audio files) and is identical every time. Browsers only allow sound after a
  first tap, click or key press. The speaker button in the nav turns it all
  off and the choice is remembered.
- **Fallbacks**: without WebGL, or on a machine that would draw it in
  software, the hero works without the satellites and the list still changes
  the text. With reduced motion they are drawn once, standing still. If frames
  run long the layer steps its own quality down, twice at most: standard
  pixel density, then no shadows. It never removes the satellites. A browser
  that holds itself to thirty frames a second (many do, to save power) does
  not count as slow. If the browser takes the graphics context away and gives
  it back, the satellites come back with it.
- **What is changing**: a pinned canvas scene where a layered organisation
  chart reorganises into small teams with agent rings.
- **How we work**: sticky stacking cards. **Industries**: each chapter heading
  stays put while its rows come in beside it; the financial services chapter
  holds a pinned horizontal gallery with three animated product screens.
  **How we engage**: a vertical timeline that the orb travels down.

## On a phone

Below 700px the page keeps every section but shows less in each one. The rules
are in one block at the end of `css/style.css` ("phones: the same page, said in
less"), and nothing in it applies to wider screens.

- **Capability rows** show their name only. A tap opens a row to show its
  sentence and its tag. The button is added by `initRowTaps` in `js/main.js`;
  without JavaScript every row is shown in full.
- **The product gallery** is three cards side by side, swiped sideways.
- **The industry links** are one line that scrolls sideways.
- **Hidden on a phone**: the sentences under the four values, the sub-lists in
  What we do and in Contact, the struck-through lines in What it takes, the
  descriptions in What sets us apart, the three steps inside each stage of How
  we engage, the sentences under "you own it all" and under each place, the two
  paragraphs in Who builds it, and the second copy of the email address. To
  show any of them again, remove its `display: none` line from the block.

## Editing content

- Text is plain HTML in `index.html`, one commented block per section.
- **Hero industries**: each satellite has one paragraph in the
  `<div class="hero__ledes">` block, in orbit order. The paragraph is the text
  shown under the headline; its attributes set the rest: `data-word` is the
  word that ends the headline, `data-label` the line above it, `data-name` the
  satellite's name for screen readers and tooltips, `data-cta` and `data-href`
  the second button. The matching entries in the hero's footer list are the
  `hero__pick` buttons. The models themselves live in `js/satellites.js`, one
  function each.
- **Team**: the grid of team members is out of the page for now (it only held
  placeholders). Its styles are still in `css/style.css` (`.team__grid`,
  `.member`), and the markup is in the git history, for when there are names
  to show.
- **Contact**: the phone and office-address placeholders are marked with the
  `ph` class in the contact section and in the footer.
- **Industries**: each chapter is an `<article class="chapter">`; a capability
  is one `<li class="row">` with a heading, a line of text and a tag. The tag
  names the ntell product that covers it, or uses `tag--plain` for bespoke work.
- Product screens in the financial services gallery use demo data and are
  labelled as such.

## Deploy

Any static host works (Vercel, GitHub Pages, Netlify, Cloudflare Pages, S3).
There is nothing to build: publish the repository root as it is.

- **Vercel**: import this repository as a new project. Framework preset
  "Other", no build command, output directory left empty. Every push to `main`
  then deploys.
- **GitHub Pages**: a workflow is included at `.github/workflows/pages.yml`.
  Enable Pages with the "GitHub Actions" source and every push to `main`
  deploys.

To serve it on the ntell.ai domain, add the custom domain in the host's
settings and point DNS at it.

## Licences

GSAP is used under its standard no-charge licence. Lenis and three.js are MIT.
The fonts are under the SIL Open Font License.
