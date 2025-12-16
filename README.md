# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Local development

Run the frontend (Next.js) and backend (simple Node server) locally.

- Frontend (Next.js) - runs on http://localhost:5001

	```bash
	npm install
	npm run dev
	```

- Backend (API/lightweight server) - runs on http://localhost:9000

	```bash
	npm run backend
	# or directly
	node backend/server.js
	```

Open the frontend at `http://localhost:5001` and the backend health check at `http://localhost:9000/health`.

Notes about Firebase removal
- This repository has been adapted to run without the Firebase SDKs for local development.
- The UI-level provider and initialization are no-op stubs so client imports won't fail.
- Predictions are saved to the local SQLite-backed helper in `src/db/sqlite.ts`.

Pushing to GitHub (`fairproject25-26`)

1. Create the remote repository on GitHub (replace `<your-username>`):

```bash
# using GitHub CLI (optional)
gh repo create <your-username>/fairproject25-26 --public --source=. --push

# OR create the repo on github.com and then add the remote:
git remote add origin git@github.com:<your-username>/fairproject25-26.git
git branch -M main
git add .
git commit -m "chore: remove Firebase runtime dependency; run locally on ports 5001/9000"
git push -u origin main
```

If you want me to run the commits and push for you, grant access to a GitHub token or run the above commands locally.
