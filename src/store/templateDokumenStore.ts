import { create } from 'zustand';
import { fetchApi } from '../lib/api';

export type TipeTransaksi = 'Cash' | 'KPR' | 'In House';

export interface TemplateDokumen {
  id: string;
  ptId: string;
  aktif?: boolean;
  tipeTransaksi: TipeTransaksi;
  polaNomor: string; // contoh: "TST/2026/KPR/01" atau "PRSM/{TAHUN}/KPR/{NO}"
  pasalIds: string[]; // urutan pasal
  createdAt: string;
}

const LOCAL_TEMPLATE_DISPLAY_MAP_KEY = 'podorukun_template_pola_display_map';

function getLocalTemplateDisplayMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_TEMPLATE_DISPLAY_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalTemplateDisplay(templateId: string, displayPola: string) {
  try {
    const map = getLocalTemplateDisplayMap();
    map[templateId] = displayPola;
    localStorage.setItem(LOCAL_TEMPLATE_DISPLAY_MAP_KEY, JSON.stringify(map));
  } catch {}
}

function removeLocalTemplateDisplay(templateId: string) {
  try {
    const map = getLocalTemplateDisplayMap();
    delete map[templateId];
    localStorage.setItem(LOCAL_TEMPLATE_DISPLAY_MAP_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Normalizes user-input polaNomor for backend validation.
 * The backend requires {NO} for the running counter and braces for years (e.g. {2026}).
 * If user inputs actual numbers (e.g. 'TST/2026/KPR/01' or '01'), this ensures the backend
 * receives a valid payload while the user's exact format is preserved on the frontend.
 */
export function preparePolaNomorForBackend(pola: string): string {
  let result = pola.trim();
  if (!result) return '{NO}';

  // If already contains {NO}, keep as-is
  if (result.includes('{NO}')) {
    return result;
  }

  // If user entered e.g. {01} or {001}
  if (/\{(\d+)\}/.test(result)) {
    result = result.replace(/\{(\d+)\}/, '{NO}');
    if (result.includes('{NO}')) return result;
  }

  // Identify 4-digit year if present (e.g. 2026, 2025)
  const yearMatch = result.match(/(?:^|[\/\-_])(20\d{2})(?:$|[\/\-_])/);
  const yearFound = yearMatch ? yearMatch[1] : '';

  // If number at end (e.g. .../01 or ...-01 or .../1)
  if (/([\/\-_])(\d+)$/.test(result)) {
    result = result.replace(/([\/\-_])(\d+)$/, '$1{NO}');
  }
  // Else if number at start (e.g. 01/... or 1-...)
  else if (/^(\d+)([\/\-_])/.test(result)) {
    result = result.replace(/^(\d+)([\/\-_])/, '{NO}$2');
  }
  // Else if the entire string is just a number (e.g. "01")
  else if (/^\d+$/.test(result)) {
    result = '{NO}';
  }
  // Else if there is another number token not equal to year
  else {
    const parts = result.split(/([\/\-_])/);
    let replaced = false;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i]) && parts[i] !== yearFound) {
        parts[i] = '{NO}';
        replaced = true;
        break;
      }
    }
    if (replaced) {
      result = parts.join('');
    } else {
      result = `${result}/{NO}`;
    }
  }

  // Wrap year in {2026} if not already wrapped with braces
  if (yearFound && !result.includes(`{${yearFound}}`) && !result.includes('{TAHUN}')) {
    result = result.replace(new RegExp(`([\\/\\-_])${yearFound}([\\/\\-_]|$)`), `$1{${yearFound}}$2`);
  }

  return result;
}

interface TemplateDokumenState {
  items: TemplateDokumen[];
  fetch: () => Promise<void>;
  add: (data: Omit<TemplateDokumen, 'id' | 'createdAt'>) => Promise<string>;
  update: (id: string, data: Partial<Omit<TemplateDokumen, 'id' | 'createdAt'>>) => Promise<void>;
  duplikat: (id: string) => Promise<string>;
  remove: (id: string) => Promise<void>;
}

export const useTemplateDokumenStore = create<TemplateDokumenState>()((set) => ({
  items: [],

  fetch: async () => {
    try {
      const res = await fetchApi('/template-dokumen');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Permintaan ditolak backend');
      }
      if (res.ok) {
        const json = await res.json();
        const displayMap = getLocalTemplateDisplayMap();
        const items = (json.data || []).map((t: TemplateDokumen) => {
          if (displayMap[t.id]) {
            return { ...t, polaNomor: displayMap[t.id] };
          }
          return t;
        });
        set({ items });
      }
    } catch (error) {
      console.error('Failed to fetch template dokumen:', error);
    }
  },

  add: async (data) => {
    const userPola = data.polaNomor;
    const backendPola = preparePolaNomorForBackend(userPola);
    const payload = { ...data, polaNomor: backendPola };

    try {
      const res = await fetchApi('/template-dokumen', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Permintaan ditolak backend');
      }
      if (res.ok) {
        const json = await res.json();
        const newItem = json.data;
        if (newItem?.id) {
          saveLocalTemplateDisplay(newItem.id, userPola);
        }
        const itemWithUserPola = { ...newItem, polaNomor: userPola };
        set((state) => ({ items: [...state.items, itemWithUserPola] }));
        return newItem.id;
      }
    } catch (error) {
      throw error;
    }
    return '';
  },

  update: async (id, data) => {
    const userPola = data.polaNomor;
    const backendPola = userPola !== undefined ? preparePolaNomorForBackend(userPola) : undefined;
    const payload = { ...data, ...(backendPola !== undefined ? { polaNomor: backendPola } : {}) };

    try {
      const res = await fetchApi(`/template-dokumen/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Permintaan ditolak backend');
      }
      if (res.ok) {
        const json = await res.json();
        const updatedItem = json.data || {};
        if (userPola) {
          saveLocalTemplateDisplay(id, userPola);
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updatedItem, ...(userPola ? { polaNomor: userPola } : {}) } : item
          ),
        }));
      }
    } catch (error) {
      throw error;
    }
  },

  duplikat: async (id) => {
    try {
      const res = await fetchApi(`/template-dokumen/${id}/duplikat`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Permintaan ditolak backend');
      }
      if (res.ok) {
        const json = await res.json();
        const newItem = json.data;
        set((state) => ({ items: [...state.items, newItem] }));
        return newItem.id;
      }
    } catch (error) {
      throw error;
    }
    return '';
  },

  remove: async (id) => {
    try {
      const res = await fetchApi(`/template-dokumen/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Permintaan ditolak backend');
      }
      if (res.ok) {
        removeLocalTemplateDisplay(id);
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      }
    } catch (error) {
      throw error;
    }
  },
}));
