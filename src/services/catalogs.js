import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import { DEFAULT_CATALOGS } from '../data/catalogs';

let cache = null;

export async function fetchCatalogs() {
  if (cache) return cache;
  try {
    const snap = await get(ref(db, 'catalogs'));
    cache = snap.exists() ? { ...DEFAULT_CATALOGS, ...snap.val() } : DEFAULT_CATALOGS;
  } catch {
    cache = DEFAULT_CATALOGS;
  }
  return cache;
}

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState(cache || DEFAULT_CATALOGS);
  useEffect(() => {
    fetchCatalogs().then(setCatalogs);
  }, []);
  return catalogs;
}
