# GMinsta - Premium Social Media Platform

GMinsta is a modern, responsive, premium social media application modeled after Instagram.

## Tech Stack
- **Frontend**: React.js with Vite, React Router DOM, Tailwind CSS (v3), Framer Motion, Axios, Socket.io-client.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose ODM), Socket.io, Multer, Cloudinary, Nodemailer, Bcrypt, JWT.

## Setup Instructions

1. **Prerequisites**: Ensure you have Node.js (v18+) and MongoDB running locally or have a MongoDB Atlas connection string.
2. **Installation**:
   Run the following command in the root folder to install all dependencies for the workspace, backend, and frontend:
   ```bash
   npm run install:all
   ```
3. **Environment Setup**:
   Create a `.env` file in the `server/` directory based on the `server/.env.example` template.
4. **Running the Application**:
   Run the following command to start both the backend server and frontend client concurrently:
   ```bash
   npm run dev
   ```

## Development Fallbacks
To allow instant local testing:
- **Uploads**: If Cloudinary credentials are not configured, files will be saved in `server/uploads/` and served statically.
- **Emails**: If SMTP credentials are not configured, password reset tokens and links will be output directly to the server's console.
