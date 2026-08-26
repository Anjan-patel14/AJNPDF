'use client';

import { useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/language-context';

const ATTRS = ['placeholder', 'aria-label', 'title'] as const;
const SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT']);
const originals = new WeakMap<Node, string>();
const originalAttrs = new WeakMap<Element, Map<string, string>>();

export function LiveTranslationBridge() {
  const { language, text } = useLanguage();
  const applying = useRef(false);
  const firstHydrationPass = useRef(true);

  useEffect(() => {
    // Server HTML and the first client render must remain byte-for-byte
    // text-compatible. The legacy DOM bridge is only needed after the
    // initial English hydration pass or after an actual language change.
    if (firstHydrationPass.current) {
      firstHydrationPass.current = false;
      if (language === 'en') return;
    }

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentElement;
        if (!parent || SKIP.has(parent.tagName) || parent.closest('[data-no-live-translate="true"]')) return;
        const original = originals.get(node) ?? node.textContent ?? '';
        if (!originals.has(node)) originals.set(node, original);
        const next = text(original);
        if (node.textContent !== next) node.textContent = next;
        return;
      }
      if (!(node instanceof Element) || SKIP.has(node.tagName) || node.closest('[data-no-live-translate="true"]')) return;
      let attrs = originalAttrs.get(node);
      if (!attrs) { attrs = new Map(); originalAttrs.set(node, attrs); }
      for (const attr of ATTRS) {
        const current = node.getAttribute(attr);
        if (current == null) continue;
        if (!attrs.has(attr)) attrs.set(attr, current);
        const original = attrs.get(attr) ?? current;
        const next = text(original);
        if (current !== next) node.setAttribute(attr, next);
      }
      node.childNodes.forEach(translateNode);
    };

    const run = () => {
      if (applying.current) return;
      applying.current = true;
      try { translateNode(document.body); } finally { applying.current = false; }
    };

    run();
    const observer = new MutationObserver((records) => {
      if (applying.current) return;
      applying.current = true;
      try {
        for (const record of records) {
          if (record.type === 'characterData') translateNode(record.target);
          record.addedNodes.forEach(translateNode);
        }
      } finally { applying.current = false; }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language, text]);

  return null;
}
