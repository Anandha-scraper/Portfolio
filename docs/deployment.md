# Production deployment

`main` is the only production deployment branch. The GitHub Actions workflow
installs dependencies, typechecks, builds the static export, verifies that no
master/editor route was emitted, and then deploys Firebase Hosting.

Configure the repository secret `FIREBASE_SERVICE_ACCOUNT` with the complete
JSON value for a least-privilege Google service account that can deploy Firebase
Hosting for the `anandhadev` project. Do not commit that JSON, a service-account
key file, or any Firebase access token.

`dev` is intentionally not a deployment trigger. It retains the local
development console and sidecar; those tools are never part of the production
export.
