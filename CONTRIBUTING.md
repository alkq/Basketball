# Contributing

Thanks for wanting to contribute! Quick steps to get started:

1. Fork or be added as a collaborator on the GitHub repo.
2. Clone and install dependencies:

```bash
git clone https://github.com/alkq/Basketball.git
cd Basketball
npm install
```

3. Run dev server locally:

```bash
npm run dev
```

4. Create a feature branch and open a PR:

```bash
git checkout -b feat/your-feature
git add .
git commit -m "feat: short description"
git push origin feat/your-feature
```

5. PR workflow:
- Push to a branch and open a pull request against `main`.
- Describe what you changed, include screenshots if UI-related.
- CI / previews: if Vercel is connected the PR will get a preview URL.

6. Type checking and linting:

```bash
npm run typecheck
```

Notes:
- GitHub is the source of truth — Vercel is only used for builds & hosting.
- If you need deployment permissions for the Vercel project, request access on the Vercel dashboard.

Thank you — we appreciate your contributions!
