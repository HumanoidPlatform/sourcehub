export function isDemoPersonaPickerEnabled() {
  return (process.env.EXPO_PUBLIC_API_MODE ?? 'mock') !== 'real';
}
