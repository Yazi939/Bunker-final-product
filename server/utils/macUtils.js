const normalizeMac = (value = '') => {
  const hexOnly = String(value).toUpperCase().replace(/[^0-9A-F]/g, '');
  if (hexOnly.length !== 12) return null;
  return hexOnly.match(/.{1,2}/g).join(':');
};

const isEnabled = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());

module.exports = {
  normalizeMac,
  isEnabled,
};
