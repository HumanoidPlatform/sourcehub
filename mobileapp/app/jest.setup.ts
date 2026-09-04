import { jest } from '@jest/globals';

process.env.EXPO_PUBLIC_API_MODE ??= 'mock';
process.env.EXPO_PUBLIC_API_URL ??= 'http://mobile-backend.test:8001/api/v1';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  const validateKey = (key: string) => {
    if (!key || !/^[A-Za-z0-9._-]+$/.test(key)) {
      throw new Error(
        'Invalid key provided to SecureStore. Keys must not be empty and contain only alphanumeric characters, ".", "-", and "_".',
      );
    }
  };
  return {
    getItemAsync: jest.fn((key: string) => {
      validateKey(key);
      return Promise.resolve(store.get(key) ?? null);
    }),
    setItemAsync: jest.fn((key: string, value: string) => {
      validateKey(key);
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      validateKey(key);
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
    addEventListener: jest.fn(() => jest.fn()),
  },
  useNetInfo: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));

jest.mock('lucide-react-native', () => {
  const MockIcon = 'MockIcon';
  return new Proxy(
    {
      __esModule: true,
      default: MockIcon,
    },
    {
      get(target, property) {
        if (property in target) {
          return target[property as keyof typeof target];
        }
        return MockIcon;
      },
    },
  );
});

jest.mock('expo-speech', () => ({
  __esModule: true,
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
}));
