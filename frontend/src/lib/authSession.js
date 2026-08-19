/**
 * Strict Per-Tab Authentication & Session Storage Manager
 *
 * Uses `sessionStorage` strictly so that each browser tab maintains its own independent session:
 * - Tab 1 can be logged in as Super Admin
 * - Tab 2 can be logged in as Tenant Admin (Org A)
 * - Tab 3 can be logged in as Employee (Org B)
 *
 * Logging out in one tab clears ONLY that tab's session.
 * Refreshing a tab preserves that tab's user without switching to any other tab's user.
 */

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';
const INSPECTED_ORG_ID_KEY = 'inspected_org_id';
const INSPECTED_ORG_KEY = 'inspected_org';

// Clean up any legacy shared localStorage to prevent cross-tab contamination
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(INSPECTED_ORG_ID_KEY);
    localStorage.removeItem(INSPECTED_ORG_KEY);
  }
} catch (e) {
  // ignore
}

export const getAuthToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
};

export const getAuthUser = () => {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('[SessionStorage Error]', e);
  }
};

export const clearAuthSession = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(INSPECTED_ORG_ID_KEY);
    sessionStorage.removeItem(INSPECTED_ORG_KEY);
  } catch (e) {
    console.warn('[SessionStorage Clear Error]', e);
  }
};

export const getInspectedOrgId = () => {
  try {
    return sessionStorage.getItem(INSPECTED_ORG_ID_KEY) || null;
  } catch (e) {
    return null;
  }
};

export const getInspectedOrg = () => {
  try {
    const raw = sessionStorage.getItem(INSPECTED_ORG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const setInspectedOrgSession = (org) => {
  try {
    if (org?._id) {
      sessionStorage.setItem(INSPECTED_ORG_ID_KEY, org._id);
      sessionStorage.setItem(INSPECTED_ORG_KEY, JSON.stringify(org));
    }
  } catch (e) {
    console.warn('[SessionStorage Org Error]', e);
  }
};

export const clearInspectedOrgSession = () => {
  try {
    sessionStorage.removeItem(INSPECTED_ORG_ID_KEY);
    sessionStorage.removeItem(INSPECTED_ORG_KEY);
  } catch (e) {
    console.warn('[SessionStorage Org Clear Error]', e);
  }
};
