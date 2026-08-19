/**
 * Per-Tab Authentication & Session Storage Manager
 *
 * Uses `sessionStorage` as the primary storage mechanism so that each browser tab
 * maintains an independent, isolated session (e.g. Tab 1 = Super Admin, Tab 2 = Tenant Admin).
 * Logging out in one tab clears ONLY that tab's session without affecting other tabs.
 * Refreshes in a tab preserve the session state seamlessly across page reloads.
 */

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';
const INSPECTED_ORG_ID_KEY = 'inspected_org_id';
const INSPECTED_ORG_KEY = 'inspected_org';

export const getAuthToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
};

export const getAuthUser = () => {
  try {
    const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
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
      localStorage.setItem(TOKEN_KEY, token); // Keep sync for initial tab duplication
    }
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('[SessionStorage Warning]', e);
  }
};

export const clearAuthSession = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(INSPECTED_ORG_ID_KEY);
    sessionStorage.removeItem(INSPECTED_ORG_KEY);

    // Also clear localStorage for this domain to avoid stale tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(INSPECTED_ORG_ID_KEY);
    localStorage.removeItem(INSPECTED_ORG_KEY);
  } catch (e) {
    console.warn('[SessionStorage Clear Warning]', e);
  }
};

export const getInspectedOrgId = () => {
  try {
    return sessionStorage.getItem(INSPECTED_ORG_ID_KEY) || localStorage.getItem(INSPECTED_ORG_ID_KEY) || null;
  } catch (e) {
    return null;
  }
};

export const getInspectedOrg = () => {
  try {
    const raw = sessionStorage.getItem(INSPECTED_ORG_KEY) || localStorage.getItem(INSPECTED_ORG_KEY);
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
    console.warn('[SessionStorage Org Warning]', e);
  }
};

export const clearInspectedOrgSession = () => {
  try {
    sessionStorage.removeItem(INSPECTED_ORG_ID_KEY);
    sessionStorage.removeItem(INSPECTED_ORG_KEY);
    localStorage.removeItem(INSPECTED_ORG_ID_KEY);
    localStorage.removeItem(INSPECTED_ORG_KEY);
  } catch (e) {
    console.warn('[SessionStorage Org Clear Warning]', e);
  }
};
