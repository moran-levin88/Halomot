# 👑 חלומות - Sleeping Queens Online

## הרצה מקומית

### שרת
```bash
cd server
npm install
npm run dev
```

### לקוח
```bash
cd client
cp .env.example .env
# ב-.env: REACT_APP_SERVER_URL=http://localhost:3001
npm install
npm start
```

## Deploy ל-Railway

### שלב 1 - Deploy השרת
1. כנס ל [railway.app](https://railway.app) וצור חשבון
2. "New Project" → "Deploy from GitHub repo" (או "Empty project")
3. בחר את תיקיית `server`
4. Railway ידלה אוטומטית. תקבל URL כמו `https://xxx.up.railway.app`

### שלב 2 - Deploy הלקוח (Vercel/Netlify/Railway)
1. ב-`client/.env` שים: `REACT_APP_SERVER_URL=https://xxx.up.railway.app`
2. `npm run build` יצור תיקיית `build/`
3. Deploy את `build/` ל-Vercel/Netlify, או הוסף service נוסף ב-Railway

### Deploy שניהם ב-Railway (הכי פשוט)
צור שני services ב-Railway: אחד ל-`server`, אחד ל-`client`.
לשרת: startCommand = `node src/index.js`
ללקוח: בהגדרות Environment הוסף `REACT_APP_SERVER_URL`, ואז `npm run build`
