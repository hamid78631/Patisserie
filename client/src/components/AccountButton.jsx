/*
 * Compte dans l'en-tête : icône User pour un visiteur, avatar rond avec initiales
 * pour un client connecté, avec un menu (Mon compte, Mes commandes, Tableau de bord, Déconnexion).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { useMe } from '../hooks/queries.js';
import styles from './AccountButton.module.css';

export function initiales(nom = '', courriel = '') {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length >= 2) return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return courriel.slice(0, 2).toUpperCase();
}

export function Avatar({ user, size = 32 }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size }} aria-hidden="true">
      {initiales(user.name, user.email)}
    </span>
  );
}

export function useLogout() {
  const queryClient = useQueryClient();
  return async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    queryClient.setQueryData(['me'], null);
  };
}

export default function AccountButton() {
  const { t } = useTranslation();
  const { data: user } = useMe();
  const logout = useLogout();
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef(null);

  useEffect(() => {
    if (!ouvert) return undefined;
    const fermer = (e) => {
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      if (e.type === 'mousedown' && zone.current?.contains(e.target)) return;
      setOuvert(false);
    };
    document.addEventListener('mousedown', fermer);
    document.addEventListener('keydown', fermer);
    return () => {
      document.removeEventListener('mousedown', fermer);
      document.removeEventListener('keydown', fermer);
    };
  }, [ouvert]);

  if (!user) {
    return (
      <Link to="/compte/connexion" className="icon-btn" aria-label={t('nav.login')}>
        <User size={24} strokeWidth={1.5} aria-hidden="true" />
      </Link>
    );
  }

  const fermer = () => setOuvert(false);
  return (
    <div className={styles.zone} ref={zone}>
      <button type="button" className="icon-btn" aria-haspopup="menu" aria-expanded={ouvert} aria-label={t('header.accountMenu')} onClick={() => setOuvert((o) => !o)}>
        <Avatar user={user} />
      </button>
      {ouvert && (
        <div className={styles.menu} role="menu">
          <p className={styles.nom}>{user.name || user.email}</p>
          <Link role="menuitem" to="/compte" onClick={fermer}>
            {t('nav.myAccount')}
          </Link>
          <Link role="menuitem" to="/compte#commandes" onClick={fermer}>
            {t('nav.myOrders')}
          </Link>
          {user.role === 'admin' && (
            <Link role="menuitem" to="/admin" onClick={fermer}>
              {t('nav.dashboard')}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              fermer();
              logout();
            }}
          >
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
