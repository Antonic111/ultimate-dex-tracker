# 🚀 Pokemon Website Deployment Guide

## 📋 Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free)
- MongoDB Atlas account (free)

## 🔧 Step 1: Prepare Your Code

### ✅ Already Done:
- [x] Updated API URLs from localhost to relative paths
- [x] Created vercel.json for frontend
- [x] Created railway.json for backend
- [x] Added health check endpoint
- [x] Updated CORS configuration

## 🌐 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project

### 2.2 Deploy Backend
1. **Connect Repository**: Choose "Deploy from GitHub repo"
2. **Select Repository**: Choose your Pokemon website repo
3. **Set Root Directory**: `server/`
4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_strong_jwt_secret
   RESEND_API_KEY=your_resend_api_key
   FRONTEND_URL=https://yourdomain.vercel.app
   SESSION_SECRET=your_strong_session_secret
   ```

### 2.3 Get Railway URL
- Railway will give you a URL like: `https://your-app-name.railway.app`
- Copy this URL for the next step

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository

### 3.2 Configure Frontend
1. **Framework Preset**: Vite
2. **Root Directory**: `./` (root of repo)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### 3.3 Add Environment Variables
```
VITE_API_URL=https://your-app-name.railway.app
```

## 🗄️ Step 4: Set Up MongoDB Atlas

### 4.1 Create Cluster
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Choose provider (AWS/Google Cloud) and region

### 4.2 Database Access
1. Create database user with password
2. Remember username/password

### 4.3 Network Access
1. Add IP address: `0.0.0.0/0` (allows all connections)
2. Or add specific IPs for security

### 4.4 Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your actual password

## 🔗 Step 5: Connect Everything

### 5.1 Update Railway Environment
- Go back to Railway dashboard
- Update `MONGO_URI` with your Atlas connection string

### 5.2 Update Vercel Environment
- Go to Vercel dashboard
- Update `VITE_API_URL` with your Railway URL

### 5.3 Redeploy
- Both services should auto-deploy when you push changes

## 🧪 Step 6: Test Your Deployment

### 6.1 Test Backend
- Visit: `https://your-app-name.railway.app/api/health`
- Should see: `{"status":"OK","timestamp":"..."}`

### 6.2 Test Frontend
- Visit your Vercel domain
- Try to register/login
- Check if API calls work

## 🚨 Troubleshooting

### Common Issues:
1. **CORS Errors**: Check Railway CORS settings
2. **Database Connection**: Verify MongoDB Atlas connection string
3. **Environment Variables**: Ensure all are set in Railway/Vercel
4. **Build Errors**: Check build logs in Vercel

### Debug Steps:
1. Check Railway logs for backend errors
2. Check Vercel build logs for frontend errors
3. Verify environment variables are set correctly
4. Test API endpoints directly

## 🎉 Success!
Your Pokemon website should now be live on:
- **Frontend**: `https://yourdomain.vercel.app`
- **Backend**: `https://your-app-name.railway.app`

## 📚 Next Steps
- Set up custom domain
- Configure monitoring
- Set up CI/CD pipeline
- Add analytics

