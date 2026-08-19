/**
 * Tenant Scoping Utility for Strict Organization Multi-Tenancy & Confidentiality
 * 
 * Rules:
 * 1. Super Admin (unscoped / no x-org-id): sees all organizations' data across the platform.
 * 2. Super Admin (inspecting org / x-org-id): sees ONLY the inspected organization's data.
 * 3. Organization Admin & Tenant Users: see ONLY their assigned organization's data.
 */

export const getTenantQuery = (req, baseFilter = {}) => {
  const query = { ...baseFilter };

  // If Super Admin without a specific org inspection context, return global query
  if (req?.user?.isSuperAdmin && !req?.orgId) {
    return query;
  }

  const effectiveOrgId = req?.orgId || req?.user?.orgId;
  if (effectiveOrgId) {
    query.orgId = effectiveOrgId;
  }

  return query;
};

export const attachTenantOrgId = (req, payload = {}) => {
  const effectiveOrgId = req?.orgId || req?.user?.orgId;
  if (effectiveOrgId && !payload.orgId) {
    return { ...payload, orgId: effectiveOrgId };
  }
  return payload;
};
