import { FileText } from 'lucide-react';
import { useObjectUrl } from '@/lib/useObjectUrl';
import { formatFileSize } from '@/lib/format';
import { isPdfFile } from '@/lib/prescriptionFile';

interface FilePreviewProps {
  file: File;
  className?: string;
}

export default function FilePreview({ file, className = '' }: FilePreviewProps) {
  const url = useObjectUrl(file);
  const isPdf = isPdfFile(file);

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}>
      {url && isPdf && (
        <iframe
          src={url}
          title={`Preview of ${file.name}`}
          className="h-[480px] w-full bg-white sm:h-[600px]"
        />
      )}
      {url && !isPdf && (
        <img
          src={url}
          alt={`Preview of ${file.name}`}
          className="max-h-[600px] w-full bg-white object-contain"
        />
      )}
      <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
          <p className="text-xs text-slate-500">
            {isPdf ? 'PDF document' : 'Image'} · {formatFileSize(file.size)}
          </p>
        </div>
      </div>
    </div>
  );
}
