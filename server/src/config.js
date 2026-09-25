import 'dotenv/config';

const env = process.env;

export const config = {
  env: env.NODE_ENV || 'development',
  isProd: env.NODE_ENV === 'production',
  port: Number(env.PORT) || 4000,
  mongoUri: env.MONGODB_URI || 'mongodb://127.0.0.1:27017/patisserie',
  // Origines autorisées pour CORS, séparées par des virgules
  clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  publicSiteUrl: env.PUBLIC_SITE_URL || 'http://localhost:5173',

  jwtSecret: env.JWT_SECRET || 'dev-only-change-me',
  // 'lax' si le frontend et l'API partagent le même domaine (www. / api.), sinon 'none'
  cookieSameSite: env.COOKIE_SAMESITE || 'lax',

  stripe: {
    secretKey: env.STRIPE_SECRET_KEY || '',
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
  },
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID || '',
    authToken: env.TWILIO_AUTH_TOKEN || '',
    from: env.TWILIO_FROM || '',
  },
  resend: {
    apiKey: env.RESEND_API_KEY || '',
    from: env.EMAIL_FROM || 'Pâtisserie <commandes@example.com>',
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: env.CLOUDINARY_API_KEY || '',
    apiSecret: env.CLOUDINARY_API_SECRET || '',
  },
};

if (config.isProd && config.jwtSecret === 'dev-only-change-me') {
  throw new Error('JWT_SECRET doit être défini en production');
}
