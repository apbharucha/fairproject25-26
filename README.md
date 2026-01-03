streamlit run streamlit_app.py# Firebase Studio
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

## Troubleshooting: API bind address (0.0.0.0 vs 127.0.0.1)

If the Streamlit frontend shows the error:

- "Connection error: [Errno 99] Cannot assign requested address"
- "⚠️ Could not load dataset statistics. Make sure the API is running."

This usually happens when the backend server is bound to `0.0.0.0` (listen on all interfaces) and that address is mistakenly used as the client destination. `0.0.0.0` is not a routable destination — you must use a reachable address such as `127.0.0.1` (loopback) when connecting from the same machine or container.

How to fix:

1. In the Streamlit app sidebar, enable "Configure API URL" and set the API URL to:

```text
http://127.0.0.1:9000
```

2. Alternatively, set the environment variable before launching Streamlit:

```bash
export API_BASE_URL="http://127.0.0.1:9000"
streamlit run streamlit_app.py
```

3. If you run the backend with the included script, it binds to `0.0.0.0` so use loopback on the client as shown above:

```bash
python3 run_backend.py  # backend binds to 0.0.0.0:9000
```

4. If you're running the frontend and backend in different machines or containers, ensure the host and port used by the frontend are reachable (use the host IP or set up port forwarding).

If you'd like, I can update the app to automatically retry using `127.0.0.1` when `0.0.0.0` is detected (I've already added such a fallback in the Streamlit app).
