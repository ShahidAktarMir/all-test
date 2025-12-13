# Neuro Exam App

This project is a React-based application consisting of a modern UI/UX, built with Vite and TypeScript. It adheres to strict production-ready standards including CI/CD, containerization, and comprehensive testing.

## 🚀 Features

- **Modern Stack**: React 19, Vite, TypeScript, TailwindCSS v4.
- **Production Ready**: Dockerized with multi-stage builds.
- **Quality Assurance**: Prettier, ESLint, Husky (pre-commit hooks).
- **Testing**: Unit tests (Vitest) and E2E tests (Playwright).
- **CI/CD**: GitHub Actions for automated testing and building.

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

## ✅ Testing

### Unit Tests
Run unit tests with Vitest:
```bash
npm test
# or with UI
npm run test:ui
```

### End-to-End Tests
Run E2E tests with Playwright:
```bash
npx playwright test
```

## 🐳 Docker Support

Build the Docker image:
```bash
docker build -t neuro-exam .
```

Run the container:
```bash
docker run -p 8080:80 neuro-exam
```

Or use Docker Compose:
```bash
docker-compose up -d
```

## 📦 Deployment

The project includes GitHub Actions for:
1. **CI**: Lints, tests, and builds on every push.
2. **Docker**: Builds and pushes Docker image (configuration required).
