import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Clock, ShieldCheck } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';
import { StatusBadge, SkeletonBox } from '@/components/comman/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useUpload } from '@/hooks/upload/useUpload';
import { useStoreVerification, useVerificationActions } from '@/hooks/store/useStoreVerification';
import type { VerificationDocumentType } from '@/api/services/storeVerification';
import {
  BusinessInfoFields, DocumentUploadCard, requiredDocumentTypesFor,
  type BusinessInfoValues,
} from '@/features/seller/components/verification/VerificationFormFields';

const HISTORY_ACTION_LABEL: Record<string, string> = {
  submitted: 'Submitted for review',
  resubmitted: 'Resubmitted after rejection',
  under_review: 'Marked under review by admin',
  approved: 'Approved — store went live',
  rejected: 'Rejected',
};

const EMPTY_BUSINESS_INFO: BusinessInfoValues = {
  businessType: null,
  legalBusinessName: '',
  registrationNumber: '',
  taxId: '',
  businessAddress: '',
  idDocumentType: null,
  authorizedContact: { name: null, designation: null, email: null, phone: null },
};

const ALL_DOC_TYPES: VerificationDocumentType[] = [
  'owner_id', 'address_proof', 'business_registration', 'tax_registration', 'authorization_proof',
];

export function StoreVerification() {
  usePageTitle('Business Verification');
  const { storeId } = useStoreWorkspace();
  const { data, loading, error: loadError, refetch } = useStoreVerification(storeId);
  const { save, attachDocument, submit, saving, uploadingType, submitting, error, setError } = useVerificationActions(storeId);
  const { upload } = useUpload('private');

  const [values, setValues] = useState<BusinessInfoValues>(EMPTY_BUSINESS_INFO);
  const [saved, setSaved] = useState(false);

  useEffect(() => { refetch(); }, [refetch]);

  useEffect(() => {
    if (!data) return;
    setValues({
      businessType: data.businessType,
      legalBusinessName: data.legalBusinessName ?? '',
      registrationNumber: data.registrationNumber ?? '',
      taxId: data.taxId ?? '',
      businessAddress: data.businessAddress ?? '',
      idDocumentType: data.idDocumentType,
      authorizedContact: data.authorizedContact ?? EMPTY_BUSINESS_INFO.authorizedContact,
    });
  }, [data]);

  if (loading && !data) {
    return (
      <>
        <StorePageHeader title="Business Verification" subtitle="Required before your store can go live on the marketplace." />
        <div className="px-4 sm:px-7 py-6 flex flex-col gap-4">
          <SkeletonBox height={100} />
          <SkeletonBox height={300} />
        </div>
      </>
    );
  }

  if (loadError || !data) {
    return (
      <>
        <StorePageHeader title="Business Verification" subtitle="Required before your store can go live on the marketplace." />
        <div className="px-4 sm:px-7 py-6">
          <div className="bg-error-bg border border-error-border rounded-lg px-4 py-3 text-[13px] text-error">{loadError || 'Failed to load.'}</div>
        </div>
      </>
    );
  }

  const editable = data.storeStatus === 'pending' || data.storeStatus === 'rejected';
  const required = requiredDocumentTypesFor(values.businessType);
  const docByType = new Map(data.documents.map(d => [d.type, d]));
  const missingRequired = required.filter(t => !docByType.has(t));

  const handleSaveDraft = async () => {
    setSaved(false);
    const ok = await save({
      businessType: values.businessType ?? undefined,
      legalBusinessName: values.legalBusinessName,
      registrationNumber: values.registrationNumber,
      taxId: values.taxId,
      businessAddress: values.businessAddress,
      idDocumentType: values.idDocumentType ?? undefined,
      authorizedContact: values.authorizedContact,
    });
    if (ok) { setSaved(true); refetch(); }
    return ok;
  };

  const handleUpload = async (type: VerificationDocumentType, file: File) => {
    setError('');
    try {
      const uploaded = await upload(file, 'kyc_document');
      const ok = await attachDocument(type, { publicId: uploaded.publicId, resourceType: uploaded.resourceType, fileName: file.name });
      if (ok) refetch();
    } catch {
      setError('Failed to upload document. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Persist the latest edited fields before locking the submission in.
    const savedOk = await handleSaveDraft();
    if (!savedOk) return;
    const ok = await submit();
    if (ok) refetch();
  };

  const canSubmit = editable && missingRequired.length === 0
    && values.businessType != null && values.legalBusinessName.trim().length > 0 && values.businessAddress.trim().length > 0
    && values.idDocumentType != null && !!values.authorizedContact.name && !!values.authorizedContact.email && !!values.authorizedContact.phone;

  return (
    <>
      <StorePageHeader title="Business Verification" subtitle="Required before your store can go live on the marketplace." />
      <div className="px-4 sm:px-7 py-6 flex flex-col gap-5 max-w-[720px]">

        <div className="bg-white border border-bone rounded-[14px] p-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-brand-pale-orange flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-brand-orange" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-carbon">Verification Status</p>
              <p className="text-[11.5px] text-slate">{editable ? 'Complete every required field and document, then submit for review.' : 'Your submission is locked while under review.'}</p>
            </div>
          </div>
          <StatusBadge status={data.storeStatus} />
        </div>

        {data.storeStatus === 'rejected' && data.rejectionReason && (
          <div className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={14} className="text-error shrink-0 mt-[2px]" />
            <div>
              <p className="text-[12.5px] font-semibold text-error mb-[2px]">Your last submission was rejected</p>
              <p className="text-[12.5px] text-error">{data.rejectionReason}</p>
              <p className="text-[11.5px] text-error/80 mt-1">Correct the details below and submit again.</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-bone rounded-[14px] p-5">
          <p className="text-[13px] font-bold text-carbon mb-4">Business Information</p>
          <BusinessInfoFields values={values} onChange={setValues} disabled={!editable || saving || submitting} />
          {editable && (
            <div className="flex items-center gap-3 mt-4">
              <Button variant="outline" size="sm" onClick={handleSaveDraft} loading={saving}>Save Draft</Button>
              {saved && <span className="text-[11.5px] text-success font-medium inline-flex items-center gap-1"><Check size={12} /> Saved</span>}
            </div>
          )}
        </div>

        <div className="bg-white border border-bone rounded-[14px] p-5">
          <p className="text-[13px] font-bold text-carbon mb-4">Documents</p>
          <div className="flex flex-col gap-3">
            {ALL_DOC_TYPES
              .filter(t => required.includes(t) || t === 'authorization_proof')
              .map(type => (
                <DocumentUploadCard
                  key={type}
                  type={type}
                  required={required.includes(type)}
                  doc={docByType.get(type)}
                  uploading={uploadingType === type}
                  disabled={!editable || submitting}
                  onUpload={file => handleUpload(type, file)}
                />
              ))}
          </div>
        </div>

        {error && (
          <div className="bg-error-bg border border-error-border rounded-lg px-4 py-2.5 text-[12.5px] text-error">{error}</div>
        )}

        {editable && (
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
            {data.storeStatus === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
          </Button>
        )}

        {data.history.length > 0 && (
          <div className="bg-white border border-bone rounded-[14px] p-5">
            <p className="text-[13px] font-bold text-carbon mb-3">History</p>
            <div className="flex flex-col gap-2">
              {data.history.slice().reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Clock size={12} className="text-slate mt-[3px] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-charcoal">
                      <span className="font-semibold">{HISTORY_ACTION_LABEL[h.action] ?? h.action}</span>
                      {' — '}<span className="text-slate">{new Date(h.at).toLocaleString()}</span>
                    </p>
                    {h.note && <p className="text-[11.5px] text-slate mt-[1px]">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
