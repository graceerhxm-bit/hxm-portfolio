# HXM Portfolio JavaScript

Upload the `js` folder to the root of your public GitHub repository.

Files:
- `shader.js`: Hero Three.js shader and scroll/mouse behavior.
- `site-interactions.js`: text reveal, project tilt, marquees, services, cursor images, sticky release, buttons, and footer logo animation.

In Webflow Footer Code, remove the old full script and paste the contents of `webflow-footer-loader.html`. Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY`.

Keep the Three.js and VanillaTilt library tags in Webflow Head Code before these files load.

When updating code during testing, change `?v=1` to `?v=2`, `?v=3`, and so on to bypass browser/CDN cache.
