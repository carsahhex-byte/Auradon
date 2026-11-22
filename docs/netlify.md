# Publish Auradon on Netlify

Netlify can build and host Auradon directly from its GitHub repository.

## One-time setup

1. Open <https://app.netlify.com/> and create an account or sign in with GitHub.
2. Choose **Add new project** (or **Add new site**) and **Import an existing project**, then choose GitHub.
3. Authorize access to **carsahhex-byte/Auradon** and select that repository.
4. Set the production branch to **main**.
5. Keep the base directory empty. The committed `netlify.toml` supplies:

   | Setting | Value |
   | --- | --- |
   | Build command | `npm run build:production` |
   | Publish directory | `dist` |
   | Node version | `24` |

6. Choose **Deploy**. When Netlify marks the deploy as published, open the provided `https://YOUR-SITE.netlify.app/#title` address.

Bookmark the base site address with `/#title` to follow future releases. The app uses hash routes, so no SPA catch-all redirect is required. Do not rewrite `/api/*` to `index.html`.

If desired, change the generated site name to a memorable available name in Netlify's project/site settings. Availability is determined by Netlify.

## Future updates and testing

Pushing to `main` lets Netlify build and publish the update automatically. The GitHub Pages site uses its own `gh-pages` branch. Netlify retains earlier deployments for rollback.

For reviewing future work first, use a pull-request Deploy Preview or enable a separate branch deploy in Netlify. Keep the stable site address for regular play. Preview addresses are different browser origins and have separate guest saves.

The game-only production build excludes the optional `previews/` and `prototypes/` directories; it retains the entire playable game and runtime artwork. It checks artwork integrity and emits content-hashed assets and modules. `netlify.toml` revalidates HTML and `build-info.json` while allowing long caching of hashed artwork.

## Saves when changing addresses

Guest profiles, guest decks, and shared-screen duels belong to their original browser and website origin.

Sign into the same game server from either site to use existing account decks. If an element has an empty slot, the game supplies its 12-slab starter.

## Accounts and two-phone battles

Netlify serves the static frontend; it does not run `server/index.js`, SQLite account storage, or multiplayer rooms. Shared-screen play works without those services.

For accounts or two-phone play, deploy a separate Auradon HTTPS game server.

1. Build and start the server from Auradon’s `main` branch.
2. Add the exact Netlify origin to its comma-separated `AURADON_ALLOWED_ORIGINS`, preserving other allowed origins. Example: `https://carsahhex-byte.github.io,https://YOUR-SITE.netlify.app`. Do not include `/#title`, `/Auradon/`, or a trailing slash.
3. Enter the server's real HTTPS URL in **Account** and **Battle → Play on two screens** on both phones.

Fresh `*.netlify.app` installs leave the server address unconfigured instead of trying to use Netlify as the room API. Explicit or previously saved server addresses still work. See [the server setup guide](multiplayer.md) for hosting and persistence.

If you switch to a custom frontend domain, add that origin to the game server’s `AURADON_ALLOWED_ORIGINS`.

## Manual upload fallback

1. Run `npm run build:production` from the Auradon repository.
2. Open [Netlify Drop](https://app.netlify.com/drop).
3. Drop the generated `dist` folder. Its root contains `index.html`, `build-info.json`, `src`, and `public`.
4. Open the site address Netlify returns, followed by `/#title`.

The manual package contains the complete game and its artwork. Optional sprite-review galleries and the separate drawing prototype are omitted to reduce the upload size. Connected repository production builds omit them as well. For a local review build with those unchanged galleries and the experiment, run `npm run build:web` and `npm run preview`. All originals remain in the repository.

The manual upload is a snapshot. Later updates require another manual upload unless the project is connected to GitHub. A manual upload and a connected project may produce different site addresses; keep one stable site for regular play and its guest saves.
