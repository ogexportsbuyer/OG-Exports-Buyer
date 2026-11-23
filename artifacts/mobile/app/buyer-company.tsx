import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetBuyerCompanyContactsQueryKey,
  getGetBuyerCompanyQueryKey,
  useCreateBuyerCompanyContact,
  useDeleteBuyerCompanyContact,
  useGetBuyerCompany,
  useGetBuyerCompanyContacts,
  useUpdateBuyerCompany,
  useUpdateBuyerCompanyContact,
  useUpdateBuyerCompanyPreferences,
  useUploadBuyerCompanyKycDocument,
} from '@workspace/api-client-react';
import { BuyerAuthGate } from '@/components/BuyerAuthGate';
import { BrandedConfirmDialog } from '@/components/BrandedConfirmDialog';
import { Action, Card, ErrorState, Field, LoadingCard, Screen, Status } from '@/components/InvestorUI';
import { CountryPicker } from '@/components/CountryPicker';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { INVESTOR_DOCUMENT_MIME_TYPES } from '@/lib/upload-rules';
import { uploadInvestorFile } from '@/lib/file-upload';
import { first, list, messageOf, record } from '@/lib/data';

type CompanyTab = 'company' | 'verification' | 'contacts' | 'preferences';
type CompanyFields = {
  company_name: string;
  registration_no: string;
  import_license: string;
  tax_id: string;
  business_type: string;
  annual_volume: string;
  website: string;
  country: string;
  city: string;
  address: string;
};
type ContactFields = { name: string; title: string; email: string; phone: string; is_primary: boolean };

const emptyCompany: CompanyFields = {
  company_name: '', registration_no: '', import_license: '', tax_id: '',
  business_type: '', annual_volume: '', website: '', country: '', city: '', address: '',
};
const emptyContact: ContactFields = { name: '', title: '', email: '', phone: '', is_primary: false };
const kycSteps = ['company_registration', 'import_license', 'tax_registration', 'kyc_documents', 'banking_details'];

function csvValues(value: string) {
  return [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))];
}

function joinNames(value: unknown) {
  if (!Array.isArray(value)) return '';
  return value
    .map(item => typeof item === 'string' ? item : first(record(item), ['name']))
    .filter(Boolean)
    .join(', ');
}

export default function BuyerCompany() {
  const colors = useColors();
  const { token, apiOrigin } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CompanyTab>('company');
  const [companyFields, setCompanyFields] = useState<CompanyFields>(emptyCompany);
  const [preferences, setPreferences] = useState({ payment_terms: '', incoterm: '', shipping: '', ports: '', commodities: '' });
  const [contactFields, setContactFields] = useState<ContactFields>(emptyContact);
  const [editingContact, setEditingContact] = useState<number | null>(null);
  const [contactToDelete, setContactToDelete] = useState<{ id: number; name: string } | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploadingType, setUploadingType] = useState('');
  const companyQuery = useGetBuyerCompany({
    query: { queryKey: getGetBuyerCompanyQueryKey(), enabled: !!token, staleTime: 30_000 },
  });
  const contactsQuery = useGetBuyerCompanyContacts({
    query: { queryKey: getGetBuyerCompanyContactsQueryKey(), enabled: !!token, staleTime: 30_000 },
  });
  const saveCompany = useUpdateBuyerCompany();
  const savePreferences = useUpdateBuyerCompanyPreferences();
  const createContact = useCreateBuyerCompanyContact();
  const updateContact = useUpdateBuyerCompanyContact();
  const deleteContact = useDeleteBuyerCompanyContact();
  const uploadKyc = useUploadBuyerCompanyKycDocument();
  const companyPayload = record(record(companyQuery.data).data);
  const company = record(companyPayload.company);
  const prefs = record(companyPayload.trade_preferences);
  const contacts = contactsQuery.data ? list(record(contactsQuery.data).data) : list(companyPayload.contacts);
  const kyc = record(companyPayload.kyc);
  const steps = list(kyc.steps);

  useEffect(() => {
    if (!companyQuery.isSuccess) return;
    setCompanyFields({
      company_name: first(company, ['company_name']),
      registration_no: first(company, ['registration_no']),
      import_license: first(company, ['import_license']),
      tax_id: first(company, ['tax_id']),
      business_type: first(company, ['business_type']),
      annual_volume: first(company, ['annual_volume']),
      website: first(company, ['website']),
      country: first(company, ['country']),
      city: first(company, ['city']),
      address: first(company, ['address']),
    });
    setPreferences({
      payment_terms: first(prefs, ['payment_terms']),
      incoterm: first(prefs, ['incoterm']),
      shipping: first(prefs, ['shipping']),
      ports: joinNames(prefs.ports),
      commodities: joinNames(prefs.commodities),
    });
  }, [companyQuery.data, companyQuery.isSuccess]);

  const verificationStatus = useMemo(() => first(record(kyc.application), ['status'], 'Not started'), [kyc.application]);

  async function refreshCompany() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetBuyerCompanyQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetBuyerCompanyContactsQueryKey() }),
    ]);
  }

  async function saveCompanyDetails() {
    setError('');
    setNotice('');
    try {
      await saveCompany.mutateAsync({ data: companyFields });
      await refreshCompany();
      setNotice('Company details saved.');
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function saveTradePreferences() {
    setError('');
    setNotice('');
    try {
      await savePreferences.mutateAsync({
        data: {
          payment_terms: preferences.payment_terms.trim(),
          incoterm: preferences.incoterm.trim(),
          shipping: preferences.shipping.trim(),
          ports: csvValues(preferences.ports),
          commodities: csvValues(preferences.commodities),
        },
      });
      await refreshCompany();
      setNotice('Trade preferences saved.');
    } catch (err) {
      setError(messageOf(err));
    }
  }

  function beginEditContact(contact: Record<string, unknown>) {
    setEditingContact(Number(first(contact, ['id'])));
    setContactFields({
      name: first(contact, ['name']),
      title: first(contact, ['title']),
      email: first(contact, ['email']),
      phone: first(contact, ['phone']),
      is_primary: Boolean(contact.is_primary),
    });
    setShowContactForm(true);
    setError('');
    setNotice('');
  }

  async function saveContact() {
    setError('');
    setNotice('');
    try {
      if (!contactFields.name.trim()) throw new Error('Enter the contact person’s name.');
      const data = { ...contactFields, name: contactFields.name.trim(), title: contactFields.title.trim(), email: contactFields.email.trim(), phone: contactFields.phone.trim() };
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact, data });
      } else {
        await createContact.mutateAsync({ data });
      }
      await refreshCompany();
      setContactFields(emptyContact);
      setEditingContact(null);
      setShowContactForm(false);
      setNotice(editingContact ? 'Contact updated.' : 'Contact added.');
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function confirmDeleteContact() {
    if (!contactToDelete) return;
    try {
      await deleteContact.mutateAsync({ id: contactToDelete.id });
      await refreshCompany();
      setNotice('Company contact removed.');
      setContactToDelete(null);
    } catch (err) {
      setContactToDelete(null);
      setError(messageOf(err));
    }
  }

  async function pickAndUpload(docType: string) {
    setError('');
    setNotice('');
    setUploadingType(docType);
    try {
      let uploadSource: string | ExpoFile;
      let fileName: string;
      let mimeType: string;
      if (Platform.OS === 'web') {
        const result = await DocumentPicker.getDocumentAsync({ type: [...INVESTOR_DOCUMENT_MIME_TYPES], copyToCacheDirectory: true });
        if (result.canceled) return;
        const file = result.assets[0];
        if (!file) throw new Error('No file was selected. Try again.');
        uploadSource = file.uri;
        fileName = file.name;
        mimeType = file.mimeType ?? 'application/octet-stream';
      } else {
        const result = await ExpoFile.pickFileAsync({ mimeTypes: [...INVESTOR_DOCUMENT_MIME_TYPES] });
        if (result.canceled) return;
        uploadSource = result.result;
        fileName = result.result.name;
        mimeType = result.result.type || 'application/octet-stream';
      }
      const path = await uploadInvestorFile(uploadSource, fileName, mimeType, 'kyc', apiOrigin);
      const response = record(await uploadKyc.mutateAsync({ data: { doc_type: docType, path, original_name: fileName } }));
      setNotice(first(response, ['message'], 'File submitted for verification review.'));
      await refreshCompany();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setUploadingType('');
    }
  }

  if (!token) {
    return <BuyerAuthGate title="Company profile" body="Sign in to manage company details, verification documents, contacts, and trade preferences." returnTo="/buyer-company" />;
  }

  const tabs: [CompanyTab, string][] = [
    ['company', 'Company'],
    ['verification', 'Verification'],
    ['contacts', 'Contacts'],
    ['preferences', 'Trade preferences'],
  ];

  return (
    <Screen title="Company profile" subtitle="Company information and trade setup" refreshable>
      <BrandedConfirmDialog
        visible={contactToDelete !== null}
        eyebrow="COMPANY PROFILE · CONTACTS"
        title="Remove this contact?"
        message="This person will no longer be listed as a company contact."
        context={contactToDelete?.name}
        icon="user-x"
        tone="danger"
        confirmLabel="Remove contact"
        busyLabel="Removing…"
        busy={deleteContact.isPending}
        onCancel={() => setContactToDelete(null)}
        onConfirm={() => void confirmDeleteContact()}
        testID="buyer-contact-remove-confirmation"
      />
      {companyQuery.isLoading ? <LoadingCard label="Loading company profile…" lines={3} /> : null}
      {companyQuery.isError ? <ErrorState message="Company profile could not be loaded." error={companyQuery.error} onRetry={() => void companyQuery.refetch()} /> : null}
      {companyQuery.isSuccess ? (
        <>
          <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.secondary, marginBottom: 15 }}>
            {tabs.map(([value, label]) => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={{ flex: 1, minHeight: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, backgroundColor: tab === value ? colors.card : 'transparent', borderWidth: tab === value ? 1 : 0, borderColor: colors.border }}>
                <Text style={{ color: tab === value ? colors.primary : colors.mutedForeground, fontSize: 10, fontWeight: '800' }}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12, lineHeight: 18, marginBottom: 9 }}>{error}</Text> : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primary, fontSize: 12, marginBottom: 9 }}>{notice}</Text> : null}

          {tab === 'company' ? (
            <Card style={{ padding: 15 }}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 12 }}>Business details</Text>
              <Field label="Company name" value={companyFields.company_name} onChangeText={company_name => setCompanyFields(value => ({ ...value, company_name }))} />
              <Field label="Company registration number" value={companyFields.registration_no} onChangeText={registration_no => setCompanyFields(value => ({ ...value, registration_no }))} />
              <Field label="Import license" value={companyFields.import_license} onChangeText={import_license => setCompanyFields(value => ({ ...value, import_license }))} />
              <Field label="Tax ID / VAT number" value={companyFields.tax_id} onChangeText={tax_id => setCompanyFields(value => ({ ...value, tax_id }))} />
              <Field label="Business type" value={companyFields.business_type} onChangeText={business_type => setCompanyFields(value => ({ ...value, business_type }))} placeholder="Importer, distributor, manufacturer…" />
              <Field label="Annual purchase volume" value={companyFields.annual_volume} onChangeText={annual_volume => setCompanyFields(value => ({ ...value, annual_volume }))} />
              <Field label="Company website" value={companyFields.website} onChangeText={website => setCompanyFields(value => ({ ...value, website }))} autoCapitalize="none" />
              <CountryPicker label="Country" value={companyFields.country} onChange={country => setCompanyFields(value => ({ ...value, country }))} placeholder="Select country" testID="buyer-company-country" />
              <Field label="City" value={companyFields.city} onChangeText={city => setCompanyFields(value => ({ ...value, city }))} />
              <Field label="Business address" value={companyFields.address} onChangeText={address => setCompanyFields(value => ({ ...value, address }))} multiline />
              <Action title="Save company details" icon="save" loading={saveCompany.isPending} onPress={() => void saveCompanyDetails()} testID="buyer-company-save" />
            </Card>
          ) : null}

          {tab === 'verification' ? (
            <>
              <Card style={{ padding: 15, marginBottom: 11 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800' }}>Verification status</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 5 }}>Your uploaded records are reviewed by OG Exports compliance.</Text>
                  </View>
                  <Status value={verificationStatus} />
                </View>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 12 }}>{first(companyPayload, ['verification_pct'], '0')}% complete</Text>
              </Card>
              {steps.map((step, index) => {
                const docType = first(step, ['doc_type'], kycSteps[index] ?? '');
                const stepDocument = record(step.document);
                const fileName = first(stepDocument, ['original_name']);
                return (
                  <Card key={docType || String(index)} style={{ padding: 14, marginBottom: 9 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '700', flex: 1 }}>{first(step, ['label'], 'Verification document')}</Text>
                      <Status value={first(step, ['status'], 'Pending')} />
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, marginTop: 6 }}>{first(step, ['desc'])}</Text>
                    {fileName ? <Text style={{ color: colors.primary, fontSize: 10, marginTop: 6 }}>{fileName}</Text> : null}
                    <Action
                      title={uploadingType === docType ? 'Uploading…' : fileName ? 'Replace document' : 'Upload document'}
                      icon="upload"
                      secondary={!!fileName}
                      disabled={!!uploadingType}
                      loading={uploadingType === docType}
                      onPress={() => void pickAndUpload(docType)}
                    />
                  </Card>
                );
              })}
            </>
          ) : null}

          {tab === 'contacts' ? (
            <>
              {contactsQuery.isError ? <ErrorState message="Company contacts could not be loaded." error={contactsQuery.error} onRetry={() => void contactsQuery.refetch()} /> : null}
              {contacts.map((contact, index) => {
                const id = Number(first(contact, ['id']));
                return (
                  <Card key={first(contact, ['id'], String(index))} style={{ padding: 14, marginBottom: 9 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="user" size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 13 }}>{first(contact, ['name'], 'Contact')}</Text>
                        <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 3 }}>{first(contact, ['title'], 'Company contact')}</Text>
                      </View>
                      {contact.is_primary ? <Status value="Primary" /> : null}
                    </View>
                    {first(contact, ['email']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 10 }}>{first(contact, ['email'])}</Text> : null}
                    {first(contact, ['phone']) ? <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>{first(contact, ['phone'])}</Text> : null}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <Pressable accessibilityRole="button" onPress={() => beginEditContact(contact)}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 11 }}>Edit</Text></Pressable>
                      {Number.isInteger(id) && id > 0 ? <Pressable accessibilityRole="button" onPress={() => { setError(''); setContactToDelete({ id, name: first(contact, ['name'], 'Contact') }); }}><Text style={{ color: colors.destructive, fontWeight: '700', fontSize: 11 }}>Remove</Text></Pressable> : null}
                    </View>
                  </Card>
                );
              })}
              {!contacts.length && !contactsQuery.isLoading ? <Card style={{ padding: 14, marginBottom: 10 }}><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>No additional company contacts yet.</Text></Card> : null}
              {showContactForm ? (
                <Card style={{ padding: 14, marginBottom: 11 }}>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 10 }}>{editingContact ? 'Edit contact' : 'Add contact'}</Text>
                  <Field label="Name" value={contactFields.name} onChangeText={name => setContactFields(value => ({ ...value, name }))} />
                  <Field label="Role or title" value={contactFields.title} onChangeText={title => setContactFields(value => ({ ...value, title }))} />
                  <Field label="Email" value={contactFields.email} onChangeText={email => setContactFields(value => ({ ...value, email }))} keyboardType="email-address" />
                  <Field label="Phone" value={contactFields.phone} onChangeText={phone => setContactFields(value => ({ ...value, phone }))} keyboardType="phone-pad" />
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: contactFields.is_primary }} onPress={() => setContactFields(value => ({ ...value, is_primary: !value.is_primary }))} style={{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name={contactFields.is_primary ? 'check-square' : 'square'} size={16} color={colors.primary} />
                    <Text style={{ color: colors.foreground, fontSize: 12 }}>Set as primary contact</Text>
                  </Pressable>
                  <Action title={editingContact ? 'Save contact' : 'Add contact'} icon="save" loading={createContact.isPending || updateContact.isPending} onPress={() => void saveContact()} />
                  <Action title="Cancel" secondary onPress={() => { setShowContactForm(false); setEditingContact(null); setContactFields(emptyContact); }} />
                </Card>
              ) : (
                <Action title="Add company contact" icon="user-plus" onPress={() => { setContactFields(emptyContact); setEditingContact(null); setShowContactForm(true); setError(''); setNotice(''); }} />
              )}
            </>
          ) : null}

          {tab === 'preferences' ? (
            <Card style={{ padding: 15 }}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 6 }}>Preferred trade terms</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginBottom: 10 }}>These help prefill future quote requests. Enter multiple ports or commodities separated by commas.</Text>
              <Field label="Payment terms" value={preferences.payment_terms} onChangeText={payment_terms => setPreferences(value => ({ ...value, payment_terms }))} placeholder="LC at Sight" />
              <Field label="Preferred incoterm" value={preferences.incoterm} onChangeText={incoterm => setPreferences(value => ({ ...value, incoterm }))} placeholder="FOB" />
              <Field label="Shipping preference" value={preferences.shipping} onChangeText={shipping => setPreferences(value => ({ ...value, shipping }))} />
              <Field label="Preferred ports" value={preferences.ports} onChangeText={ports => setPreferences(value => ({ ...value, ports }))} placeholder="Only ports in your company country" />
              <Field label="Interested commodities" value={preferences.commodities} onChangeText={commodities => setPreferences(value => ({ ...value, commodities }))} />
              <Action title="Save trade preferences" icon="save" loading={savePreferences.isPending} onPress={() => void saveTradePreferences()} />
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
