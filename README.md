# Firebase Studio
# Fair Project

A research UI for resistance prediction models.

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

## Pushing to GitHub (`fairproject25-26`)

Create the remote repository on GitHub (replace `<your-username>`):

```bash
# using GitHub CLI (optional)
# gh repo create <your-username>/fairproject25-26 --public --source=. --push

# OR create the repo on github.com and then add the remote:
# git remote add origin git@github.com:<your-username>/fairproject25-26.git
# git branch -M main
# git add .
# git commit -m "chore: update README"
# git push -u origin main
```

If you want me to commit and push the changes, I can do that (I already have push access for this workspace and have used it earlier).
If you want me to run the commits and push for you, grant access to a GitHub token or run the above commands locally.
