export const normalizePhoneNumber = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Handle different country code formats
  // For Maldives numbers (+960), normalize to include country code
  if (cleaned.startsWith('960')) {
    return cleaned; // Already has country code
  } else if (cleaned.length === 7 && /^[0-9]{7}$/.test(cleaned)) {
    // 7-digit local number, add Maldives country code
    return '960' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Remove leading zero and add country code
    return '960' + cleaned.substring(1);
  } else if (cleaned.length >= 10) {
    // International number, keep as is
    return cleaned;
  }

  // If none of the above, try to add 960 if it looks like a Maldivian number
  if (cleaned.length === 7) {
    return '960' + cleaned;
  }

  return cleaned;
};