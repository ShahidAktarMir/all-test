# Neuro Exam - Super Ultimate Edition 🚀

[![CI/CD Pipeline](https://github.com/ShahidAktarMir/all-test/actions/workflows/ci.yml/badge.svg)](https://github.com/ShahidAktarMir/all-test/actions/workflows/ci.yml)
[![Docker Build](https://github.com/ShahidAktarMir/all-test/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/ShahidAktarMir/all-test/actions/workflows/docker-publish.yml)

A production-grade, enterprise-level exam platform with advanced analytics, AI-powered insights, and a premium glassmorphism UI.

## ✨ Features

- 🎯 **Multi-Format Parser**: Supports JSON, CSV, TXT, PDF, DOCX, and image-based question extraction
- 📊 **Advanced Analytics**: Topic proficiency matrix with AI-generated tactical insights
- 🔄 **Smart Re-attempt System**: Full exam, mistakes-only, or unattempted questions
- 🎨 **Premium UI/UX**: Glassmorphism design with smooth animations
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop
- 💾 **State Persistence**: Auto-save progress with localStorage
- 🏗️ **Production-Ready**: Docker, CI/CD, and cloud deployment configured

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t neuro-exam .
docker run -p 3000:80 neuro-exam
```

## 🏗️ Architecture

- **Framework**: React 19 + TypeScript + Vite
- **State Management**: Zustand (atomic slices pattern)
- **Styling**: Tailwind CSS 4 + Framer Motion
- **Parsing Engine**: Strategy pattern with Lexical + JSON strategies
- **Analytics**: Custom engine with performance metrics
- **Deployment**: Vercel / Docker / GitHub Pages ready

## 📦 DevOps

- ✅ **CI/CD**: Automated testing, linting, and building via GitHub Actions
- 🐳 **Containerization**: Multi-stage Docker builds with health checks
- 🔒 **Security**: HTTPS headers, CSP, and XSS protection
- ⚡ **Performance**: Nginx caching, Gzip compression, lazy loading
- 📈 **Monitoring**: Health check endpoints for uptime monitoring

## 🛠️ Tech Stack

- React 19.2 + TypeScript 5.9
- Vite 7 + Tailwind CSS 4
- Zustand 5 + Framer Motion 12
- Tesseract.js (OCR) + PDF.js
- jsPDF + Recharts
- ESLint + Prettier + Husky

## 📄 License

MIT

---

Built with 💜 by a 100+ year Senior DevOps Engineer
