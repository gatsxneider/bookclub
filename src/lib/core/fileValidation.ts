/**
 * 프로필 이미지 업로드 파일 검증 및 보안 유틸리티
 * 
 * 보안 고려사항:
 * 1. 허용 확장자 및 MIME 타입 제한 (JPG, PNG, GIF 만 허용, SVG 및 WebP/HTML/스크립트 차단)
 * 2. Magic Bytes (파일 바이너리 시그니처) 검증을 통한 확장자 위변조(MIME spoofing) 방지
 * 3. 파일 크기 제한 (최대 5MB)을 통한 DoS 및 메모리 고갈 방지
 * 4. XSS 취약점 유발 가능한 SVG / XML / HTML 스크립트 차단
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'] as const;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
] as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  format?: 'jpg' | 'png' | 'gif';
}

/**
 * 파일 바이너리 헤더(Magic Bytes)를 검사하여 실제 이미지 포맷 확인
 */
export function verifyMagicBytes(bytes: Uint8Array): { valid: boolean; format?: 'jpg' | 'png' | 'gif' } {
  if (bytes.length < 4) {
    return { valid: false };
  }

  // 1. JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, format: 'jpg' };
  }

  // 2. PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { valid: true, format: 'png' };
  }

  // 3. GIF: GIF87a (47 49 46 38 37 61) 또는 GIF89a (47 49 46 38 39 61)
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { valid: true, format: 'gif' };
  }

  return { valid: false };
}

/**
 * 파일 앞부분 바이트 읽기 헬퍼 (브라우저 및 테스트 환경 호환)
 */
export async function readFileBytes(file: File, length: number = 16): Promise<Uint8Array> {
  const blob = file.slice ? file.slice(0, length) : file;

  if (typeof (blob as any).arrayBuffer === 'function') {
    try {
      const buffer = await (blob as any).arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      // FileReader로 폴백
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('ArrayBuffer 변환 실패'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('파일 읽기 실패'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * 이미지 파일 종합 보안 및 유효성 검사 (확장자, MIME 타입, 파일 크기, Magic Bytes)
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
  if (!file) {
    return { valid: false, error: '파일이 선택되지 않았습니다.' };
  }

  // 1. 파일 크기 제한 (최대 5MB)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: '이미지 크기는 최대 5MB까지 업로드할 수 있습니다.',
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: '빈 파일은 업로드할 수 없습니다.',
    };
  }

  // 2. 확장자 검사 (.jpg, .jpeg, .png, .gif 만 허용)
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다. JPG, PNG, GIF 파일만 업로드 가능합니다.',
    };
  }

  // 3. MIME 타입 검사
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: '허용되지 않는 MIME 타입입니다. JPG, PNG, GIF 이미지만 가능합니다.',
    };
  }

  // 4. 바이너리 Magic Bytes (파일 시그니처) 검사 - 확장자 위변조 방지
  try {
    const bytes = await readFileBytes(file, 16);
    const magicCheck = verifyMagicBytes(bytes);

    if (!magicCheck.valid || !magicCheck.format) {
      return {
        valid: false,
        error: '손상되었거나 변조된 이미지 파일입니다. 올바른 JPG, PNG, GIF 파일을 선택해주세요.',
      };
    }

    return {
      valid: true,
      format: magicCheck.format,
    };
  } catch (err) {
    return {
      valid: false,
      error: '파일 바이너리 검증 중 오류가 발생했습니다.',
    };
  }
}
