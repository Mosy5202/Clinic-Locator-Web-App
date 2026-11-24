# Contributing

## Branch model

- `main`: stable version suitable for submission/demo.
- `develop`: shared integration branch where completed features are combined and tested.
- `feature/<short-name>`: one focused feature per branch.
- `fix/<short-name>`: bug fixes.
- `docs/<short-name>`: documentation-only changes.

Do not commit directly to `main`. Open pull requests into `develop`; after integration testing, merge `develop` into `main`.

## First-time setup

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd <YOUR-REPOSITORY-FOLDER>
git switch -c develop
git push -u origin develop
```

If `develop` already exists on GitHub, use `git fetch origin` then `git switch --track origin/develop` instead of creating it.

## Start a feature

```bash
git switch develop
git pull origin develop
git switch -c feature/your-feature-name
```

Work only on the files relevant to that feature. Commit in small, descriptive steps:

```bash
git add <files>
git commit -m "feat: describe the change"
git push -u origin feature/your-feature-name
```

Then open a Pull Request on GitHub with **base: `develop`**. Ask another member to review it. Resolve feedback and merge only after the feature works with the current project.

## Keep your branch current

Before starting work each day:

```bash
git switch develop
git pull origin develop
git switch feature/your-feature-name
git merge develop
```

Resolve conflicts carefully, run the relevant checks, then push your branch.

## Suggested first feature branches for the three members

1. `feature/gis-data-and-database` — facility data sourcing/cleaning, PostGIS schema, import notes, and SQL spatial indexes.
2. `feature/clinic-api` — Flask database connection and API endpoints such as nearest-clinic and radius search.
3. `feature/leaflet-map-ui` — map layout, clinic markers, selection point, result list, and API integration.

After the first working version, split larger tasks into narrower branches if useful, e.g. `feature/nearest-clinic-query`, `feature/radius-filter`, or `feature/facility-type-filter`.

## Team agreements

- Agree on the database table/column names and API contract before implementing dependent features.
- Do not rename API fields or database columns without telling the other members.
- Never commit passwords, API keys, `.env`, or large raw datasets.
- Do not work directly in another member's feature branch unless you coordinate first.
- Every pull request should state: what changed, how to test it, screenshots (for UI changes), and any follow-up work.
