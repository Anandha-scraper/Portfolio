# Production deployment

`main` is the only production deployment branch. The GitHub Actions workflow
installs dependencies, typechecks, builds the static export, verifies that no
master/editor route was emitted, and then deploys Firebase Hosting.

Configure the repository secret `FIREBASE_SERVICE_ACCOUNT` with the complete
JSON value for a least-privilege Google service account that can deploy Firebase
Hosting for the `anandhadev` project. Do not commit that JSON, a service-account
key file, or any Firebase access token.

`dev` is intentionally not a deployment trigger. It is the working branch;
only validated merges into `main` deploy to Firebase Hosting.

## Canonical domain

`https://anandha.codes` is the canonical public URL. The static site performs
an early hostname-specific redirect for the Firebase defaults owned by this
project: `anandhadev.web.app` and `anandhadev.firebaseapp.com`. It preserves
the requested path, query string, and fragment before the app renders.

Firebase Hosting's `firebase.json` redirects match URL paths, not hostnames,
so a Hosting redirect cannot safely distinguish a legacy default domain from
the canonical custom domain. `anandha.firebaseapp.com` is currently not owned
by this Hosting site (it returns Firebase's 404 page); redirecting that name
requires configuring the Firebase project that owns it.
