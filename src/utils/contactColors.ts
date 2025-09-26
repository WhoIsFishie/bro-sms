// Predefined color combinations for contact avatars
const COLOR_COMBINATIONS = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
  'from-red-400 to-red-600',
  'from-yellow-400 to-yellow-600',
  'from-cyan-400 to-cyan-600',
  'from-orange-400 to-orange-600',
  'from-teal-400 to-teal-600',
  'from-lime-400 to-lime-600',
  'from-emerald-400 to-emerald-600',
  'from-violet-400 to-violet-600',
  'from-fuchsia-400 to-fuchsia-600',
  'from-rose-400 to-rose-600',
  'from-sky-400 to-sky-600',
];

// Simple hash function to convert string to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get consistent color for a contact based on their phone number
export function getContactColor(contactId: string): string {
  const hash = hashString(contactId);
  const colorIndex = hash % COLOR_COMBINATIONS.length;
  return COLOR_COMBINATIONS[colorIndex];
}

// Get text color that contrasts well with the gradient backgrounds
export function getContactTextColor(): string {
  return 'text-white';
}