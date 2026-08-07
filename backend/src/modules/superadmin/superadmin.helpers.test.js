import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCompanyRequestInput, canTenantLogin } from './superadmin.helpers.js';

test('normalizeCompanyRequestInput validates required SaaS company onboarding fields', () => {
  const normalized = normalizeCompanyRequestInput({
    companyName: 'FreshPure Juices',
    businessEmail: 'contact@freshpure.com',
    phone: '+91 98765 43210',
    contactPerson: 'Rajesh Mehta',
    address: 'Plot 12, Industrial Estate',
    city: 'Nashik',
    state: 'Maharashtra',
    country: 'India',
    gstin: '27ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    companySize: '50-200',
    industry: 'Beverage Processing',
    website: 'https://freshpure.com',
    notes: 'Needs full ERP rollout',
  });

  assert.equal(normalized.companyName, 'FreshPure Juices');
  assert.equal(normalized.businessEmail, 'contact@freshpure.com');
  assert.equal(normalized.address, 'Plot 12, Industrial Estate');
  assert.equal(normalized.country, 'India');
  assert.equal(normalized.status, 'Pending');
});

test('canTenantLogin denies suspended or inactive organizations', () => {
  assert.equal(canTenantLogin({ status: 'Active' }, { isActive: true }), true);
  assert.equal(canTenantLogin({ status: 'Suspended' }, { isActive: true }), false);
  assert.equal(canTenantLogin({ status: 'Active' }, { isActive: false }), false);
});
