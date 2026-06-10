import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { FolderOpen, Archive, FileText, Sparkles } from 'lucide-react';

// ── Types & Data ──────────────────────────────────────────────────────────────
type FileStatus  = 'Ready' | 'Uploading';
type LicenseType = 'personal' | 'classroom' | 'school' | 'commercial';

interface UploadFile {
  name: string; size: string; status: FileStatus; progress?: number;
}

const INITIAL_FILES: UploadFile[] = [
  { name: 'Grade5Math_LessonPlans.pdf',  size: '14.2 MB', status: 'Ready'     },
  { name: 'Grade5Math_Worksheets.zip',   size: '38.7 MB', status: 'Ready'     },
  { name: 'Grade5Math_Assessments.pdf',  size: '8.4 MB',  status: 'Uploading', progress: 62 },
  { name: 'Grade5Math_AnswerKeys.pdf',   size: '5.1 MB',  status: 'Ready'     },
];

const LICENSES: { id: LicenseType; label: string; desc: string }[] = [
  { id: 'personal',   label: 'Personal Use Only',  desc: 'Buyer uses for themselves only'  },
  { id: 'classroom',  label: 'Single Classroom',   desc: 'One teacher, one classroom'      },
  { id: 'school',     label: 'School License',     desc: 'Entire school building'          },
  { id: 'commercial', label: 'Commercial License', desc: 'Buyers can use in their business'},
];

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E8E6DC',
  borderRadius: 10, padding: '20px 22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};
const sectionTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#141413',
  marginBottom: 16, fontFamily: poppins,
};
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: '1px solid #E8E6DC', borderRadius: 8,
  background: '#fff', color: '#2C2A28', outline: 'none',
  cursor: 'pointer', fontFamily: poppins, boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#4A4945',
  marginBottom: 5, display: 'block', fontFamily: poppins,
};

// ── Component ─────────────────────────────────────────────────────────────────
export function DigitalUpload() {
  usePageTitle('Digital Upload');
  const [files,    setFiles]    = useState<UploadFile[]>(INITIAL_FILES);
  const [license,  setLicense]  = useState<LicenseType>('classroom');
  const [pdfStamp, setPdfStamp] = useState(true);
  const [message,  setMessage]  = useState(
    'Thank you for your purchase! Your download link is above. Please reach out if you have any questions.'
  );

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  return (
    <>
      <SellerPageHeader
        title="Digital Product Upload"
        subtitle="Upload files, configure delivery and license settings."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Save Draft
            </button>
            <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              Publish
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', fontFamily: poppins }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

          {/* ── LEFT column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Upload Files */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Upload Files</p>

              {/* Dropzone */}
              <div style={{
                border: '2px dashed #D97757', borderRadius: 10,
                background: '#FBECE4', padding: '40px 24px',
                textAlign: 'center', cursor: 'pointer', marginBottom: 20,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <FolderOpen size={44} style={{ color: '#D97757', marginBottom: 10 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#D97757', marginBottom: 6 }}>
                  Drop your files here
                </p>
                <p style={{ fontSize: 12, color: '#B08070', marginBottom: 16 }}>
                  PDF, ZIP, MP3, MP4, PNG, PSD and more. Max 5GB per file.
                </p>
                <button style={{
                  padding: '7px 18px', background: 'transparent',
                  border: '1px solid #D97757', borderRadius: 8,
                  fontSize: 13, fontWeight: 500, color: '#D97757',
                  cursor: 'pointer', fontFamily: poppins,
                }}>
                  Browse Files
                </button>
              </div>

              {/* Uploaded files label */}
              <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 10 }}>
                Uploaded Files
              </p>

              {/* File list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {files.map((file, idx) => (
                  <div
                    key={file.name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 0',
                      borderBottom: idx < files.length - 1 ? '1px solid #F0EEE6' : 'none',
                    }}
                  >
                    {/* File icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: '#FAF9F5', border: '1px solid #E8E6DC',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {file.name.endsWith('.zip')
                        ? <Archive size={15} style={{ color: '#8C8A82' }} />
                        : <FileText size={15} style={{ color: '#8C8A82' }} />
                      }
                    </div>

                    {/* File info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                      <p style={{ fontSize: 11, color: '#8C8A82', marginTop: 1 }}>{file.size}</p>
                      {file.status === 'Uploading' && file.progress !== undefined && (
                        <div style={{ marginTop: 5, height: 4, borderRadius: 2, background: '#E8E6DC' }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${file.progress}%`, background: '#D97757' }} />
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <span style={{
                      padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: file.status === 'Ready' ? '#E3F4EA' : '#FFF4DC',
                      color:      file.status === 'Ready' ? '#1E7A3C' : '#B36200',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {file.status === 'Uploading' ? 'Uploading...' : 'Ready'}
                    </span>

                    {/* Remove */}
                    <button
                      onClick={() => removeFile(idx)}
                      style={{ fontSize: 16, color: '#C0BDB5', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '0 4px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#C0392B')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#C0BDB5')}
                    >
                      ···
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Preview / Cover Image */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Product Preview / Cover Image</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                {/* Thumbnail */}
                <div style={{
                  width: 120, height: 120, borderRadius: 10,
                  background: '#FBECE4', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #E8CEB4',
                }}>
                  <svg width="52" height="52" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="8,40 24,8 40,40" fill="#D97757" opacity="0.9"/>
                    <rect x="20" y="28" width="8" height="12" fill="#B95A3A"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#8C8A82', marginBottom: 14, lineHeight: 1.5 }}>
                    Upload a compelling cover image. This is the first thing buyers see. Size: 1200×900px recommended.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{
                      padding: '7px 14px', background: '#fff', border: '1px solid #E8E6DC',
                      borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945',
                      cursor: 'pointer', fontFamily: poppins,
                    }}>
                      Upload Cover Image
                    </button>
                    <button style={{
                      padding: '7px 14px', background: '#FBECE4', border: '1px solid #E8CEB4',
                      borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#B95A3A',
                      cursor: 'pointer', fontFamily: poppins,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <Sparkles size={12} /> AI Generate Cover
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Download Settings */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Download Settings</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Download Limit</label>
                  <select style={selectStyle}>
                    <option>Unlimited downloads</option>
                    <option>1 download</option>
                    <option>3 downloads</option>
                    <option>5 downloads</option>
                    <option>10 downloads</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Link Expiry</label>
                  <select style={selectStyle}>
                    <option>Never expires</option>
                    <option>24 hours</option>
                    <option>7 days</option>
                    <option>30 days</option>
                    <option>1 year</option>
                  </select>
                </div>

                {/* PDF Stamp toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div
                    onClick={() => setPdfStamp(p => !p)}
                    style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      background: pdfStamp ? '#D97757' : '#fff',
                      border: `2px solid ${pdfStamp ? '#D97757' : '#E8E6DC'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {pdfStamp && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L4 7L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: '#4A4945', fontFamily: poppins }}>
                    Enable PDF stamping with buyer email
                  </span>
                </label>
              </div>
            </div>

            {/* License Type */}
            <div style={cardStyle}>
              <p style={sectionTitle}>License Type</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {LICENSES.map((lic, i) => (
                  <div
                    key={lic.id}
                    onClick={() => setLicense(lic.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 0', cursor: 'pointer',
                      borderBottom: i < LICENSES.length - 1 ? '1px solid #F0EEE6' : 'none',
                    }}
                  >
                    {/* Radio circle */}
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      border: `2px solid ${license === lic.id ? '#D97757' : '#C0BDB5'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {license === lic.id && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#D97757' }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: license === lic.id ? '#B95A3A' : '#141413', fontFamily: poppins }}>
                        {lic.label}
                      </p>
                      <p style={{ fontSize: 11, color: license === lic.id ? '#B95A3A' : '#8C8A82', marginTop: 1, fontFamily: poppins }}>
                        {lic.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer Delivery Message */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Buyer Delivery Message</p>
              <textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 12,
                  border: '1px solid #E8E6DC', borderRadius: 8,
                  outline: 'none', fontFamily: poppins, color: '#4A4945',
                  background: '#fff', resize: 'vertical', lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Publish button */}
            <button style={{
              width: '100%', padding: '13px 0', background: '#D97757',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              color: '#fff', cursor: 'pointer', fontFamily: poppins,
            }}>
              Publish Digital Product
            </button>

          </div>
        </div>
      </div>
    </>
  );
}