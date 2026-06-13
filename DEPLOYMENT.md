# GMinsta - Full Stack Deployment Guide

This guide walks you through deploying the complete **GMinsta** MERN stack application. Because GMinsta is a full-stack application that leverages real-time WebSocket connections (Socket.io) for messaging and notifications, the hosting is divided into two parts:

1. **Frontend (Vite + React)**: Hosted on **Vercel** (Fast static edge hosting).
2. **Backend (Node.js + Express + Socket.io)**: Hosted on a persistent server provider like **Render** or **Railway** (to maintain continuous WebSocket connections).

---

## Step 1: Push Project to GitHub

Follow these steps to upload your codebase to a remote GitHub repository:

1. Open your terminal in the project root directory (`c:\Users\sruju\Downloads\gminsta`).
2. Create a new repository on [GitHub](https://github.com/new). Name it `gminsta` (you can choose Public or Private).
3. Copy the Git URL of your repository (e.g., `https://github.com/YOUR_USERNAME/gminsta.git`).
4. Execute the following commands in your local terminal:
   ```bash
   # Add your remote repository as origin
   git remote add origin https://github.com/YOUR_USERNAME/gminsta.git

   # Rename the default branch to main
   git branch -M main

   # Push the codebase to GitHub
   git push -u origin main
   ```

---

## Step 2: Deploy the Backend (Render or Railway)

Since serverless environments (like standard Vercel configurations) do not support persistent WebSocket connections, a persistent hosting provider is required for the backend.

### Option A: Deploying on Render (Recommended)
1. Go to [Render.com](https://render.com) and log in using your GitHub account.
2. Click **New +** at the top right and select **Web Service**.
3. Link your `gminsta` GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `gminsta-backend`
   - **Root Directory**: `server`
   - **Environment/Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Expand the **Environment Variables** section and add:
   - `MONGO_URI`: Your MongoDB Atlas connection string (or other hosted MongoDB database URI).
   - `JWT_SECRET`: A long, secure random secret key.
   - `JWT_EXPIRE`: `30d`
   - *(Optional)* `CLOUDINARY_CLOUD_NAME`: For media storage in Cloudinary.
   - *(Optional)* `CLOUDINARY_API_KEY`: For media storage in Cloudinary.
   - *(Optional)* `CLOUDINARY_API_SECRET`: For media storage in Cloudinary.
6. Click **Deploy Web Service**. 
7. Once deployed, copy your backend service URL (e.g., `https://gminsta-backend.onrender.com`).

---

## Step 3: Deploy the Frontend on Vercel

The frontend has a pre-configured [vercel.json](file:///client/vercel.json) file that automatically forwards all client-side routes (React Router DOM) to `index.html` to prevent 404 errors on page refreshes.

1. Go to [Vercel.com](https://vercel.com) and log in using your GitHub account.
2. Click **Add New** > **Project**.
3. Import your `gminsta` repository from the list.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `client` (Vercel will build and serve from this sub-directory).
5. Expand the **Build and Development Settings** (leave as default):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Expand the **Environment Variables** section and add:
   - `VITE_API_URL`: Your deployed backend URL from Step 2 (e.g., `https://gminsta-backend.onrender.com` without a trailing `/` or `/api`).
7. Click **Deploy**. Vercel will build your React application and generate a public live URL.

---

## How It Works Under the Hood

- **API Calls**: The client API service dynamically reads `import.meta.env.VITE_API_URL`. In production on Vercel, requests are sent to `https://gminsta-backend.onrender.com/api/...`. In development, it defaults to proxying `/api` locally on `http://localhost:5000`.
- **WebSockets**: The client establishes WebSocket connection to the backend using `VITE_API_URL`, supporting real-time chat, notifications, and typing indicators.
- **Local Fallbacks**: If Cloudinary and SMTP credentials are not supplied to the server, uploads fall back to the backend disk, and reset emails are logged to the backend server terminal output.
