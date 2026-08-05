import { Icon } from '@iconify/react';

export default function HelpPanel() {
  const faqs = [
    { q: 'How do I add a new employee?', a: 'Navigate to HR & RFID Attendance → Employee Master. Click "Add New Employee" and fill all required fields including RFID Card Number, Department, and Shift assignment.' },
    { q: 'How do I record RFID attendance?', a: 'Go to HR & RFID Attendance → RFID Attendance. You can use the "Simulate RFID Card Scan" button for testing or configure a hardware ZKTeco/eSSL device under Hardware Device Manager.' },
    { q: 'How do I start a production batch?', a: 'Navigate to Production & Machines → Production Orders. Create a new production order linked to a Recipe BOM, then assign a machine line and press "Start Production".' },
    { q: 'How do I approve a leave application?', a: 'Go to HR & RFID Attendance → Leave Management. Pending applications show amber "Pending" badges. Click "Approve" or "Reject" in the Approval Workflow column.' },
    { q: 'How do I export payroll data?', a: 'Open HR & RFID Attendance → Payroll & Salary. Use the Export toolbar buttons on the top right to download as CSV, PDF, or DOCX document.' },
    { q: 'How do I log a quality test?', a: 'Navigate to Quality & Logistics → Quality Control. Click "Record QC Check" and enter the batch number, parameter name, measured value, and pass/fail result.' },
    { q: 'How do I add a new supplier?', a: 'Go to Materials & Inventory → Suppliers & Vendors. Click "Register Supplier" and enter the company name, GSTIN, contact person, payment terms, and material category.' },
    { q: 'How do I generate sales invoices?', a: 'Navigate to Sales & CRM → Sales & Invoices. Create a sales order first, then convert it to an invoice by clicking "Generate Invoice" on the order row.' },
  ];

  const shortcuts = [
    { key: 'Alt + D', action: 'Executive Dashboard' },
    { key: 'Alt + P', action: 'Production Orders' },
    { key: 'Alt + M', action: 'Machine Master' },
    { key: 'Alt + Q', action: 'Quality Control' },
    { key: 'Alt + S', action: 'Sales & Invoices' },
    { key: 'Alt + H', action: 'Employee Master' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/40 rounded-xl flex items-center justify-center">
            <Icon icon="mdi:help-circle-outline" className="text-orange-400 text-xl" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">JuiceFlow ERP — Help Center & User Guide</h2>
            <p className="text-xs text-slate-400">Quick reference for all ERP modules, keyboard shortcuts, and FAQ for your team</p>
          </div>
        </div>
      </div>

      {/* Quick Module Reference */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Icon icon="mdi:map-outline" className="text-orange-500" /> Module Navigation Guide
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { cat: 'Executive & System', modules: ['Dashboard', 'Organization', 'Users', 'Roles', 'Factories', 'Departments', 'Audit Logs', 'Settings'], icon: 'mdi:view-dashboard-outline', color: 'orange' },
            { cat: 'HR & RFID Attendance', modules: ['Employee Master', 'RFID Attendance', 'Shift Management', 'Leave Management', 'Payroll & Salary'], icon: 'mdi:account-badge-outline', color: 'blue' },
            { cat: 'Sales & CRM', modules: ['CRM Overview', 'Lead Management', 'Customers & Dealers', 'Sales & Invoices', 'Finance & Ledger'], icon: 'mdi:bullseye-arrow', color: 'emerald' },
            { cat: 'Production & Quality', modules: ['Production Planning', 'Production Orders', 'Batch Management', 'Machine Master', 'Quality Control', 'Lab Reports'], icon: 'mdi:cogs', color: 'violet' },
          ].map((section) => (
            <div key={section.cat} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon={section.icon} className="text-orange-500 text-sm" />
                <span className="text-xs font-extrabold text-slate-800">{section.cat}</span>
              </div>
              <ul className="space-y-1">
                {section.modules.map(m => (
                  <li key={m} className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-orange-400 inline-block"></span>{m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Icon icon="mdi:frequently-asked-questions" className="text-orange-500" /> Frequently Asked Questions
        </h3>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200/80 rounded-xl p-4 hover:border-orange-200 hover:bg-orange-50/30 transition">
              <p className="text-xs font-extrabold text-slate-900 mb-1 flex items-start gap-2">
                <span className="text-orange-500 font-mono font-extrabold">Q{idx + 1}.</span> {faq.q}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed pl-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Icon icon="mdi:keyboard-outline" className="text-orange-500" /> Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <kbd className="bg-slate-900 text-orange-400 font-mono text-[10px] px-2 py-1 rounded-lg font-bold border border-slate-700 shadow-sm">{s.key}</kbd>
              <span className="text-xs text-slate-700 font-semibold">{s.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Support Contact */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Icon icon="mdi:headset" className="text-orange-500" /> Technical Support & Contact
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center space-y-2">
            <Icon icon="mdi:email-outline" className="text-orange-500 text-2xl mx-auto" />
            <p className="text-xs font-extrabold text-slate-800">Email Support</p>
            <p className="text-[11px] text-slate-500 font-mono">support@juiceflow-erp.com</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center space-y-2">
            <Icon icon="mdi:phone-outline" className="text-orange-500 text-2xl mx-auto" />
            <p className="text-xs font-extrabold text-slate-800">Technical Helpline</p>
            <p className="text-[11px] text-slate-500 font-mono">+91 98000 00000</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center space-y-2">
            <Icon icon="mdi:clock-outline" className="text-orange-500 text-2xl mx-auto" />
            <p className="text-xs font-extrabold text-slate-800">Support Hours</p>
            <p className="text-[11px] text-slate-500 font-mono">Mon–Sat 9AM – 8PM IST</p>
          </div>
        </div>
      </div>
    </div>
  );
}
