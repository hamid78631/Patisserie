/*
 * Menu plein écran (mobile et tablette) : liens, langue, compte.
 */
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/brand/logo.svg';
import { useMe } from '../hooks/queries.js';
import { Avatar, useLogout } from './AccountButton.jsx';
import LanguageSwitch from './LanguageSwitch.jsx';
import { useDialog } from './useDialog.js';
import { LIENS } from '../config/navigation.js';
import styles from './MobileMenu.module.css';

export default function MobileMenu({ open, onClose }) {
  const { t } = useTranslation();
  const panneau = useDialog(open, onClose);
  const { data: user } = useMe();
  const logout = useLogout();
  if (!open) return null;

  const liens = [{ to: '/', cle: 'nav.home' }, ...LIENS, { to: '/contact', cle: 'nav.contact' }];
  // Rendu à la racine du document : au-dessus de l’en-tête collant et de la barre du bas
  return createPortal(
    <div className={styles.panneau} role="dialog" aria-modal="true" aria-label={t('nav.main')} ref={panneau}>
      <div className={`container ${styles.haut}`}>
        <img src={logo} alt="" className={styles.logo} />
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('header.closeMenu')} data-autofocus>
          <X size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <nav className="container" aria-label={t('nav.main')}>
        <ul className={styles.liens}>
          {liens.map(({ to, cle }) => (
            <li key={to}>
              <NavLink to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => (isActive ? styles.actif : undefined)}>
                {t(cle)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className={`container ${styles.bas}`}>
        {user ? (
          <div className={styles.compte}>
            <Link to="/compte" onClick={onClose} className={styles.utilisateur}>
              <Avatar user={user} size={40} />
              <span>{user.name || user.email}</span>
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" onClick={onClose} className="btn btn-secondary">
                {t('nav.dashboard')}
              </Link>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                onClose();
                logout();
              }}
            >
              {t('nav.logout')}
            </button>
          </div>
        ) : (
          <Link to="/compte/connexion" onClick={onClose} className="btn btn-secondary btn-block">
            {t('nav.login')}
          </Link>
        )}
        <LanguageSwitch />
      </div>
    </div>,
    document.body,
  );
}
