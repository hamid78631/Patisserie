import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// DM Sans hébergée avec le site (aucun appel à Google Fonts : Loi 25)
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import './styles/tokens.css';
import './styles/base.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
