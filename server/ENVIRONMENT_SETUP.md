# 🌍 Environment Configuration Guide

## 📁 Environment Files Structure

Your server now supports multiple environment configurations:

```
server/
├── .env.developement     # Development environment
├── .env.production      # Production environment
└── .env.example         # Template file
```

## 🚀 How It Works

The server automatically loads the correct environment file based on `NODE_ENV`:

- **Development**: Loads `.env.developement`
- **Production**: Loads `.env.production`
- **Default**: Loads `.env` (if no NODE_ENV is set)

## 💻 Running the Server

### For Development (Windows):
```bash
npm run dev:win
# or
npm run start:dev:win
```

### For Development (Linux/Mac):
```bash
npm run dev
# or
npm run start:dev
```

### For Production (Windows):
```bash
npm run start:win
```

### For Production (Linux/Mac):
```bash
npm run start
```

## 🔧 Environment Configuration

### Development (`.env.developement`)
```env
NODE_ENV=development
PORT=3050
MONGODB_URI=mongodb://localhost:27017/yarnflow
JWT_SECRET=vishalsinh_development_secret_key
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=debug
```

### Production (`.env.production`)
**Update these values for your production deployment:**
```env
NODE_ENV=production
PORT=3020
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/yarnflow
JWT_SECRET=your_super_secure_production_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://your-frontend-domain.com
LOG_LEVEL=info
```

## 🗄️ Database Configuration

### Development Database
- Uses local MongoDB: `mongodb://localhost:27017/yarnflow`
- Make sure MongoDB is running locally

### Production Database
1. **MongoDB Atlas** (Recommended):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yarnflow
   ```

2. **Other Cloud Providers**:
   ```
   MONGODB_URI=mongodb://username:password@host:port/yarnflow
   ```

## 🔐 Security Best Practices

### JWT Secret
- **Development**: Can be simple for testing
- **Production**: Must be at least 32 characters, random and secure

### CORS Origins
- **Development**: Allow localhost origins
- **Production**: Only allow your actual frontend domain(s)

## 🚀 Deployment Steps

### 1. Update Production Environment
Edit `.env.production` with your actual values:
```env
MONGODB_URI=your_actual_database_url
JWT_SECRET=your_actual_secure_secret
ALLOWED_ORIGINS=https://your-actual-frontend-domain.com
```

### 2. Deploy to Platform

#### Heroku:
```bash
heroku config:set NODE_ENV=production
# The app will automatically use .env.production
```

#### Railway/Render:
- Set `NODE_ENV=production` in platform environment variables
- Upload your `.env.production` file or set variables manually

#### Manual Server:
```bash
NODE_ENV=production npm start
```

## 🧪 Testing Your Configuration

### Check Environment Loading:
```bash
npm run dev:win
```
You should see: `🌍 Loading environment: development`

### Check Database Connection:
Look for: `✅ Database connected successfully to: localhost`

### Check Port:
Server should start on the port specified in your environment file.

## 🐛 Troubleshooting

### Environment Not Loading:
1. Check file names match exactly (`.env.developement` not `.env.development`)
2. Ensure NODE_ENV is set correctly
3. Check for syntax errors in .env files

### Database Connection Issues:
1. Verify MONGODB_URI format
2. Check database credentials
3. Ensure database server is running

### Port Conflicts:
1. Change PORT in your environment file
2. Ensure no other service is using the port

## 📝 Quick Commands

```bash
# Development with hot reload
npm run dev:win

# Production mode locally
npm run start:win

# Check which environment is loaded
# Look for: "🌍 Loading environment: [environment]"
```

Your server is now properly configured for multiple environments! 🎉
