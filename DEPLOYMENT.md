# Deployment Guide

This guide will help you deploy the PVS (Performance & Verification System) application to Render (backend) and Vercel (frontend).

## Prerequisites

- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- MongoDB Atlas account (for production database)

## Part 1: Deploy Backend to Render

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Create a Render Web Service

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `pvs-server` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

### Step 3: Set Environment Variables in Render

In the Render dashboard, go to "Environment" tab and add these variables:

```
NODE_ENV=production
PORT=4000
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/pvs_production
JWT_SECRET=<generate-a-strong-secret-key>
CLIENT_URL=https://your-vercel-app.vercel.app
```

**Important Notes:**
- Generate a secure JWT_SECRET: `openssl rand -base64 32`
- Use a production MongoDB database (not your development one!)
- You'll update CLIENT_URL after deploying to Vercel

### Step 4: Deploy

Click "Create Web Service" and wait for deployment to complete.

**Your backend URL will be**: `https://your-app-name.onrender.com`

## Part 2: Deploy Frontend to Vercel

### Step 1: Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### Step 2: Set Environment Variables in Vercel

In the Vercel project settings, go to "Environment Variables" and add:

```
VITE_API_URL=https://your-render-app.onrender.com
```

Replace `your-render-app` with your actual Render app name.

### Step 3: Deploy

Click "Deploy" and wait for deployment to complete.

**Your frontend URL will be**: `https://your-app.vercel.app`

## Part 3: Update Backend CORS

### Step 1: Update Render Environment Variables

Go back to your Render dashboard and update the `CLIENT_URL` environment variable:

```
CLIENT_URL=https://your-app.vercel.app
```

Replace `your-app` with your actual Vercel app name.

### Step 2: Restart Render Service

Render should automatically restart. If not, manually trigger a restart.

## Part 4: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try to sign in or create an account
3. Test all features to ensure they work correctly

## Troubleshooting

### CORS Errors

If you see CORS errors:
- Verify `CLIENT_URL` in Render matches your Vercel URL exactly
- Ensure it includes `https://` and doesn't have a trailing slash
- Restart the Render service after updating

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check MongoDB Atlas whitelist: add `0.0.0.0/0` for Render's IP addresses
- Ensure your MongoDB user has correct permissions

### API Not Found (404)

- Verify `VITE_API_URL` in Vercel is correct
- Check browser console for the actual URL being called
- Ensure Render service is running

### Environment Variables Not Working

- Redeploy after adding/updating environment variables
- Vercel: Variables are applied on next deployment
- Render: Service restarts automatically

## Production Checklist

- [ ] Use production MongoDB database (not development)
- [ ] Generate strong JWT_SECRET
- [ ] Update CLIENT_URL in Render after Vercel deployment
- [ ] Update VITE_API_URL in Vercel to point to Render
- [ ] Test all authentication flows
- [ ] Test all CRUD operations
- [ ] Verify CORS is working
- [ ] Check error handling and logging
- [ ] Enable MongoDB Atlas IP whitelist if needed
- [ ] Set up custom domain (optional)

## Custom Domains (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain and follow DNS configuration instructions

### Render
1. Go to Settings → Custom Domain
2. Add your domain and follow DNS configuration instructions

## Environment Files Summary

### Server (.env)
```
DATABASE_URL=mongodb+srv://...
JWT_SECRET=<strong-secret>
PORT=4000
NODE_ENV=production
CLIENT_URL=https://your-vercel-app.vercel.app
```

### Client (Vercel Environment Variables)
```
VITE_API_URL=https://your-render-app.onrender.com
```

## Monitoring

- **Render**: View logs in the dashboard under "Logs" tab
- **Vercel**: View deployment logs and function logs in dashboard
- **MongoDB Atlas**: Monitor database performance in Atlas dashboard

## Support

If you encounter issues:
1. Check Render logs for backend errors
2. Check Vercel deployment logs for frontend errors
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly
