// ── Ảnh dự phòng cho card tour ────────────────────────────────────────────────
// coverImage của tour phần lớn là URL hotlink từ web ngoài (vinwonders, laodong,
// bizweb...) → dễ chết vì hotlink-protection (403), URL bị gỡ, hoặc referrer bị chặn,
// khiến <img> hiện icon vỡ ảnh. Dùng SVG data-URI làm fallback: không cần asset, không
// gọi network (hiển thị được cả khi offline), và luôn load thành công.
import type { SyntheticEvent } from 'react';

export const TOUR_IMAGE_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#e0f2fe"/><stop offset="1" stop-color="#bae6fd"/>` +
      `</linearGradient></defs>` +
      `<rect width="400" height="300" fill="url(#g)"/>` +
      `<g fill="#0284c7" opacity="0.5" transform="translate(200 132)">` +
        `<circle cx="48" cy="-34" r="15"/>` +
        `<path d="M-92 58 L-24 -10 L14 38 L58 -22 L92 58 Z"/>` +
      `</g>` +
      `<text x="200" y="238" font-family="system-ui,Segoe UI,sans-serif" font-size="19" ` +
        `font-weight="700" fill="#0369a1" text-anchor="middle">Ảnh đang cập nhật</text>` +
    `</svg>`
  );

// Gắn vào <img onError>. Dùng cờ dataset để KHÔNG lặp vô hạn nếu fallback cũng lỗi.
// Phải xoá srcset trước: next/image render kèm srcSet, mà srcSet được ưu tiên hơn src →
// nếu không xoá, gán src fallback sẽ vô hiệu và ảnh vẫn vỡ.
export function onTourImageError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = '1';
  img.srcset = '';
  img.src = TOUR_IMAGE_FALLBACK;
}
