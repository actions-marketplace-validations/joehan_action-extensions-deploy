# 🔥🌎 Firebase Extensions GitHub Action

- Deploy your Extensions to a staging project whenever a new PR is opened
- Comments a link to view your Extensions in the Firebase console on each PR
- Deploys the current state of your GitHub repo to your prod project when the PR is merged.

## Setup

A guide on how to save your Extensions config locally can be found [in the Firebase Extensions docs](https://firebase.google.com/docs/extensions/reuse-project-config).

## Usage

### Deploy Extensions to your staging project for every PR

Add a workflow (`.github/workflows/deploy-staging.yml`):

```yaml
name: Deploy to Staging

on:
  pull_request:
    # Optionally configure to run only for specific files. For example:
    # paths:
    # - "extensions/**"

jobs:
  build_and_preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: FirebaseExtended/action-extensions-deploy@v0-alpha5
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          project: your-staging-project-ID
```

### Deploy to your prod project on merge

Add a workflow (`.github/workflows/deploy-production.yml`):

```yaml
name: Deploy to Prod

on:
  push:
    branches:
      - main
    # Optionally configure to run only for specific files. For example:
    # paths:
    # - "extensions/**"

jobs:
  deploy_extensions_to_prod:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      # Add any other steps here.
      - uses: FirebaseExtended/action-extensions-deploy@v0-alpha5
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          project: your-prod-project-ID
```

## Options

### `firebaseServiceAccount` _{string}_ (required)

This is a service account JSON key. You'll need to [create it manually](./docs/service-account.md).

It's important to store this token as an
[encrypted secret](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets)
to prevent unintended access to your Firebase project. Set it in the "Secrets" area
of your repository settings and add it as `FIREBASE_SERVICE_ACCOUNT`:
`https://github.com/USERNAME/REPOSITORY/settings/secrets`.

### `repoToken` _{string}_

Adding `repoToken: "${{secrets.GITHUB_TOKEN}}"` lets the action comment on PRs
with a link to view your newly deployed Extensions in the Firebase Console. You don't need to set
this secret yourself - GitHub sets it automatically.

If you omit this option, you'll need to find the preview URL in the action's
build log.

### `project` _{string}_

The Firebase project that contains the Hosting site to which you
want to deploy. If left blank, you need to check in a `.firebaserc`
file so that the Firebase CLI knows which Firebase project to use.

### `entryPoint` _{string}_

The location of your [`firebase.json`](https://firebase.google.com/docs/cli#the_firebasejson_file)
file relative to the root of your repository. Defaults to `.` (the root of your repo).

## Status

![Status: Experimental](https://img.shields.io/badge/Status-Experimental-blue)

This repository is maintained by Joe Hanley, but is not a supported Firebase product. Issues here are answered by maintainers and other community members on GitHub on a best-effort basis.
