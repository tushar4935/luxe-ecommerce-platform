export const formatDate = (date, opts = {}) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  });
};

export const formatDateTime = (date) =>
  formatDate(date, { hour: '2-digit', minute: '2-digit' });

export default formatDate;
