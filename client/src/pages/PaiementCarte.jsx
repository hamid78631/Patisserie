/*
 * Paiement par carte avec Stripe Payment Element (seulement quand l'API a des clés Stripe).
 * La commande existe déjà (statut « paiement en cours ») ; Stripe pré-autorise la carte
 * (capture manuelle : aucun débit avant la confirmation par la pâtissière).
 * La clé publique vient de VITE_STRIPE_PUBLISHABLE_KEY. Aucune donnée de carte ne passe par notre serveur.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Version « pure » : Stripe.js n'est chargé qu'au moment d'un vrai paiement par carte
import { loadStripe } from '@stripe/stripe-js/pure';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import { useFormat } from '../lib/format.js';
import { trackingPath } from '../lib/orders.js';
import styles from './PaiementCarte.module.css';

const cle = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = cle ? loadStripe(cle) : null;

// Harmonisation avec la charte (STYLE.md §9)
const apparence = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#C8102E',
    colorText: '#2A1215',
    colorBackground: '#FDF7F6',
    colorDanger: '#C8102E',
    borderRadius: '8px',
    fontFamily: 'DM Sans, system-ui, sans-serif',
  },
};

export default function PaiementCarte({ order, trackingToken, clientSecret }) {
  const { t } = useTranslation();
  const { lang } = useFormat();
  const options = useMemo(() => ({ clientSecret, appearance: apparence, locale: lang === 'en' ? 'en-CA' : 'fr-CA' }), [clientSecret, lang]);

  return (
    <div className={`container page ${styles.page}`}>
      <h1>{t('checkout.cardTitle')}</h1>
      <p className="muted">{t('checkout.cardLead')}</p>
      {stripePromise ? (
        <Elements stripe={stripePromise} options={options}>
          <Formulaire order={order} trackingToken={trackingToken} />
        </Elements>
      ) : (
        <p className="notice notice-error">
          <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
          {t('errors.server_error')}
        </p>
      )}
    </div>
  );
}

function Formulaire({ order, trackingToken }) {
  const { t } = useTranslation();
  const { money } = useFormat();
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { clear } = useCart();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const suivi = trackingPath(order.number, trackingToken);

  async function autoriser(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setEnvoi(true);
    setErreur('');
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}${suivi}` },
    });
    if (error) {
      setErreur(error.message || t('checkout.cardError'));
      setEnvoi(false);
      return;
    }
    clear();
    navigate(suivi, { state: { nouvelle: true } });
  }

  return (
    <form className={styles.formulaire} onSubmit={autoriser}>
      <PaymentElement />
      {erreur && (
        <p className="notice notice-error" role="alert">
          <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
          {erreur}
        </p>
      )}
      <p className="small muted">{t('checkout.preauth')}</p>
      <div className={styles.barre} data-barre-action>
        <button type="submit" className="btn btn-primary btn-block" disabled={!stripe || envoi}>
          {envoi ? t('checkout.placing') : t('checkout.confirmCard', { amount: money(order.pricing.amountDue) })}
        </button>
      </div>
    </form>
  );
}
