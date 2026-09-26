/*
 * Confirmation et suivi d'une commande (/commande/:numero?t=jeton).
 * Ce chemin est utilisé dans les courriels envoyés par l'API : ne pas le changer.
 * Accès par le jeton de suivi, ou par la session du client propriétaire.
 */
import { useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarCheck, Check, CheckCircle2, Clock, Copy, Landmark, Store, Truck } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import Field from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { useToast } from '../components/Toasts.jsx';
import { brand } from '../config/brand.js';
import { useSettings } from '../hooks/queries.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { api } from '../lib/api.js';
import { useFormat } from '../lib/format.js';
import styles from './Commande.module.css';

const ETAPES = ['received', 'confirmed', 'in_preparation', 'ready', 'completed'];
const ATTENTE_MAX = 20 * 1000; // après un paiement Stripe : interroger l'API 20 s au plus

export default function Commande() {
  const { numero } = useParams();
  const [params] = useSearchParams();
  const jeton = params.get('t') || '';
  const { t } = useTranslation();
  const debut = useRef(Date.now());

  const commande = useQuery({
    queryKey: ['order', numero, jeton],
    queryFn: () => api(`/orders/track/${encodeURIComponent(numero)}${jeton ? `?t=${encodeURIComponent(jeton)}` : ''}`),
    retry: (n, err) => err?.status !== 404 && n < 2,
    // En attente du webhook Stripe : toutes les 2 s, pendant 20 s au maximum
    refetchInterval: (q) => (q.state.data?.status === 'pending_payment' && Date.now() - debut.current < ATTENTE_MAX ? 2000 : false),
  });
  usePageMeta({ title: t('order.seoTitle', { number: numero }) });

  if (commande.isLoading) {
    return (
      <div className="container page" aria-busy="true">
        <span className="skeleton" style={{ height: 40, width: '60%', marginBottom: 24 }} />
        <span className="skeleton" style={{ height: 240 }} />
      </div>
    );
  }
  if (commande.error?.status === 404) {
    return (
      <div className="container page">
        <EmptyState title={t('order.notFound')} text={t('order.notFoundText')} action={t('order.continue')} to="/boutique" headingLevel={1} />
      </div>
    );
  }
  if (commande.isError) {
    return (
      <div className="container page">
        <ErrorState onRetry={() => commande.refetch()} />
      </div>
    );
  }
  return <Suivi order={commande.data} jeton={jeton} cleRequete={['order', numero, jeton]} />;
}

function Suivi({ order, jeton, cleRequete }) {
  const { t } = useTranslation();
  const { money, text, lang } = useFormat();
  const location = useLocation();
  const { data: settings } = useSettings();
  const nouvelle = location.state?.nouvelle;
  const [annulation, setAnnulation] = useState(false);

  const locale = lang === 'en' ? 'en-CA' : 'fr-CA';
  const date = (d, style = {}) => new Intl.DateTimeFormat(locale, { timeZone: 'America/Toronto', ...style }).format(new Date(d));
  const annulee = order.status === 'cancelled';
  const p = order.payment;
  const interacAttendu = p.method === 'interac' && p.status === 'awaiting_transfer' && !annulee;
  const a = order.fulfillment?.address;
  const courriel = settings?.publicEmail || brand.email;
  const telephone = settings?.publicPhone || brand.phone;

  return (
    <div className={`container page ${styles.page}`}>
      <div className={styles.entete}>
        <h1>{t('order.title', { number: order.number })}</h1>
        <p className="muted">{t('order.placedOn', { date: date(order.createdAt, { dateStyle: 'long', timeStyle: 'short' }) })}</p>
      </div>

      {/* Messages d'état ------------------------------------------------------------ */}
      {nouvelle && !annulee && order.status !== 'pending_payment' && (
        <div className="notice notice-success" role="status">
          <CheckCircle2 size={20} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p>{t('order.thanks')}</p>
            <p>{t('order.thanksSaved')}</p>
          </div>
        </div>
      )}
      {order.status === 'pending_payment' && p.status !== 'failed' && (
        <p className="notice notice-info" role="status">
          <Clock size={20} strokeWidth={1.5} aria-hidden="true" />
          {t('order.waitingPayment')}
        </p>
      )}
      {p.status === 'failed' && (
        <p className="notice notice-error" role="alert">
          <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
          {t('order.paymentFailed')}
        </p>
      )}
      {annulee && (
        <div className={styles.annulee} role="status">
          <h2>{t('order.cancelledTitle')}</h2>
          {p.status === 'voided' && <p>{t('order.cancelledCardVoided')}</p>}
          {p.refundedAmount > 0 && <p>{t('order.cancelledRefunded', { amount: money(p.refundedAmount) })}</p>}
        </div>
      )}

      <div className={styles.grille}>
        <div className={styles.colonne}>
          {/* Instructions Interac (action attendue du client : en premier) --------------------------------------------------- */}
          {interacAttendu && (
            <section className={`${styles.bloc} ${styles.interac}`} aria-labelledby="interac-titre">
              <h2 id="interac-titre" className={styles.titreBloc}>
                <Landmark size={24} strokeWidth={1.5} aria-hidden="true" />
                {t('order.interacTitle')}
              </h2>
              {settings?.interacEmail ? (
                <ol className={styles.consignes}>
                  <li>
                    <Trans i18nKey="order.interacStep1" values={{ amount: money(order.pricing.amountDue) }} components={{ 1: <strong /> }} />
                  </li>
                  <li>
                    <Trans i18nKey="order.interacStep2" values={{ email: settings.interacEmail }} components={{ 1: <strong /> }} />
                    <Copier valeur={settings.interacEmail} />
                  </li>
                  <li>
                    <Trans i18nKey="order.interacStep3" values={{ number: order.number }} components={{ 1: <strong /> }} />
                    <Copier valeur={order.number} />
                  </li>
                </ol>
              ) : (
                <p>{t('order.interacMissing')}</p>
              )}
              <p className="small muted">{t('order.interacTip')}</p>
            </section>
          )}

          {/* Frise des statuts ---------------------------------------------------------- */}
          {!annulee && order.status !== 'pending_payment' && (
            <section className={styles.bloc} aria-labelledby="suivi-titre">
              <h2 id="suivi-titre" className={styles.titreBloc}>
                {t('order.status')}
              </h2>
              <Frise statut={order.status} />
              <p className={styles.date}>
                <CalendarCheck size={20} strokeWidth={1.5} aria-hidden="true" />
                {order.scheduledFor
                  ? t('order.scheduled', { date: date(order.scheduledFor, { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) })
                  : t('order.notScheduled')}
              </p>
            </section>
          )}

          {/* Articles --------------------------------------------------------------------- */}
          <section className={styles.bloc} aria-labelledby="articles-titre">
            <h2 id="articles-titre" className={styles.titreBloc}>
              {t('order.items')}
            </h2>
            <ul className={styles.articles}>
              {order.items.map((i) => (
                <li key={i._id}>
                  <span>
                    {i.quantity} × {text(i.productName)} <span className="muted">— {text(i.variantLabel)}</span>
                    {i.message && <span className={styles.message}>« {i.message} »</span>}
                  </span>
                  <span className="price">{money(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className={styles.montants}>
              <Ligne label={t('checkout.subtotal')} valeur={money(order.pricing.subtotal)} />
              {order.pricing.discount > 0 && <Ligne label={`${t('checkout.discount')}${order.promoCode ? ` (${order.promoCode})` : ''}`} valeur={`− ${money(order.pricing.discount)}`} />}
              {order.fulfillment.type !== 'none' && (
                <Ligne label={t('checkout.deliveryFee')} valeur={order.pricing.deliveryFee ? money(order.pricing.deliveryFee) : t('checkout.free')} />
              )}
              {order.pricing.gst > 0 && <Ligne label={t('checkout.gst')} valeur={money(order.pricing.gst)} />}
              {order.pricing.qst > 0 && <Ligne label={t('checkout.qst')} valeur={money(order.pricing.qst)} />}
              {order.pricing.giftCardApplied > 0 && <Ligne label={t('checkout.giftCardApplied')} valeur={`− ${money(order.pricing.giftCardApplied)}`} />}
              <Ligne label={t('checkout.amountDue')} valeur={money(order.pricing.amountDue)} fort />
            </dl>
          </section>
        </div>

        <div className={styles.colonne}>
          <section className={styles.bloc} aria-labelledby="reception-titre">
            <h2 id="reception-titre" className={styles.titreBloc}>
              {t('order.reception')}
            </h2>
            {order.fulfillment.type === 'delivery' && (
              <p className={styles.info}>
                <Truck size={20} strokeWidth={1.5} aria-hidden="true" />
                {t('order.deliveryTo', { address: [a?.line1, a?.line2, a?.city, a?.postalCode].filter(Boolean).join(', ') })}
              </p>
            )}
            {order.fulfillment.type === 'pickup' && (
              <p className={styles.info}>
                <Store size={20} strokeWidth={1.5} aria-hidden="true" />
                {t('order.pickupIn', { city: settings?.pickupCity || 'Québec' })}
              </p>
            )}
            {order.fulfillment.type === 'none' && <p>{t('order.giftCardsOnly')}</p>}
            {order.customerNotes && (
              <>
                <h3 className={styles.sousTitre}>{t('order.notes')}</h3>
                <p className={styles.notes}>{order.customerNotes}</p>
              </>
            )}
          </section>

          <section className={styles.bloc} aria-labelledby="paiement-titre">
            <h2 id="paiement-titre" className={styles.titreBloc}>
              {t('order.payment')}
            </h2>
            <p>{t(`methods.${p.method}`)}</p>
            <p className="muted small">{t(`paymentStatuses.${p.status}`)}</p>
          </section>

          {order.canCancel && (
            <button type="button" className="btn btn-secondary btn-block" onClick={() => setAnnulation(true)}>
              {t('order.cancel')}
            </button>
          )}
          <p className="small muted">{t('order.contact', { email: courriel, phone: telephone })}</p>
          <Link to="/boutique" className="btn btn-ghost">
            {t('order.continue')}
          </Link>
        </div>
      </div>

      <Annulation open={annulation} onClose={() => setAnnulation(false)} order={order} jeton={jeton} cleRequete={cleRequete} />
    </div>
  );
}

/** Frise : Reçue → Confirmée → En préparation → Prête → Terminée (verticale sur mobile). */
function Frise({ statut }) {
  const { t } = useTranslation();
  const actuel = ETAPES.indexOf(statut);
  return (
    <ol className={styles.frise}>
      {ETAPES.map((etape, i) => {
        const etat = i < actuel || statut === 'completed' ? 'fait' : i === actuel ? 'actuel' : 'avenir';
        return (
          <li key={etape} className={styles[etat]} aria-current={etat === 'actuel' ? 'step' : undefined}>
            <span className={styles.pastille} aria-hidden="true">
              {etat === 'fait' && <Check size={16} strokeWidth={2} />}
            </span>
            <span className={styles.libelle}>{t(`statuses.${etape}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Copier({ valeur }) {
  const { t } = useTranslation();
  const [copie, setCopie] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-ghost ${styles.copier}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valeur);
          setCopie(true);
          setTimeout(() => setCopie(false), 2000);
        } catch {
          /* presse-papiers indisponible */
        }
      }}
    >
      {copie ? <Check size={16} strokeWidth={1.5} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.5} aria-hidden="true" />}
      {copie ? t('order.copied') : t('order.copy')}
    </button>
  );
}

function Annulation({ open, onClose, order, jeton, cleRequete }) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [motif, setMotif] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function annuler() {
    setEnvoi(true);
    try {
      const mise = await api(`/orders/track/${encodeURIComponent(order.number)}/cancel`, {
        method: 'POST',
        body: { token: jeton || undefined, reason: motif.trim() || undefined },
      });
      queryClient.setQueryData(cleRequete, mise);
      toast.show(t('order.cancelled'));
      onClose();
    } catch (err) {
      toast.show(t(`errors.${err.code}`, { defaultValue: t('errors.server_error') }), { type: 'error' });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('order.cancelTitle')}>
      <p>{t('order.cancelText')}</p>
      <Field id="motif" as="textarea" rows={3} maxLength={500} label={t('order.cancelReason')} value={motif} onChange={(e) => setMotif(e.target.value)} />
      <div className={styles.actionsModale}>
        <button type="button" className="btn btn-primary" onClick={annuler} disabled={envoi}>
          {t('order.cancelConfirm')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose} data-autofocus>
          {t('order.cancelKeep')}
        </button>
      </div>
    </Modal>
  );
}

function Ligne({ label, valeur, fort = false }) {
  return (
    <div className={fort ? styles.ligneForte : styles.ligne}>
      <dt>{label}</dt>
      <dd className="price">{valeur}</dd>
    </div>
  );
}
