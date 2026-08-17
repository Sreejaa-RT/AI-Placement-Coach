import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { analyzeResumeWithAI } from './server/aiAnalyzer.js';

dotenv.config();

function resumeApiPlugin() {
  return {
    name: 'resume-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/analyze-resume' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              console.log(`[Vite API Middleware] Analyzing resume for: ${payload.fileName || 'document'} (${payload.targetRole})`);
              const result = await analyzeResumeWithAI({
                resumeText: payload.resumeText,
                targetRole: payload.targetRole,
                fileName: payload.fileName
              });

              res.setHeader('Content-Type', 'application/json');
              if (!result.success) {
                res.statusCode = result.statusCode || 500;
                res.end(JSON.stringify({ success: false, error: result.error }));
              } else {
                res.statusCode = 200;
                res.end(JSON.stringify(result.data));
              }
            } catch (err) {
              console.error('[Vite API Middleware] Request error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Server middleware parsing error: ' + err.message }));
            }
          });
          return;
        }

        if (req.url === '/api/health' && req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', source: 'vite-dev-server', time: new Date().toISOString() }));
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), resumeApiPlugin()],
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
