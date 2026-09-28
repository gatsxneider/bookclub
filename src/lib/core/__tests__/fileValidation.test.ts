import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  verifyMagicBytes,
  MAX_FILE_SIZE,
} from '../fileValidation';

describe('fileValidation utility', () => {
  describe('verifyMagicBytes', () => {
    it('JPEG 매직 바이트(FF D8 FF)를 올바르게 인식해야 한다', () => {
      const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const res = verifyMagicBytes(bytes);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('jpg');
    });

    it('PNG 매직 바이트(89 50 4E 47 0D 0A 1A 0A)를 올바르게 인식해야 한다', () => {
      const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const res = verifyMagicBytes(bytes);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('png');
    });

    it('GIF 매직 바이트(GIF87a / GIF89a)를 올바르게 인식해야 한다', () => {
      const bytes89 = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const res89 = verifyMagicBytes(bytes89);
      expect(res89.valid).toBe(true);
      expect(res89.format).toBe('gif');

      const bytes87 = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]);
      const res87 = verifyMagicBytes(bytes87);
      expect(res87.valid).toBe(true);
      expect(res87.format).toBe('gif');
    });

    it('변조되었거나 알 수 없는 바이트는 거부해야 한다', () => {
      const bytes = new Uint8Array([0x3c, 0x3f, 0x70, 0x68]); // <?ph
      const res = verifyMagicBytes(bytes);
      expect(res.valid).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    it('올바른 PNG 파일은 통과해야 한다', async () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const file = new File([pngHeader], 'avatar.png', { type: 'image/png' });

      const res = await validateImageFile(file);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('png');
    });

    it('올바른 JPEG 파일은 통과해야 한다', async () => {
      const jpgHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const file = new File([jpgHeader], 'photo.jpg', { type: 'image/jpeg' });

      const res = await validateImageFile(file);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('jpg');
    });

    it('올바른 GIF 파일은 통과해야 한다', async () => {
      const gifHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);
      const file = new File([gifHeader], 'animation.gif', { type: 'image/gif' });

      const res = await validateImageFile(file);
      expect(res.valid).toBe(true);
      expect(res.format).toBe('gif');
    });

    it('5MB를 초과하는 대용량 파일은 거부해야 한다', async () => {
      const largeContent = new Uint8Array(MAX_FILE_SIZE + 10);
      const file = new File([largeContent], 'large.png', { type: 'image/png' });

      const res = await validateImageFile(file);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('5MB');
    });

    it('지원되지 않는 확장자(WebP, SVG, EXE, HTML 등)는 거부해야 한다', async () => {
      const fileWebp = new File(['content'], 'test.webp', { type: 'image/webp' });
      const resWebp = await validateImageFile(fileWebp);
      expect(resWebp.valid).toBe(false);
      expect(resWebp.error).toContain('JPG, PNG, GIF');

      const fileSvg = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
      const resSvg = await validateImageFile(fileSvg);
      expect(resSvg.valid).toBe(false);
    });

    it('확장자만 .png로 위장한 스크립트/HTML 파일은 매직 바이트 검사로 거부해야 한다', async () => {
      const maliciousScript = new TextEncoder().encode('<script>alert("XSS")</script>');
      const spoofedFile = new File([maliciousScript], 'hacked.png', { type: 'image/png' });

      const res = await validateImageFile(spoofedFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('손상되었거나 변조된 이미지');
    });
  });
});
