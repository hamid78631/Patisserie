/*
 * Routes du site public. Les URL restent en français, même en anglais.
 * Les pages des étapes suivantes (paiement, suivi, comptes, pages légales) affichent
 * « Bientôt disponible » en attendant d'être construites.
 */
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Accueil from './pages/Accueil.jsx';
import Boutique from './pages/Boutique.jsx';
import Produit from './pages/Produit.jsx';
import CartesCadeaux from './pages/CartesCadeaux.jsx';
import Panier from './pages/Panier.jsx';
import Bientot from './pages/Bientot.jsx';
import Introuvable from './pages/Introuvable.jsx';

// Page de contrôle de la charte graphique : développement seulement
const Charte = import.meta.env.DEV ? lazy(() => import('./pages/Charte.jsx')) : null;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Accueil />} />
        <Route path="boutique" element={<Boutique />} />
        <Route path="boutique/:categorie" element={<Boutique />} />
        <Route path="produit/:slug" element={<Produit />} />
        <Route path="cartes-cadeaux" element={<CartesCadeaux />} />
        <Route path="panier" element={<Panier />} />
        <Route path="paiement" element={<Bientot titre="pages.checkout" />} />
        <Route path="commande/:numero" element={<Bientot titre="pages.order" />} />
        <Route path="compte" element={<Bientot titre="pages.account" />} />
        <Route path="compte/connexion" element={<Bientot titre="pages.login" />} />
        <Route path="compte/inscription" element={<Bientot titre="pages.register" />} />
        <Route path="a-propos" element={<Bientot titre="pages.about" />} />
        <Route path="faq" element={<Bientot titre="pages.faq" />} />
        <Route path="contact" element={<Bientot titre="pages.contact" />} />
        <Route path="conditions" element={<Bientot titre="pages.terms" />} />
        <Route path="confidentialite" element={<Bientot titre="pages.privacy" />} />
        <Route path="*" element={<Introuvable />} />
      </Route>
      {Charte && (
        <Route
          path="charte"
          element={
            <Suspense fallback={null}>
              <Charte />
            </Suspense>
          }
        />
      )}
    </Routes>
  );
}
