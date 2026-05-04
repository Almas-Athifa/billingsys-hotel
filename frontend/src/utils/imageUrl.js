export const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="%23f3f4f6"/><path d="M45 104l22-26 16 18 12-14 20 22H45z" fill="%23d1d5db"/><circle cx="60" cy="58" r="10" fill="%23d1d5db"/></svg>';

export const getImageUrl = (image, baseUrl) => {
  if (!image) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  return `${baseUrl}${image}`;
};
