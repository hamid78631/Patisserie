import { config } from '../config.js';

/**
 * Envoi de SMS (Twilio) et de courriels (Resend) via leur API REST.
 * Sans clés configurées, les messages sont affichés dans la console.
 * Les erreurs d'envoi sont journalisées mais ne bloquent jamais une commande.
 */

export async function sendSms(to, body) {
  if (!to) return;
  const { accountSid, authToken, from } = config.twilio;
  if (!accountSid || !authToken || !from) {
    console.log(`[SMS simulé] → ${to}: ${body}`);
    return;
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: normalizePhone(to), From: from, Body: body }),
    });
    if (!res.ok) console.error('Twilio', res.status, await res.text());
  } catch (err) {
    console.error('Échec SMS', err.message);
  }
}

/** Courriels simulés récents (mode sans clé Resend) : utiles pour les tests. */
export const simulatedEmails = [];

export async function sendEmail(to, subject, html) {
  if (!to) return;
  if (!config.resend.apiKey) {
    simulatedEmails.push({ to, subject, html });
    if (simulatedEmails.length > 50) simulatedEmails.shift();
    // Les liens sont affichés pour pouvoir tester le parcours (suivi, admin) sans courriel réel
    const liens = [...String(html).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    console.log(`[Courriel simulé] → ${to}: ${subject}${liens.length ? ` | ${liens.join(' ')}` : ''}`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resend.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: config.resend.from, to, subject, html }),
    });
    if (!res.ok) console.error('Resend', res.status, await res.text());
  } catch (err) {
    console.error('Échec courriel', err.message);
  }
}

/** Numéros canadiens : « 418 555-1234 » → « +14185551234 » */
export function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

export const money = (cents, locale = 'fr') =>
  new Intl.NumberFormat(locale === 'en' ? 'en-CA' : 'fr-CA', { style: 'currency', currency: 'CAD' }).format(
    cents / 100,
  );
