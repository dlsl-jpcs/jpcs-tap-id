function sanitize(input) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/gi, '')
    .toLowerCase();
}

function deriveUsername(email, strategy = 'dot') {
  const [local] = email.split('@');
  const [first, last] = local.split('_');
  const firstClean = sanitize(first || '');
  const lastClean = sanitize(last || '');

  switch (strategy) {
    case 'dot':
      return [firstClean, lastClean].filter(Boolean).join('.');
    case 'concat':
      return `${firstClean}${lastClean}`;
    case 'firstInitialLast':
      return `${firstClean.charAt(0)}${lastClean}`;
    case 'lastFirstInitial':
      return `${lastClean}${firstClean.charAt(0)}`;
    default:
      return [firstClean, lastClean].filter(Boolean).join('.');
  }
}

function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function prettifyNamePart(part) {
  return (part || '')
    .split('-')
    .map(capitalize)
    .join('-');
}

function deriveDisplayName(email) {
  const [local] = email.split('@');
  const [firstRaw, lastRaw] = local.split('_');
  const first = prettifyNamePart(firstRaw);
  const last = prettifyNamePart(lastRaw);
  return [first, last].filter(Boolean).join(' ');
}

module.exports = { deriveUsername, deriveDisplayName };