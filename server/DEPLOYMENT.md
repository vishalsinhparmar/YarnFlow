# YarnFlow Backend Deployment Guide

## 🚀 Environment Configuration

### 1. Create your `.env` file
Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```env
# Server Configuration
PORT=3020
NODE_ENV=production

# Database Configuration - REPLACE WITH YOUR DATABASE URL
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yarnflow

# JWT Configuration - REPLACE WITH SECURE SECRET
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Logging Level
LOG_LEVEL=info
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended for Production)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and replace in `MONGODB_URI`

### Example MongoDB URI formats:
```
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/yarnflow

# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/yarnflow

# MongoDB with authentication
MONGODB_URI=mongodb://username:password@host:port/yarnflow
```

## 🔧 Deployment Platforms

### Heroku
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku config:set MONGODB_URI="your_mongodb_connection_string"
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set NODE_ENV="production"
git push heroku main
```

### Railway
```bash
# Install Railway CLI
railway login
railway init
railway add
# Set environment variables in Railway dashboard
railway deploy
```

### Render
1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy automatically

### DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy

## 🛡️ Security Checklist

- ✅ JWT_SECRET is at least 32 characters long
- ✅ NODE_ENV is set to "production"
- ✅ Database connection uses authentication
- ✅ CORS is configured with specific origins
- ✅ .env file is in .gitignore
- ✅ No sensitive data in code

## 🧪 Testing Your Deployment

### Health Check
```bash
curl https://your-domain.com/
```

Expected response:
```json
{
  "success": true,
  "message": "YarnFlow Server is running",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### API Test
```bash
curl https://your-domain.com/api/master-data/stats
```

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check MONGODB_URI format
   - Verify database credentials
   - Check IP whitelist in MongoDB Atlas

2. **CORS Errors**
   - Update ALLOWED_ORIGINS with your frontend URL
   - Ensure protocol (http/https) matches

3. **Environment Variables Not Loading**
   - Verify .env file exists in server root
   - Check variable names match exactly
   - Restart the server after changes

### Logs
Check application logs for detailed error messages:
```bash
# Heroku
heroku logs --tail

# Railway
railway logs

# PM2 (if using)
pm2 logs
```

## 📝 Production Scripts

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "seed": "node src/utils/seedData.js"
  }
}
```

## 🔄 Continuous Deployment

Set up automatic deployment when you push to your main branch:
1. Connect your repository to your deployment platform
2. Configure build settings
3. Set up environment variables
4. Enable auto-deploy

Your backend is now ready for production deployment! 🎉
