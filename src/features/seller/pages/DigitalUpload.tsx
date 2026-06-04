import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, Textarea } from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

type FileStatus = 'Ready' | 'Uploading';

interface UploadFile {
  name: string;
  size: string;
  status: FileStatus;
  progress?: number;
}

const INITIAL_FILES: UploadFile[] = [
  { name: 'Grade5Math_LessonPlans.pdf',  size: '14.2 MB', status: 'Ready' },
  { name: 'Grade5Math_Worksheets.zip',   size: '38.7 MB', status: 'Ready' },
  { name: 'Grade5Math_Assessments.pdf',  size: '8.4 MB',  status: 'Uploading', progress: 62 },
  { name: 'Grade5Math_AnswerKeys.pdf',   size: '5.1 MB',  status: 'Ready' },
];

type LicenseType = 'personal' | 'classroom' | 'school' | 'commercial';

const LICENSES: { id: LicenseType; label: string; desc: string }[] = [
  { id: 'personal',   label: 'Personal Use Only',    desc: "For the buyer's personal use only" },
  { id: 'classroom',  label: 'Single Classroom',     desc: 'One classroom / one teacher' },
  { id: 'school',     label: 'School License',       desc: 'Entire school or institution' },
  { id: 'commercial', label: 'Commercial License',   desc: 'Full commercial use permitted' },
];

export function DigitalUpload() {
  const [files, setFiles]   = useState<UploadFile[]>(INITIAL_FILES);
  const [license, setLicense] = useState<LicenseType>('classroom');
  const [pdfStamp, setPdfStamp] = useState(true);

  const removeFile = (idx: number) =>
    setFiles(prev => prev.filter((_, i) => i !== idx));

  return (
    <>
      <SellerPageHeader
        title="Digital Product Upload"
        subtitle="Upload files, configure delivery and license settings."
        actions={
          <>
            <Button variant="ghost"   size="sm">Save Draft</Button>
            <Button variant="primary" size="sm">Publish</Button>
          </>
        }
      />

      <div className="p-7">
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* LEFT column */}
          <div className="flex flex-col gap-5">
            {/* Upload Files */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Upload Files</p>

              {/* Dropzone */}
              <div
                className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 mb-4 cursor-pointer transition-colors hover:bg-cream"
                style={{ borderColor: '#D97757' }}
              >
                <div style={{ fontSize: 40 }} className="mb-3">📂</div>
                <p className="text-[14px] font-semibold text-carbon mb-1">Drop your files here</p>
                <p className="text-[12px] text-slate mb-4">PDF, ZIP, DOCX, MP3, MP4 — max 500 MB per file</p>
                <Button variant="ghost" size="sm">Browse Files</Button>
              </div>

              {/* File list */}
              <div className="flex flex-col gap-2">
                {files.map((file, idx) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-3 p-3 rounded-lg border border-bone"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[16px] flex-shrink-0"
                      style={{ background: '#FBECE4' }}
                    >
                      {file.name.endsWith('.zip') ? '📦' : '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-carbon truncate">{file.name}</p>
                      <p className="text-[11px] text-slate">{file.size}</p>
                      {file.status === 'Uploading' && file.progress !== undefined && (
                        <div className="mt-1.5 h-1.5 rounded-full" style={{ background: '#E8E6DC' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${file.progress}%`, background: '#D97757' }}
                          />
                        </div>
                      )}
                    </div>
                    <Badge color={file.status === 'Ready' ? 'green' : 'yellow'}>{file.status}</Badge>
                    <button
                      onClick={() => removeFile(idx)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[14px] text-slate hover:text-error cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cover Image */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Cover Image</p>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div
                  className="rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ width: 140, height: 140, background: '#FBECE4', fontSize: 48 }}
                >
                  📚
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] text-slate">
                    Recommended: 1000×1000px, JPG or PNG.
                  </p>
                  <Button variant="ghost"     size="sm">Upload Cover Image</Button>
                  <Button variant="secondary" size="sm">✨ AI Generate Cover</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT column */}
          <div className="flex flex-col gap-5">
            {/* Download Settings */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Download Settings</p>
              <div className="flex flex-col gap-3">
                <Select label="Download Limit">
                  <option>Unlimited</option>
                  <option>1 download</option>
                  <option>3 downloads</option>
                  <option>5 downloads</option>
                  <option>10 downloads</option>
                </Select>
                <Select label="Link Expiry">
                  <option>Never expires</option>
                  <option>24 hours</option>
                  <option>7 days</option>
                  <option>30 days</option>
                  <option>1 year</option>
                </Select>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                    style={{ background: pdfStamp ? '#D97757' : '#E8E6DC' }}
                    onClick={() => setPdfStamp(p => !p)}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
                      style={{ left: pdfStamp ? '17px' : '2px' }}
                    />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-charcoal">PDF Stamping</p>
                    <p className="text-[11px] text-slate">Buyer email printed on each PDF page</p>
                  </div>
                </label>
              </div>
            </Card>

            {/* License Type */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">License Type</p>
              <div className="flex flex-col gap-2">
                {LICENSES.map(lic => (
                  <label
                    key={lic.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                    style={{
                      borderColor: license === lic.id ? '#D97757' : '#E8E6DC',
                      background:  license === lic.id ? '#FBECE4' : '#FFFFFF',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: license === lic.id ? '#D97757' : '#E8E6DC' }}
                    >
                      {license === lic.id && (
                        <div className="w-2 h-2 rounded-full" style={{ background: '#D97757' }} />
                      )}
                    </div>
                    <input
                      type="radio"
                      className="sr-only"
                      checked={license === lic.id}
                      onChange={() => setLicense(lic.id)}
                    />
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color: license === lic.id ? '#B95A3A' : '#141413' }}>
                        {lic.label}
                      </p>
                      <p className="text-[11px]" style={{ color: license === lic.id ? '#B95A3A' : '#8C8A82' }}>
                        {lic.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Delivery Message */}
            <Card>
              <Textarea
                label="Buyer Delivery Message"
                placeholder="Message shown to buyers after purchase, e.g. instructions for accessing the files…"
                rows={4}
              />
            </Card>

            {/* Publish */}
            <Button variant="primary" size="md" fullWidth>
              Publish Digital Product
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
