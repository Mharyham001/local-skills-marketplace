# Local Skills Marketplace

A simple full-stack website that connects artisans (plumbers, electricians, tailors, etc.) with nearby customers.

## Features
- Browse artisans by skill and location
- Register as a customer or artisan
- Login system with JWT authentication
- Artisan profile editing dashboard
- Responsive frontend
- Simple JSON file storage for easy demo deployment

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Storage: JSON file (`data/db.json`)

## Run locally
```bash
npm install
npm start
```
Then open `http://localhost:3000`

## Demo Accounts
- Email: `plumber@example.com`
- Password: `password123`

## Deploy on Render
1. Upload the project to GitHub.
2. Go to Render and create a **New Web Service**.
3. Connect your GitHub repository.
4. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add an environment variable:
   - `JWT_SECRET=yourStrongSecret`
6. Deploy.

## Backend platform link to submit
After deployment, you can share:
- The website live link from Render
- The GitHub repository link containing your backend and frontend code

## Important note
This project uses file-based storage. For a class assignment and demo, it is fine. For production, switch to MongoDB, PostgreSQL, or MySQL.
