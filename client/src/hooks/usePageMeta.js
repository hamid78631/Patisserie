/*
 * Titre et description de chaque page (SEO), plus données structurées facultatives.
 */
import { useEffect } from 'react';
import { brand } from '../config/brand.js';

function setMeta(selector, attribute, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/);
    el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
}

export function usePageMeta({ title, description, jsonLd } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${brand.name}` : `${brand.name} — ${brand.tagline.fr}`;
    document.title = fullTitle;
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
    }
  }, [title, description]);

  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    if (!ld) return undefined;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = ld;
    document.head.appendChild(script);
    return () => script.remove();
  }, [ld]);
}
