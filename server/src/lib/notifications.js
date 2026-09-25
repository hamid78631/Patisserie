import { config } from '../config.js';
import { Settings } from '../models/index.js';
import { money, sendEmail, sendSms } from './messaging.js';

/**
 * Notifications liées aux commandes, en français ou en anglais
 * selon la langue choisie par le client au moment de la commande.
 */

const t = {
  received: {
    fr: (o) =>
      `Merci ${o.customer.name} ! Nous avons bien reçu votre commande ${o.number}. Nous vous contacterons sous peu pour convenir de la date.`,
    en: (o) =>
      `Thank you ${o.customer.name}! We received your order ${o.number}. We will contact you shortly to schedule it.`,
  },
  confirmed: {
    fr: (o) => `Votre commande ${o.number} est confirmée${o.scheduledFor ? ` pour le ${fmtDate(o.scheduledFor, 'fr')}` : ''}.`,
    en: (o) => `Your order ${o.number} is confirmed${o.scheduledFor ? ` for ${fmtDate(o.scheduledFor, 'en')}` : ''}.`,
  },
  ready: {
    fr: (o) =>
      o.fulfillment.type === 'pickup'
        ? `Votre commande ${o.number} est prête pour la cueillette !`
        : `Votre commande ${o.number} est prête et partira bientôt en livraison !`,
    en: (o) =>
      o.fulfillment.type === 'pickup'
        ? `Your order ${o.number} is ready for pickup!`
        : `Your order ${o.number} is ready and will be delivered soon!`,
  },
  cancelled: {
    fr: (o) => `Votre commande ${o.number} a été annulée.${refundLine(o, 'fr')}`,
    en: (o) => `Your order ${o.number} has been cancelled.${refundLine(o, 'en')}`,
  },
};

function refundLine(o, lang) {
  if (o.payment.status === 'voided') {
    return lang === 'fr' ? ' Votre carte n’a pas été débitée.' : ' Your card was not charged.';
  }
  if (o.payment.refundedAmount > 0) {
    return lang === 'fr'
      ? ` Un remboursement de ${money(o.payment.refundedAmount, 'fr')} a été émis.`
      : ` A refund of ${money(o.payment.refundedAmount, 'en')} has been issued.`;
  }
  return '';
}

function fmtDate(d, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-CA' : 'fr-CA', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(d);
}

const trackingUrl = (o, token) => `${config.publicSiteUrl}/commande/${o.number}${token ? `?t=${token}` : ''}`;

function emailLayout(title, body, link) {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;color:#3b2a20">
    <h2 style="font-weight:normal">${title}</h2><p>${body}</p>
    ${link ? `<p><a href="${link}" style="color:#9a4e2f">${link}</a></p>` : ''}
  </div>`;
}

function itemsTable(o) {
  const lang = o.locale;
  const rows = o.items
    .map(
      (i) =>
        `<tr><td>${i.quantity} × ${i.productName[lang] || i.productName.fr} (${i.variantLabel[lang] || i.variantLabel.fr})${
          i.message ? `<br><em>« ${escapeHtml(i.message)} »</em>` : ''
        }</td><td style="text-align:right">${money(i.lineTotal, lang)}</td></tr>`,
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse">${rows}
    <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${money(o.pricing.total, lang)}</strong></td></tr></table>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Envoie les notifications correspondant à un événement. Ne lève jamais d'erreur. */
export async function notifyOrder(event, order, { trackingToken, interacEmail } = {}) {
  try {
    const lang = order.locale || 'fr';
    const text = t[event]?.[lang]?.(order);
    if (!text) return;
    const link = trackingUrl(order, trackingToken);

    let emailBody = text;
    if (event === 'received') {
      emailBody += itemsTable(order);
      if (order.payment.method === 'interac' && order.payment.status === 'awaiting_transfer') {
        emailBody +=
          lang === 'fr'
            ? `<p>Pour payer, envoyez un virement Interac de <strong>${money(order.pricing.amountDue, lang)}</strong> à <strong>${interacEmail}</strong> avec le message <strong>${order.number}</strong>.</p>`
            : `<p>To pay, send an Interac e-Transfer of <strong>${money(order.pricing.amountDue, lang)}</strong> to <strong>${interacEmail}</strong> with the message <strong>${order.number}</strong>.</p>`;
      }
    }

    const tasks = [sendEmail(order.customer.email, subjectFor(event, order, lang), emailLayout(subjectFor(event, order, lang), emailBody, link))];
    // SMS pour les étapes clés uniquement
    if (['received', 'confirmed', 'ready'].includes(event)) tasks.push(sendSms(order.customer.phone, text));

    // Alerte à l'équipe
    if (event === 'received' || (event === 'cancelled' && order.statusHistory.at(-1)?.by === 'customer')) {
      const settings = await Settings.get();
      const alert =
        event === 'received'
          ? `Nouvelle commande ${order.number} — ${order.customer.name} — ${money(order.pricing.total)} (${order.payment.method})`
          : `Commande ${order.number} annulée par le client`;
      tasks.push(sendSms(settings.notificationPhone, alert));
      tasks.push(sendEmail(settings.notificationEmail, alert, emailLayout(alert, itemsTable(order), `${config.publicSiteUrl}/admin/commandes/${order._id}`)));
    }
    await Promise.all(tasks);
  } catch (err) {
    console.error('Notification échouée', event, order?.number, err);
  }
}

function subjectFor(event, o, lang) {
  const s = {
    received: { fr: `Commande ${o.number} reçue`, en: `Order ${o.number} received` },
    confirmed: { fr: `Commande ${o.number} confirmée`, en: `Order ${o.number} confirmed` },
    ready: { fr: `Commande ${o.number} prête`, en: `Order ${o.number} ready` },
    cancelled: { fr: `Commande ${o.number} annulée`, en: `Order ${o.number} cancelled` },
  };
  return s[event][lang];
}

export async function notifyGiftCard(card, order) {
  const lang = order.locale || 'fr';
  const title = lang === 'fr' ? 'Votre carte-cadeau' : 'Your gift card';
  const body =
    lang === 'fr'
      ? `Voici votre carte-cadeau d'une valeur de <strong>${money(card.initialBalance, lang)}</strong> : <strong style="font-size:1.3em">${card.code}</strong>`
      : `Here is your gift card worth <strong>${money(card.initialBalance, lang)}</strong>: <strong style="font-size:1.3em">${card.code}</strong>`;
  await sendEmail(card.recipientEmail || order.customer.email, title, emailLayout(title, body, config.publicSiteUrl));
}
