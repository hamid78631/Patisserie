/*
 * Paiement (PROJET.md §7.1) : 1 Réception · 2 Coordonnées · 3 Paiement.
 * Le serveur recalcule tous les montants (POST /api/cart/quote) à chaque changement :
 * le navigateur n'envoie que des identifiants, des quantités et les codes saisis.
 * Mode simulé (sans Stripe) : la commande est directement « Reçue » et on passe au suivi.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CreditCard, Info, Landmark, Store, Truck } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import Field from '../components/Field.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { useToast } from '../components/Toasts.jsx';
import { useMe, useSettings } from '../hooks/queries.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { api } from '../lib/api.js';
import { useFormat } from '../lib/format.js';
import { normalizePostalCode, saveRecentOrder, trackingPath } from '../lib/orders.js';
import styles from './Paiement.module.css';

const NOTES_MAX = 1000;
// Chargé seulement si l'API fonctionne avec de vraies clés Stripe (jamais en mode simulé)
const PaiementCarte = lazy(() => import('./PaiementCarte.jsx'));

export default function Paiement() {
  const { t } = useTranslation();
  const { items } = useCart();
  const [commandeStripe, setCommandeStripe] = useState(null);
  // Commande envoyée : le panier est vidé, il ne faut pas renvoyer vers /panier
  const [envoyee, setEnvoyee] = useState(false);
  usePageMeta({ title: t('checkout.title'), description: t('checkout.seoDescription') });

  // Paiement par carte réel : étape Stripe après la création de la commande
  if (commandeStripe) {
    return (
      <Suspense fallback={<div className="container page" aria-busy="true" />}>
        <PaiementCarte {...commandeStripe} />
      </Suspense>
    );
  }
  if (items.length === 0 && !envoyee) return <Navigate to="/panier" replace />;
  return <Formulaire onStripe={setCommandeStripe} onEnvoyee={() => setEnvoyee(true)} />;
}

function Formulaire({ onStripe, onEnvoyee }) {
  const { t } = useTranslation();
  const { money, text, lang } = useFormat();
  const navigate = useNavigate();
  const toast = useToast();
  const { items, onlyGiftCards, clear } = useCart();
  const { data: settings } = useSettings();
  const { data: user } = useMe();

  const [f, setF] = useState({
    type: '',
    line1: '',
    line2: '',
    city: 'Québec',
    postalCode: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [codes, setCodes] = useState({ promo: '', giftCard: '' });
  const [saisie, setSaisie] = useState({ promo: '', giftCard: '' });
  const [methode, setMethode] = useState('');
  const [conditions, setConditions] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [erreurServeur, setErreurServeur] = useState([]);
  const [envoi, setEnvoi] = useState(false);
  const maj = (champ) => (e) => {
    setF((v) => ({ ...v, [champ]: e.target.value }));
    // L'erreur d'un champ disparaît dès qu'on le corrige
    setErreurs((er) => (er[champ] ? { ...er, [champ]: undefined } : er));
  };

  // Valeurs par défaut selon les réglages, puis préremplissage si le client est connecté
  useEffect(() => {
    if (!settings) return;
    setF((v) => ({ ...v, type: v.type || (settings.deliveryEnabled ? 'delivery' : 'pickup') }));
    setMethode((m) => m || (settings.stripeEnabled ? 'stripe' : 'interac'));
  }, [settings]);
  useEffect(() => {
    if (!user) return;
    const a = user.defaultAddress || {};
    setF((v) => ({
      ...v,
      name: v.name || user.name || '',
      email: v.email || user.email || '',
      phone: v.phone || user.phone || '',
      line1: v.line1 || a.line1 || '',
      line2: v.line2 || a.line2 || '',
      city: a.city || v.city,
      postalCode: v.postalCode || a.postalCode || '',
    }));
  }, [user]);

  // --- Données envoyées au serveur -------------------------------------------------
  const articles = items.map(({ productId, variantId, quantity, message }) => ({
    productId,
    variantId,
    quantity,
    ...(message ? { message } : {}),
  }));
  const codePostal = normalizePostalCode(f.postalCode);
  const adresseComplete = f.line1.trim().length >= 3 && f.city.trim().length >= 2 && codePostal;
  const fulfillment = useMemo(() => {
    if (onlyGiftCards || !f.type) return undefined;
    if (f.type === 'pickup') return { type: 'pickup' };
    return adresseComplete
      ? { type: 'delivery', address: { line1: f.line1.trim(), line2: f.line2.trim(), city: f.city.trim(), postalCode: codePostal } }
      : { type: 'delivery' };
  }, [onlyGiftCards, f.type, f.line1, f.line2, f.city, codePostal, adresseComplete]);

  const devis = useQuery({
    queryKey: ['checkout-quote', lang, articles, fulfillment, codes],
    queryFn: ({ signal }) =>
      api('/cart/quote', {
        method: 'POST',
        signal,
        body: { locale: lang, items: articles, fulfillment, promoCode: codes.promo || undefined, giftCardCode: codes.giftCard || undefined },
      }),
    placeholderData: keepPreviousData,
    enabled: articles.length > 0,
  });
  const quote = devis.data;
  const erreursDevis = quote?.errors || [];
  const pricing = quote?.pricing;
  const rienAPayer = pricing && pricing.amountDue === 0;

  // Codes promo / carte-cadeau refusés par le serveur : message sous le champ
  const erreurPromo = codes.promo && erreursDevis.find((c) => c.startsWith('promo_'));
  const erreurCarte = codes.giftCard && erreursDevis.find((c) => c.startsWith('giftcard_'));

  // --- Validation -----------------------------------------------------------------
  function valider() {
    const e = {};
    if (!onlyGiftCards && f.type === 'delivery') {
      if (f.line1.trim().length < 3) e.line1 = t('checkout.required');
      if (f.city.trim().length < 2) e.city = t('checkout.required');
      if (!codePostal) e.postalCode = f.postalCode.trim() ? t('checkout.invalidPostal') : t('checkout.required');
    }
    if (f.name.trim().length < 2) e.name = t('checkout.required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = f.email.trim() ? t('checkout.invalidEmail') : t('checkout.required');
    if (f.phone.replace(/\D/g, '').length < 10) e.phone = f.phone.trim() ? t('checkout.invalidPhone') : t('checkout.required');
    if (!conditions) e.terms = t('checkout.termsRequired');
    return e;
  }

  const ferme = settings && !settings.ordersOpen;
  const manque = erreursDevis.includes('below_minimum') ? Math.max(0, (quote?.minimumOrder || 0) - minimumBase(quote)) : 0;
  const bloquant = ferme || erreursDevis.includes('below_minimum');

  async function commander(e) {
    e.preventDefault();
    setErreurServeur([]);
    const v = valider();
    setErreurs(v);
    if (Object.keys(v).length > 0) {
      toast.show(t('checkout.fixErrors'), { type: 'error' });
      document.getElementById(`champ-${Object.keys(v)[0]}`)?.focus();
      return;
    }
    setEnvoi(true);
    try {
      const reponse = await api('/orders', {
        method: 'POST',
        body: {
          locale: lang,
          items: articles,
          fulfillment,
          promoCode: codes.promo || undefined,
          giftCardCode: codes.giftCard || undefined,
          customer: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() },
          customerNotes: f.notes.trim() || undefined,
          paymentMethod: methode || 'stripe',
        },
      });
      const { order, trackingToken, clientSecret } = reponse;
      saveRecentOrder(order.number, trackingToken);
      if (clientSecret) {
        // Vrai paiement Stripe : on monte le formulaire de carte
        onStripe({ order, trackingToken, clientSecret });
        return;
      }
      onEnvoyee();
      navigate(trackingPath(order.number, trackingToken), { state: { nouvelle: true } });
      clear();
    } catch (err) {
      const liste = err.code === 'order_invalid' && Array.isArray(err.details) ? err.details : [err.code];
      setErreurServeur(liste);
      toast.show(t(`errors.${liste[0]}`, { defaultValue: t('errors.server_error') }), { type: 'error' });
    } finally {
      setEnvoi(false);
    }
  }

  const libelleBouton = envoi
    ? t('checkout.placing')
    : methode === 'stripe' && !rienAPayer && pricing
      ? t('checkout.pay', { amount: money(pricing.amountDue) })
      : t('checkout.place');

  // Erreurs du serveur à afficher près du bouton (hors codes déjà affichés sous un champ)
  const dejaAffichees = ['promo_', 'giftcard_invalid', 'delivery_zone', 'below_minimum', 'orders_closed', 'address_required', 'fulfillment_required'];
  const erreursGenerales = [...new Set([...erreurServeur, ...erreursDevis.filter((c) => ['pickup_disabled', 'delivery_disabled'].includes(c))])].filter(
    (c) => !dejaAffichees.some((p) => c.startsWith(p)) || erreurServeur.includes(c),
  );

  return (
    <form className={`container page ${styles.page}`} onSubmit={commander} noValidate>
      <div className={styles.entete}>
        <Link to="/panier" className="btn btn-ghost">
          ← {t('checkout.back')}
        </Link>
        <h1>{t('checkout.title')}</h1>
      </div>

      {ferme && (
        <p className="notice notice-warning">
          <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
          {text(settings.closedMessage) || t('checkout.closed')}
        </p>
      )}

      <div className={styles.grille}>
        <div className={styles.etapes}>
          {/* 1. Réception ------------------------------------------------------------ */}
          <section className={styles.etape} aria-labelledby="etape-1">
            <h2 id="etape-1" className={styles.titreEtape}>
              <span className={styles.numero} aria-hidden="true">1</span>
              {t('checkout.step1')}
            </h2>
            {onlyGiftCards ? (
              <p className="notice notice-info">
                <Info size={20} strokeWidth={1.5} aria-hidden="true" />
                {t('checkout.noFulfillment')}
              </p>
            ) : (
              <>
                <div className={styles.choix} role="radiogroup" aria-labelledby="etape-1">
                  {settings?.deliveryEnabled && (
                    <Choix
                      name="reception"
                      checked={f.type === 'delivery'}
                      onChange={() => setF((v) => ({ ...v, type: 'delivery' }))}
                      Icone={Truck}
                      titre={t('checkout.delivery')}
                      texte={t('checkout.deliveryText', { fee: money(settings.deliveryFee) })}
                    />
                  )}
                  {settings?.pickupEnabled && (
                    <Choix
                      name="reception"
                      checked={f.type === 'pickup'}
                      onChange={() => setF((v) => ({ ...v, type: 'pickup' }))}
                      Icone={Store}
                      titre={t('checkout.pickup')}
                      texte={t('checkout.pickupText', { city: settings.pickupCity || 'Québec' })}
                    />
                  )}
                </div>
                {f.type === 'delivery' && (
                  <div className={styles.champs}>
                    <Field id="champ-line1" label={t('checkout.line1')} value={f.line1} onChange={maj('line1')} autoComplete="address-line1" error={erreurs.line1} className={styles.large} />
                    <Field id="champ-line2" label={t('checkout.line2')} value={f.line2} onChange={maj('line2')} autoComplete="address-line2" className={styles.large} />
                    <Field id="champ-city" label={t('checkout.city')} value={f.city} onChange={maj('city')} autoComplete="address-level2" error={erreurs.city} />
                    <Field
                      id="champ-postalCode"
                      label={t('checkout.postalCode')}
                      value={f.postalCode}
                      onChange={maj('postalCode')}
                      onBlur={() => codePostal && setF((v) => ({ ...v, postalCode: codePostal }))}
                      autoComplete="postal-code"
                      autoCapitalize="characters"
                      maxLength={7}
                      help={t('checkout.postalHelp')}
                      error={erreurs.postalCode || (erreursDevis.includes('delivery_zone') ? t('errors.delivery_zone') : null)}
                    />
                  </div>
                )}
              </>
            )}
          </section>

          {/* 2. Coordonnées ------------------------------------------------------------ */}
          <section className={styles.etape} aria-labelledby="etape-2">
            <h2 id="etape-2" className={styles.titreEtape}>
              <span className={styles.numero} aria-hidden="true">2</span>
              {t('checkout.step2')}
            </h2>
            <div className={styles.champs}>
              <Field id="champ-name" label={t('checkout.name')} value={f.name} onChange={maj('name')} autoComplete="name" error={erreurs.name} className={styles.large} />
              <Field id="champ-email" type="email" label={t('checkout.email')} value={f.email} onChange={maj('email')} autoComplete="email" inputMode="email" help={t('checkout.emailHelp')} error={erreurs.email} />
              <Field id="champ-phone" type="tel" label={t('checkout.phone')} value={f.phone} onChange={maj('phone')} autoComplete="tel" inputMode="tel" help={t('checkout.phoneHelp')} error={erreurs.phone} />
              <Field
                id="champ-notes"
                as="textarea"
                rows={3}
                maxLength={NOTES_MAX}
                label={t('checkout.notes')}
                value={f.notes}
                onChange={maj('notes')}
                help={t('checkout.notesHelp', { count: NOTES_MAX - f.notes.length })}
                className={styles.large}
              />
            </div>
          </section>

          {/* 3. Paiement --------------------------------------------------------------- */}
          <section className={styles.etape} aria-labelledby="etape-3">
            <h2 id="etape-3" className={styles.titreEtape}>
              <span className={styles.numero} aria-hidden="true">3</span>
              {t('checkout.step3')}
            </h2>

            <div className={styles.codes}>
              <Code
                id="promo"
                label={t('checkout.promo')}
                ouvrir={t('checkout.addPromo')}
                valeur={saisie.promo}
                applique={codes.promo && !erreurPromo ? codes.promo : ''}
                erreur={erreurPromo ? t(`errors.${erreurPromo}`) : null}
                onSaisie={(v) => setSaisie((s) => ({ ...s, promo: v }))}
                onAppliquer={() => setCodes((c) => ({ ...c, promo: saisie.promo.trim().toUpperCase() }))}
                onRetirer={() => {
                  setCodes((c) => ({ ...c, promo: '' }));
                  setSaisie((s) => ({ ...s, promo: '' }));
                }}
              />
              <Code
                id="carte"
                label={t('checkout.giftCard')}
                ouvrir={t('checkout.addGiftCard')}
                valeur={saisie.giftCard}
                applique={codes.giftCard && !erreurCarte ? codes.giftCard : ''}
                erreur={erreurCarte ? t(`errors.${erreurCarte}`) : null}
                onSaisie={(v) => setSaisie((s) => ({ ...s, giftCard: v }))}
                onAppliquer={() => setCodes((c) => ({ ...c, giftCard: saisie.giftCard.trim().toUpperCase() }))}
                onRetirer={() => {
                  setCodes((c) => ({ ...c, giftCard: '' }));
                  setSaisie((s) => ({ ...s, giftCard: '' }));
                }}
              />
            </div>

            {rienAPayer ? (
              <p className="notice notice-success">{t('checkout.giftCardPays')}</p>
            ) : (
              <div className={styles.choix} role="radiogroup" aria-labelledby="etape-3">
                {settings?.stripeEnabled && (
                  <Choix
                    name="paiement"
                    checked={methode === 'stripe'}
                    onChange={() => setMethode('stripe')}
                    Icone={CreditCard}
                    titre={t('checkout.methodCard')}
                    texte={t('checkout.methodCardText')}
                  />
                )}
                {settings?.interacEnabled && (
                  <Choix
                    name="paiement"
                    checked={methode === 'interac'}
                    onChange={() => setMethode('interac')}
                    Icone={Landmark}
                    titre={t('checkout.methodInterac')}
                    texte={t('checkout.methodInteracText')}
                  />
                )}
              </div>
            )}
            {!rienAPayer && (
              <p className="notice notice-info">
                <Info size={20} strokeWidth={1.5} aria-hidden="true" />
                {methode === 'interac' ? t('checkout.interacNote') : t('checkout.preauth')}
              </p>
            )}
          </section>
        </div>

        {/* Récapitulatif ------------------------------------------------------------------ */}
        <aside className={styles.recap} aria-labelledby="recap-titre">
          <h2 id="recap-titre" className={styles.titreRecap}>
            {t('checkout.summary')}
          </h2>
          <ul className={styles.articles}>
            {items.map((item) => {
              const s = item.snapshot || {};
              return (
                <li key={item.key}>
                  <span className={styles.vignette}>
                    <ProductImage image={s.image} categorySlug={s.categorySlug} isGiftCard={s.isGiftCard} width={96} />
                    <span className={styles.quantite}>{item.quantity}</span>
                  </span>
                  <span className={styles.article}>
                    <span>{text(s.name)}</span>
                    <span className="small muted">{text(s.variantLabel)}</span>
                    {item.message && <span className={`small ${styles.message}`}>« {item.message} »</span>}
                  </span>
                  <span className="price">{money(item.line ? item.line.lineTotal : (s.price || 0) * item.quantity)}</span>
                </li>
              );
            })}
          </ul>

          {pricing ? (
            <dl className={styles.montants} aria-live="polite">
              <Ligne label={t('checkout.subtotal')} valeur={money(pricing.subtotal)} />
              {pricing.discount > 0 && <Ligne label={`${t('checkout.discount')} (${quote.promoCode})`} valeur={`− ${money(pricing.discount)}`} />}
              {!onlyGiftCards && f.type === 'delivery' && <Ligne label={t('checkout.deliveryFee')} valeur={money(pricing.deliveryFee)} />}
              {!onlyGiftCards && f.type === 'pickup' && <Ligne label={t('checkout.deliveryFee')} valeur={t('checkout.free')} />}
              {pricing.gst > 0 && <Ligne label={t('checkout.gst')} valeur={money(pricing.gst)} />}
              {pricing.qst > 0 && <Ligne label={t('checkout.qst')} valeur={money(pricing.qst)} />}
              {pricing.giftCardApplied > 0 && (
                <>
                  <Ligne label={t('checkout.total')} valeur={money(pricing.total)} />
                  <Ligne label={t('checkout.giftCardApplied')} valeur={`− ${money(pricing.giftCardApplied)}`} />
                </>
              )}
              <Ligne label={t('checkout.amountDue')} valeur={money(pricing.amountDue)} fort />
            </dl>
          ) : (
            <span className="skeleton" style={{ height: 120 }} />
          )}

          {manque > 0 && (
            <p className="notice notice-warning">
              <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
              {t('checkout.belowMinimum', { minimum: money(quote.minimumOrder), missing: money(manque) })}
            </p>
          )}

          <div className={styles.validation}>
            <label className={styles.conditions}>
              <input
                id="champ-terms"
                type="checkbox"
                checked={conditions}
                onChange={(e) => {
                  setConditions(e.target.checked);
                  setErreurs((er) => ({ ...er, terms: undefined }));
                }} aria-invalid={erreurs.terms ? true : undefined} />
              <span>
                <Trans i18nKey="checkout.terms" components={{ 1: <Link to="/conditions" target="_blank" /> }} />
              </span>
            </label>
            {erreurs.terms && (
              <p className="field-error">
                <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />
                {erreurs.terms}
              </p>
            )}
            {erreursGenerales.length > 0 && (
              <div className="notice notice-error" role="alert">
                <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
                <div>
                  {erreursGenerales.map((c) => (
                    <p key={c}>{t(`errors.${c}`, { defaultValue: t('errors.server_error') })}</p>
                  ))}
                </div>
              </div>
            )}
            {/* Collé en bas de l'écran sur mobile */}
            <div className={styles.barre} data-barre-action>
              {pricing && <span className={`price ${styles.montantBarre}`}>{money(pricing.amountDue)}</span>}
              <button type="submit" className="btn btn-primary" disabled={envoi || bloquant || !pricing}>
                {libelleBouton}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

/** Base du minimum de commande (hors cartes-cadeaux), à partir du devis du serveur. */
function minimumBase(quote) {
  return (quote?.items || []).filter((l) => !l.isGiftCard).reduce((n, l) => n + l.lineTotal, 0);
}

function Choix({ name, checked, onChange, Icone, titre, texte }) {
  return (
    <label className={styles.carteChoix}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <Icone size={24} strokeWidth={1.5} aria-hidden="true" />
      <span>
        <span className={styles.titreChoix}>{titre}</span>
        <span className={styles.texteChoix}>{texte}</span>
      </span>
    </label>
  );
}

function Code({ id, label, ouvrir, valeur, applique, erreur, onSaisie, onAppliquer, onRetirer }) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  if (applique) {
    return (
      <p className={styles.codeApplique}>
        <span>
          {label} : <strong>{applique}</strong>
        </span>
        <button type="button" className="btn btn-ghost" onClick={onRetirer}>
          {t('checkout.removeCode')}
        </button>
      </p>
    );
  }
  if (!ouvert && !erreur) {
    return (
      <button type="button" className={`btn btn-ghost ${styles.ouvrirCode}`} onClick={() => setOuvert(true)} aria-expanded="false">
        + {ouvrir}
      </button>
    );
  }
  return (
    <div className={styles.code}>
      <Field
        id={`code-${id}`}
        label={label}
        value={valeur}
        onChange={(e) => onSaisie(e.target.value.toUpperCase())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAppliquer();
          }
        }}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        error={erreur}
      />
      <button type="button" className="btn btn-secondary" onClick={onAppliquer} disabled={!valeur.trim()}>
        {t('checkout.apply')}
      </button>
    </div>
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
