# 🚀 QUICK START - MRSA Resistance Forecaster

## ⚡ ONE-COMMAND STARTUP

```bash
cd /workspaces/fairproject25-26 && ./start_complete.sh
```

Then open: **http://localhost:8501**

---

## ✅ VERIFICATION (Run This to Check Everything)

```bash
curl http://127.0.0.1:9000/health && \
curl http://127.0.0.1:9000/api/dataset-stats && \
curl http://127.0.0.1:8501
```

All should return data, no errors.

---

## 🛑 STOP SERVICES

```bash
pkill -9 -f streamlit && pkill -9 -f main.py
```

---

## 🔧 MANUAL STARTUP (2 Terminals)

**Terminal 1 - Backend:**
```bash
cd /workspaces/fairproject25-26
./.venv/bin/python python_backend/api/main.py
```

**Terminal 2 - Frontend:**
```bash
cd /workspaces/fairproject25-26
./.venv/bin/streamlit run streamlit_app.py --server.enableCORS=false
```

---

## 📍 URLS

| Service | URL |
|---------|-----|
| App | http://localhost:8501 |
| Backend | http://127.0.0.1:9000 |
| Health | http://127.0.0.1:9000/health |
| Data | http://127.0.0.1:9000/api/dataset-stats |

---

## 📝 FULL DOCUMENTATION

See: `COMPLETE_FIX_GUIDE.md` for detailed troubleshooting
