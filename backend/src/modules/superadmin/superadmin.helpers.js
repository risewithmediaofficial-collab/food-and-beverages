export const normalizeCompanyRequestInput = (payload = {}) => {
  const companyName = String(payload.companyName || '').trim();
  const businessEmail = String(payload.businessEmail || '').trim().toLowerCase();
  const phone = String(payload.phone || '').trim();
  const contactPerson = String(payload.contactPerson || '').trim();
  const industry = String(payload.industry || 'Beverage & Juice Processing').trim();
  const address = String(payload.address || '').trim();
  const city = String(payload.city || '').trim();
  const state = String(payload.state || '').trim();
  const country = String(payload.country || 'India').trim();
  const gstin = String(payload.gstin || '').trim().toUpperCase();
  const pan = String(payload.pan || '').trim().toUpperCase();
  const companySize = String(payload.companySize || '1-50').trim();
  const website = String(payload.website || '').trim();
  const notes = String(payload.notes || '').trim();

  if (!companyName || !businessEmail || !phone || !contactPerson) {
    const error = new Error('Company Name, Business Email, Phone, and Contact Person are required.');
    error.statusCode = 400;
    throw error;
  }

  return {
    companyName,
    businessEmail,
    phone,
    contactPerson,
    industry,
    address,
    city,
    state,
    country,
    gstin,
    pan,
    companySize,
    website,
    notes,
    requestType: payload.requestType || 'Free Demo',
    selectedPlan: payload.selectedPlan || (payload.requestType === 'Paid Plan' ? 'Growth Plan (₹4,999/mo)' : 'Free Demo (14 Days)'),
    paymentStatus: payload.requestType === 'Paid Plan' ? 'Pending Verification' : 'Demo Access',
    modulesRequested: Array.isArray(payload.modulesRequested) && payload.modulesRequested.length ? payload.modulesRequested : ['Inventory Management', 'Production Planning', 'Sales & Billing'],
    status: 'Pending',
  };
};

export const canTenantLogin = (organization = {}, user = {}) => {
  const orgStatus = String(organization?.status || 'Active').toLowerCase();
  const userActive = Boolean(user?.isActive !== false);
  return orgStatus === 'active' && userActive;
};
