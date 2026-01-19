# Production Deployment Guide

## Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Vercel will auto-detect Vite and deploy

## Docker Deployment

### Local Testing
```bash
docker-compose up -d
```
Access at: http://localhost:3000

### Production Deployment
```bash
# Build
docker build -t neuro-exam:latest .

# Run
docker run -d -p 80:80 --name neuro-exam neuro-exam:latest

# Health check
curl http://localhost/health
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neuro-exam
spec:
  replicas: 3
  selector:
    matchLabels:
      app: neuro-exam
  template:
    metadata:
      labels:
        app: neuro-exam
    spec:
      containers:
      - name: neuro-exam
        image: ghcr.io/shahidaktarmir/all-test:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: neuro-exam
spec:
  selector:
    app: neuro-exam
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

## Environment Variables

No environment variables required for basic deployment.

For custom API keys:
- `VITE_GEMINI_API_KEY` - Google Gemini API key (optional)

## Monitoring

- Health endpoint: `/health`
- Returns: `200 OK` with "healthy" text
- Use for uptime monitoring (UptimeRobot, Pingdom, etc.)

## Performance Optimization

- Static assets cached for 1 year
- Gzip compression enabled
- Lazy loading for routes
- Code splitting via Vite

## Security Headers

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
