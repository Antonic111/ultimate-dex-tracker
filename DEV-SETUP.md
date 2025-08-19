# 🚀 Development Environment Setup

## 🎯 **Goal**
Set up your local development environment so you can test changes without the server crashing due to missing email API keys.

## 📁 **Files Modified**
- ✅ `server/utils/sendCodeEmail.js` - Added development mode handling
- ✅ `setup-dev-env.bat` - Windows batch file for setup
- ✅ `setup-dev-env.ps1` - PowerShell script for setup

## 🛠️ **Setup Options**

### **Option A: Run Setup Script (Recommended)**
```bash
# Windows Command Prompt
setup-dev-env.bat

# PowerShell
.\setup-dev-env.ps1
```

### **Option B: Manual Setup**
1. Create a file named `.env.local` in your project root
2. Add this content:
```bash
# Local Development Environment Variables
NODE_ENV=development
DISABLE_EMAILS=true

# Add any other local environment variables below
# RESEND_API_KEY=your_key_here
# EMAIL_FROM=your_email_here
```

## 🧪 **Testing Your Progress Bars Fix**

### **1. Start Frontend Only (No Server Needed)**
```bash
npm run dev
```
- Opens at `http://localhost:5173/`
- Test UI changes and frontend logic
- Use browser console for debugging

### **2. Start Backend Only (When You Need Server)**
```bash
cd server
npm run dev
```
- Server runs without email API errors
- Mock email responses in development mode
- Full API functionality available

### **3. Start Both (Full Development)**
```bash
# Terminal 1
npm run dev

# Terminal 2
cd server && npm run dev
```

## 🔍 **What Happens in Development Mode**

### **Email Functions:**
- ✅ **No crashes** due to missing API keys
- ✅ **Mock responses** for testing
- ✅ **Console logging** shows what would happen
- ✅ **Full functionality** when you need it

### **Console Output:**
```
[DEV MODE] Email would be sent: Verify Your Account to user@email.com with code 123456
[DEV MODE] Mock email response for email verification
```

## 🎉 **Benefits**

1. **No More Crashes** - Server runs smoothly locally
2. **Faster Development** - Test changes immediately
3. **Safe Testing** - No risk of breaking production
4. **Full Control** - Choose what to test (frontend/backend/both)

## 🚨 **Important Notes**

- **`.env.local`** is for local development only
- **Never commit** this file to git
- **Production** still uses real email services
- **Mock emails** only work in development mode

## 🔧 **Troubleshooting**

### **Server Still Crashes?**
1. Check if `.env.local` file exists
2. Verify `DISABLE_EMAILS=true` is set
3. Restart the server after creating the file

### **Need Real Email Testing?**
1. Comment out the `DISABLE_EMAILS=true` line
2. Add your real API keys
3. Restart the server

## 🎯 **Next Steps**

1. **Run the setup script** to create `.env.local`
2. **Test your progress bars fix** locally
3. **No more deploying to production** for testing!
4. **Develop faster and safer** 🚀

---

**Happy coding! Your local development environment is now bulletproof! 🎉**
