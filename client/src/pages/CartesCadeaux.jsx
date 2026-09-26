/*
 * Cartes-cadeaux : achat (choix du montant) et vérification du solde (POST /api/giftcards/check).
 */
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import { CarteCadeau } from '../assets/illustrations/index.js';
import QuantityStepper from '../components/QuantityStepper.jsx';
import { ErrorState } from '../components/States.jsx';
import { useToast } from '../components/Toasts.jsx';
import { useProducts } from '../hooks/queries.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { api } from '../lib/api.js';
import { useFormat } from '../lib/format.js';
import styles from './CartesCadeaux.module.css';

export default function CartesCadeaux() {
  const { t } = useTranslation();
  const produits = useProducts();
  usePageMeta({ title: t('giftCards.title'), description: t('giftCards.seoDescription') });
  const carte = produits.data?.find((p) => p.isGiftCard);

  return (
    <div className="container page">
      <div className={styles.entete}>
        <h1>{t('giftCards.title')}</h1>
        <p className="muted">{t('giftCards.lead')}</p>
      </div>

      <div className={styles.grille}>
        <section className={styles.bloc} aria-labelledby="acheter">
          <div className={styles.illustration}>
            <CarteCadeau />
          </div>
          <h2 id="acheter">{t('giftCards.buyTitle')}</h2>
          {produits.isError ? (
            <ErrorState onRetry={() => produits.refetch()} />
          ) : produits.isLoading ? (
            <span className="skeleton" style={{ height: 120 }} />
          ) : carte ? (
            <Achat carte={carte} />
          ) : (
            <p className="muted">{t('giftCards.unavailable')}</p>
          )}
        </section>

        <section className={styles.bloc} aria-labelledby="solde">
          <h2 id="solde">{t('giftCards.checkTitle')}</h2>
          <VerificationSolde />
        </section>
      </div>
    </div>
  );
}

function Achat({ carte }) {
  const { t } = useTranslation();
  const { money, text } = useFormat();
  const { addItem, openDrawer } = useCart();
  const toast = useToast();
  const [variantId, setVariantId] = useState(carte.variants[0]._id);
  const [quantite, setQuantite] = useState(1);
  const variante = carte.variants.find((v) => v._id === variantId) || carte.variants[0];

  const ajouter = (e) => {
    e.preventDefault();
    addItem({ product: carte, variant: variante, quantity: quantite });
    toast.show(t('product.added', { name: `${text(carte.name)} ${money(variante.price)}` }));
    if (window.matchMedia('(min-width: 1024px)').matches) openDrawer();
  };

  return (
    <form className={styles.formulaire} onSubmit={ajouter}>
      <fieldset className={styles.montants}>
        <legend>{t('giftCards.amount')}</legend>
        <div className={styles.pastilles}>
          {carte.variants.map((v) => (
            <label key={v._id} className={styles.pastille}>
              <input type="radio" name="montant" value={v._id} checked={v._id === variante._id} onChange={() => setVariantId(v._id)} />
              <span className="price">{money(v.price)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={styles.quantite}>
        <span className={styles.etiquette}>{t('common.quantity')}</span>
        <QuantityStepper value={quantite} onChange={setQuantite} />
      </div>
      <p className="small muted">{t('giftCards.points')}</p>
      <button type="submit" className="btn btn-primary">
        <Gift size={20} strokeWidth={1.5} aria-hidden="true" />
        {t('common.addToCart')}
      </button>
    </form>
  );
}

function VerificationSolde() {
  const { t, i18n } = useTranslation();
  const { money } = useFormat();
  const [code, setCode] = useState('');
  const [etat, setEtat] = useState({ chargement: false, resultat: null, erreur: null });

  const verifier = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setEtat({ chargement: true, resultat: null, erreur: null });
    try {
      const resultat = await api('/giftcards/check', { method: 'POST', body: { code: code.trim() } });
      setEtat({ chargement: false, resultat, erreur: null });
    } catch (err) {
      // Un code trop court est simplement « invalide » pour le client
      const cle = err.code === 'validation_error' ? null : err.code;
      setEtat({ chargement: false, resultat: cle ? null : { valid: false }, erreur: cle });
    }
  };

  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage === 'en' ? 'en-CA' : 'fr-CA', { dateStyle: 'long', timeZone: 'America/Toronto' });
  const { resultat, erreur, chargement } = etat;

  return (
    <form className={styles.formulaire} onSubmit={verifier}>
      <div className="field">
        <label htmlFor="code-carte">{t('giftCards.code')}</label>
        <input
          id="code-carte"
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          aria-describedby="code-aide"
        />
        <p id="code-aide" className="help">
          {t('giftCards.codeHelp')}
        </p>
      </div>
      <button type="submit" className="btn btn-secondary" disabled={chargement || !code.trim()}>
        {chargement ? t('common.loading') : t('giftCards.check')}
      </button>
      <div aria-live="polite">
        {resultat?.valid && (
          <p className="notice notice-success">
            <CheckCircle2 size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>
              {t('giftCards.balance', { amount: money(resultat.balance) })}
              {resultat.expiresAt && (
                <>
                  <br />
                  {t('giftCards.expires', { date: dateFormat.format(new Date(resultat.expiresAt)) })}
                </>
              )}
            </span>
          </p>
        )}
        {resultat && !resultat.valid && (
          <p className="notice notice-error">
            <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
            {t('giftCards.invalid')}
          </p>
        )}
        {erreur && (
          <p className="notice notice-error">
            <AlertTriangle size={20} strokeWidth={1.5} aria-hidden="true" />
            {t(`errors.${erreur}`, { defaultValue: t('errors.server_error') })}
          </p>
        )}
      </div>
    </form>
  );
}
