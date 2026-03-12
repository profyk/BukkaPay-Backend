import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from "./stripe-client";
import { WebhookHandlers } from "./stripe-webhooks";

if (process.env.SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = process.env.SUPABASE_URL;
}
if (process.env.SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}

const app = express();
const httpServer = createServer(app);

app.use(cors());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Initialize Stripe on startup
async function initStripe() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn('[stripe] DATABASE_URL not set, skipping Stripe initialization');
      return;
    }

    console.log('[stripe] Initializing schema...');
    await runMigrations({ databaseUrl });
    console.log('[stripe] Schema ready');

    let stripeSync;
    try {
      stripeSync = await getStripeSync();
    } catch (err: any) {
      console.warn('[stripe] Stripe connection not configured, skipping sync:', err.message);
      return;
    }
    
    console.log('[stripe] Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      { enabled_events: ['*'], description: 'BukkaPay Stripe sync' }
    );
    console.log(`[stripe] Webhook configured: ${webhook.url}`);

    console.log('[stripe] Syncing data...');
    stripeSync.syncBackfill()
      .then(() => console.log('[stripe] Data synced'))
      .catch((err: any) => console.error('[stripe] Sync error:', err));
  } catch (error: any) {
    console.warn('[stripe] Init error (non-fatal):', error.message);
  }
}

// Register Stripe webhook BEFORE express.json()
app.post(
  '/api/stripe/webhook/:uuid',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ error: 'Missing signature' });

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      const { uuid } = req.params;
      
      if (!Buffer.isBuffer(req.body)) {
        return res.status(500).json({ error: 'Invalid payload' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig, uuid);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[stripe] Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await initStripe();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  app.get("/", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BukkaPay - Smart Mobile Wallet</title>
  <meta name="description" content="BukkaPay is a modern mobile wallet for smart budgeting, fast P2P payments, QR code scanning, and more.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #001A72; color: #FFFFFF; min-height: 100vh; overflow-x: hidden; }
    .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 40px 24px; }
    .hero::before { content: ''; position: absolute; top: -120px; right: -120px; width: 400px; height: 400px; background: rgba(124, 58, 237, 0.15); border-radius: 50%; filter: blur(80px); }
    .hero::after { content: ''; position: absolute; bottom: -80px; left: -80px; width: 300px; height: 300px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; filter: blur(60px); }
    .content { position: relative; z-index: 1; text-align: center; max-width: 600px; }
    .logo-wrap { width: 96px; height: 96px; margin: 0 auto 28px; background: rgba(255,255,255,0.1); border-radius: 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15); }
    .logo-wrap svg { width: 52px; height: 52px; }
    h1 { font-size: 44px; font-weight: 800; letter-spacing: -1px; margin-bottom: 12px; background: linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .tagline { font-size: 18px; color: rgba(255,255,255,0.7); margin-bottom: 40px; line-height: 1.6; max-width: 440px; margin-left: auto; margin-right: auto; }
    .status-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); color: #34D399; padding: 10px 20px; border-radius: 24px; font-size: 14px; font-weight: 600; margin-bottom: 48px; border: 1px solid rgba(16, 185, 129, 0.25); }
    .status-dot { width: 8px; height: 8px; background: #10B981; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 48px; width: 100%; }
    .feature { background: rgba(255,255,255,0.06); border-radius: 16px; padding: 24px 16px; text-align: center; border: 1px solid rgba(255,255,255,0.08); transition: transform 0.2s, background 0.2s; }
    .feature:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
    .feature-icon { font-size: 28px; margin-bottom: 10px; display: block; }
    .feature-title { font-size: 14px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px; }
    .feature-desc { font-size: 12px; color: rgba(255,255,255,0.5); }
    .cta-row { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 48px; }
    .btn { padding: 14px 32px; border-radius: 14px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.15s; }
    .btn:hover { transform: translateY(-1px); }
    .btn-primary { background: #7C3AED; color: #FFFFFF; border: none; }
    .btn-outline { background: transparent; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.25); }
    .api-info { background: rgba(255,255,255,0.06); border-radius: 14px; padding: 20px 28px; border: 1px solid rgba(255,255,255,0.08); display: inline-flex; align-items: center; gap: 12px; }
    .api-info code { background: rgba(124, 58, 237, 0.25); padding: 4px 10px; border-radius: 6px; font-size: 13px; color: #C4B5FD; }
    .api-info span { color: rgba(255,255,255,0.6); font-size: 14px; }
    .footer { padding: 24px; text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; position: relative; z-index: 1; }
    @media (max-width: 480px) { h1 { font-size: 32px; } .tagline { font-size: 16px; } .features { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body>
  <div class="hero">
    <div class="content">
      <div class="logo-wrap">
        <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="44" height="44" rx="12" fill="#7C3AED"/>
          <text x="26" y="34" text-anchor="middle" fill="white" font-size="26" font-weight="800" font-family="-apple-system, sans-serif">B</text>
        </svg>
      </div>
      <h1>BukkaPay</h1>
      <p class="tagline">Your smart mobile wallet for fast payments, budgeting cards, and seamless money transfers.</p>
      <div class="status-pill"><span class="status-dot"></span> API Running</div>
      <div class="features">
        <div class="feature">
          <span class="feature-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </span>
          <div class="feature-title">Wallet Cards</div>
          <div class="feature-desc">Smart budgeting</div>
        </div>
        <div class="feature">
          <span class="feature-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </span>
          <div class="feature-title">QR Payments</div>
          <div class="feature-desc">Scan & pay instantly</div>
        </div>
        <div class="feature">
          <span class="feature-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </span>
          <div class="feature-title">Transfers</div>
          <div class="feature-desc">Send money fast</div>
        </div>
        <div class="feature">
          <span class="feature-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </span>
          <div class="feature-title">Rewards</div>
          <div class="feature-desc">Earn loyalty points</div>
        </div>
      </div>
      <div class="cta-row">
        <a href="https://expo.dev/accounts/profy/projects/bukkapay" class="btn btn-primary">Download App</a>
        <a href="/api" class="btn btn-outline">API Docs</a>
      </div>
      <div class="api-info">
        <span>API Base</span>
        <code>/api/*</code>
      </div>
    </div>
  </div>
  <div class="footer">&copy; ${new Date().getFullYear()} BukkaPay. All rights reserved.</div>
</body>
</html>`);
  });

  log("Running as API-only server (mobile backend)");

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
