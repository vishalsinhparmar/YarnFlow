import React, { useState, useEffect } from 'react';
import {
  Building2, Phone, Mail, Globe, FileText, MapPin, Save,
  Loader2, CheckCircle, AlertCircle, Plus, Trash2, Info
} from 'lucide-react';
import { companyProfileAPI } from '../services/companyProfileAPI';

const SECTION = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
      <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-orange-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-white placeholder-gray-400';

const CompanyProfilePage = () => {
  const [form, setForm] = useState({
    companyName: '',
    tagline: '',
    headOfficeAddress: '',
    branchOfficeAddress: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    altPhone: '',
    email: '',
    website: '',
    gstin: '',
    msmeNo: '',
    panNo: '',
    udyamNo: '',
    challanTermsAndConditions: [],
    challanFooterNote: 'Computer-generated delivery challan',
    signatureLabel: 'For',
    primaryColor: '#0891b2'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load profile on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await companyProfileAPI.get();
        if (res.success && res.data) {
          const d = res.data;
          setForm({
            companyName: d.companyName || '',
            tagline: d.tagline || '',
            headOfficeAddress: d.headOfficeAddress || '',
            branchOfficeAddress: d.branchOfficeAddress || '',
            city: d.city || '',
            state: d.state || '',
            pincode: d.pincode || '',
            phone: d.phone || '',
            altPhone: d.altPhone || '',
            email: d.email || '',
            website: d.website || '',
            gstin: d.gstin || '',
            msmeNo: d.msmeNo || '',
            panNo: d.panNo || '',
            udyamNo: d.udyamNo || '',
            challanTermsAndConditions: (d.challanTermsAndConditions || []).filter(t => t && t.trim()),
            challanFooterNote: d.challanFooterNote || 'Computer-generated delivery challan',
            signatureLabel: d.signatureLabel || 'For',
            primaryColor: d.primaryColor || '#0891b2'
          });
        }
      } catch (err) {
        setError('Failed to load company profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccess('');
    setError('');
  };

  const handleTermChange = (index, value) => {
    const terms = [...form.challanTermsAndConditions];
    terms[index] = value;
    setForm(prev => ({ ...prev, challanTermsAndConditions: terms }));
  };

  const addTerm = () => {
    setForm(prev => ({
      ...prev,
      challanTermsAndConditions: [...prev.challanTermsAndConditions, '']
    }));
  };

  const removeTerm = (index) => {
    const terms = form.challanTermsAndConditions.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, challanTermsAndConditions: terms }));
  };

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      // Strip empty terms
      const payload = {
        ...form,
        challanTermsAndConditions: form.challanTermsAndConditions.filter(t => t.trim())
      };
      const res = await companyProfileAPI.update(payload);
      if (res.success) {
        setSuccess('Company profile saved successfully! PDFs will now use this information.');
      } else {
        setError(res.message || 'Failed to save company profile.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 rounded-full mb-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Company Profile</h1>
              </div>
              <p className="text-orange-100 ml-[52px] text-sm">
                This information appears on all delivery challans and PDFs
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-white hover:bg-orange-50 text-orange-600 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-5 h-5" /> Save Profile</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          All delivery challan PDFs will automatically use this company information.
          Update once — reflects everywhere instantly.
        </p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Company Identity */}
      <SECTION title="Company Identity" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Company Name" required>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Pavan Kumar Raj Kumar"
              value={form.companyName}
              onChange={e => handleChange('companyName', e.target.value)}
            />
          </Field>
          <Field label="Tagline / Short Description">
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Yarn & Fabric Traders"
              value={form.tagline}
              onChange={e => handleChange('tagline', e.target.value)}
            />
          </Field>
        </div>
      </SECTION>

      {/* Address */}
      <SECTION title="Address" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Head Office Address">
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Bajaji Road, Deoria (U.P.)"
              value={form.headOfficeAddress}
              onChange={e => handleChange('headOfficeAddress', e.target.value)}
            />
          </Field>
          <Field label="Branch Office Address">
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Chak Inayat, Bhadohi – 221 401"
              value={form.branchOfficeAddress}
              onChange={e => handleChange('branchOfficeAddress', e.target.value)}
            />
          </Field>
          <Field label="City">
            <input
              type="text"
              className={inputCls}
              placeholder="Deoria"
              value={form.city}
              onChange={e => handleChange('city', e.target.value)}
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              className={inputCls}
              placeholder="Uttar Pradesh"
              value={form.state}
              onChange={e => handleChange('state', e.target.value)}
            />
          </Field>
          <Field label="Pincode">
            <input
              type="text"
              className={inputCls}
              placeholder="274001"
              value={form.pincode}
              onChange={e => handleChange('pincode', e.target.value)}
            />
          </Field>
        </div>
      </SECTION>

      {/* Contact */}
      <SECTION title="Contact Information" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Primary Phone">
            <input
              type="text"
              className={inputCls}
              placeholder="9415203756"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
            />
          </Field>
          <Field label="Alternate Phone">
            <input
              type="text"
              className={inputCls}
              placeholder="Optional"
              value={form.altPhone}
              onChange={e => handleChange('altPhone', e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              placeholder="info@company.com"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
            />
          </Field>
          <Field label="Website">
            <input
              type="text"
              className={inputCls}
              placeholder="www.yourcompany.com"
              value={form.website}
              onChange={e => handleChange('website', e.target.value)}
            />
          </Field>
        </div>
      </SECTION>

      {/* Registrations */}
      <SECTION title="Tax & Registration Numbers" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="GST Number (GSTIN)">
            <input
              type="text"
              className={inputCls}
              placeholder="09ACBPA4526C1Z9"
              value={form.gstin}
              onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="MSME / Udyam Number">
            <input
              type="text"
              className={inputCls}
              placeholder="UP-66-0007062"
              value={form.msmeNo}
              onChange={e => handleChange('msmeNo', e.target.value)}
            />
          </Field>
          <Field label="PAN Number">
            <input
              type="text"
              className={inputCls}
              placeholder="XXXXX0000X"
              value={form.panNo}
              onChange={e => handleChange('panNo', e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Udyam Registration No.">
            <input
              type="text"
              className={inputCls}
              placeholder="UDYAM-UP-00-0000000"
              value={form.udyamNo}
              onChange={e => handleChange('udyamNo', e.target.value)}
            />
          </Field>
        </div>
      </SECTION>

      {/* Challan / PDF Settings */}
      <SECTION title="Delivery Challan Settings" icon={FileText}>
        <div className="space-y-5">
          {/* Terms & Conditions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Terms & Conditions <span className="text-gray-400 font-normal">(printed on challan)</span>
              </label>
              <div className="flex items-center gap-3">
                {form.challanTermsAndConditions.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      challanTermsAndConditions: [
                        'Goods once sold will not be taken back.',
                        'Received the goods in good conditions.',
                        'All disputes subject to local jurisdiction.'
                      ]
                    }))}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Use Default Terms
                  </button>
                )}
                <button
                  type="button"
                  onClick={addTerm}
                  className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Term
                </button>
              </div>
            </div>
            {form.challanTermsAndConditions.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                No terms added yet. Click <strong className="text-orange-500">Use Default Terms</strong> or <strong className="text-orange-500">Add Term</strong> to add terms that will appear on every challan PDF.
              </div>
            ) : (
              <div className="space-y-2">
                {form.challanTermsAndConditions.map((term, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
                    <input
                      type="text"
                      className={`${inputCls} flex-1`}
                      placeholder={`e.g. Goods once sold will not be taken back.`}
                      value={term}
                      onChange={e => handleTermChange(i, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeTerm(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Footer Note">
              <input
                type="text"
                className={inputCls}
                placeholder="Computer-generated delivery challan"
                value={form.challanFooterNote}
                onChange={e => handleChange('challanFooterNote', e.target.value)}
              />
            </Field>
            <Field label="Signature Label">
              <input
                type="text"
                className={inputCls}
                placeholder="For"
                value={form.signatureLabel}
                onChange={e => handleChange('signatureLabel', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </SECTION>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-5 h-5" /> Save Company Profile</>
          )}
        </button>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
