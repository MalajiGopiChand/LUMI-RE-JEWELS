# Concept asset sources

Product PNGs in `products/lj-1.png` through `products/lj-24.png` were generated with the built-in OpenAI image generation tool on 13 October 2026. Each product has one distinct primary image. These are AI-created design concepts, not photographs of goods available for sale.

Method: text-to-image generation for individual catalogue designs. The first two primary images use an ivory studio background; other primary images use transparency. `lj-1-overlay.png` was generated as a transparent single earring reference edit for placement. Product previews use transparent PNG assets, cropped to their alpha bounds in the browser. No scripts altered the generated images.

Common generation prompt: “Use case: product-mockup. One photorealistic luxury jewellery catalogue cutout, truly transparent background. Product [id]: [design]. Beautiful realistic jewellery, crisp metal reflections, soft neutral studio lighting, centered in square frame with generous margin, whole item visible, premium editorial catalogue quality. No text, logos, watermark, hands, people, props, background or cast shadow. This image will also be an approximate virtual jewellery overlay.” Earlier generations used equivalent neutral studio wording and asked for the item to occupy about 65% of the frame.

Product 1 design: a pair of chunky, rounded, polished yellow gold hoop earrings. Product-specific designs for the remaining generated images:

+- `lj-2`: a single white gold solitaire ring with a round brilliant diamond, four prongs, thin polished band, three-quarter angle.
- `lj-3`: a delicate yellow gold oval sun medallion pendant on a fine chain arranged as a graceful open V with necklace clasp excluded.
- `lj-4`: a fine yellow gold tennis bracelet with small round bezel-set diamonds, arranged as a circular bracelet.
- `lj-5`: one yellow gold long statement drop earring with three graduated sculptural teardrop shapes connected vertically.
- `lj-6`: a single minimalist polished yellow gold wedding band with gently rounded edges, three-quarter angle.
- `lj-7`: yellow gold two-strand layered necklace with one shorter fine chain and one longer chain holding a tiny polished gold disc, arranged in two complete nested V curves.
- `lj-8`: yellow gold wide minimalist sculptural open cuff bracelet with flowing asymmetric curved edges, three-quarter angle.
- `lj-9`: one yellow gold drop earring with a luminous ivory freshwater pearl suspended under a small golden sphere.
- `lj-10`: yellow gold ring with an oval deep red ruby and a delicate halo of small diamonds, three-quarter angle.
- `lj-11`: a complete necklace of small luminous ivory freshwater pearls with a tiny gold clasp, arranged as a clean oval.
- `lj-12`: a complete delicate bracelet of ivory freshwater pearls alternating with tiny yellow gold beads, arranged as a circle.
- `lj-13`: one delicate yellow gold threader earring, long fine chain with a narrow smooth golden bar at the bottom, vertical straight display.
- `lj-14`: a single rose gold braided twisted band ring with two softly intertwined thin bands, three-quarter angle.
- `lj-15`: a yellow gold fine chain necklace with one small pear shaped emerald pendant in a gold bezel, necklace arranged as a complete long V.
- `lj-16`: a complete rose gold bracelet of large delicate paperclip links with a small lobster clasp, arranged in an elegant oval.
- `lj-17`: one yellow gold stud earring with a rectangular rich emerald surrounded by a thin polished gold bezel, front view.
- `lj-18`: a single white gold ring with one luminous ivory pearl on a slim curved open band and tiny diamond accents, three-quarter angle.
- `lj-19`: a fine rose gold necklace with a tiny polished heart pendant, necklace arranged as a full V shape.
- `lj-20`: a single narrow polished yellow gold closed circular bangle with three small star engraved accents, three-quarter angle.
- `lj-21`: one tiny yellow gold huggie hoop earring encrusted with a row of small white diamonds, three-quarter angle.
- `lj-22`: a single white gold ring with one oval deep blue sapphire and two small white diamond side stones, three-quarter angle.
- `lj-23`: a delicate yellow gold diamond lariat necklace arranged as a full Y shape with tiny diamond bezel at the junction and a fine trailing chain.
- `lj-24`: a complete fine yellow gold chain bracelet with three small emerald bezel set stones evenly spaced, arranged in a circular form.

`editorial/portrait-preview.png` and `editorial/hand-preview.png` are AI-generated sample model photos. Prompts requested an adult woman facing the camera with both ears, neck and shoulders visible and no jewellery, and an adult hand photographed clearly with fingers and wrist visible and no jewellery, respectively, against a neutral studio background. They provide sample input for local landmark tracking.

Editorial JPGs were downloaded to `editorial/` from Unsplash. Exact source IDs and download parameters are recorded in `scripts/download-editorial.mjs`. Google Fonts remains a remote font source. MediaPipe runtime and model sources are recorded in `scripts/download-tracking.mjs`; their files are served locally.

The 24 GLBs in `public/models` were created procedurally by `scripts/create-design-models.ts`. They are illustrative design studies, not calibrated scans or exact replicas of the generated product images. Try-on placement cannot establish real fit, dimensions or occlusion.
