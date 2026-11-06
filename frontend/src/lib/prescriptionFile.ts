export const ACCEPTED_PRESCRIPTION_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const ACCEPTED_PRESCRIPTION_LABEL = 'JPG, PNG, WEBP or PDF';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function validatePrescriptionFile(file: File): string | null {
  if (!ACCEPTED_PRESCRIPTION_TYPES.includes(file.type)) {
    return `"${file.name}" is not supported. Please upload a ${ACCEPTED_PRESCRIPTION_LABEL} file.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'That file is larger than 10 MB. Please upload a smaller file or a clearer photo.';
  }
  return null;
}

export function isPdfFile(file: File) {
  return file.type === 'application/pdf';
}
