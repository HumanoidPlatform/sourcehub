import { Tabs } from 'expo-router';
import { BookOpenCheck, BriefcaseBusiness, Home, Smartphone, WalletCards } from 'lucide-react-native';
import { useContext } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { TAB_BAR_BASE_HEIGHT, TabBarHeightContext } from '@/components/common/tab-bar-metrics';
import { useTranslation } from '@/features/localization/use-translation';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  const t = useTranslation();
  const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;

  return (
    <TabBarHeightContext.Provider value={tabBarHeight}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: colors.accentDark,
          tabBarInactiveTintColor: colors.slate500,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
            lineHeight: 14,
          },
          tabBarStyle: {
            borderTopColor: colors.border,
            minHeight: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            title: t('tabs.home'),
          }}
        />
        <Tabs.Screen
          name="work"
          options={{
            tabBarIcon: ({ color, size }) => <BriefcaseBusiness color={color} size={size} />,
            title: t('tabs.work'),
          }}
        />
        <Tabs.Screen
          name="devices"
          options={{
            tabBarIcon: ({ color, size }) => <Smartphone color={color} size={size} />,
            title: t('tabs.devices'),
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            tabBarIcon: ({ color, size }) => <BookOpenCheck color={color} size={size} />,
            title: t('tabs.learn'),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            tabBarIcon: ({ color, size }) => <WalletCards color={color} size={size} />,
            title: t('tabs.wallet'),
          }}
        />
        <Tabs.Screen name="uploads" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </TabBarHeightContext.Provider>
  );
}
