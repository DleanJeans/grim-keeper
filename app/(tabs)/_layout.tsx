import { Tabs } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';

const TABS = [
  {
    name: 'index' as const,
    icon: 'theater' as const,
    label: 'Games',
  },
  {
    name: 'scripts' as const,
    icon: 'scroll' as const,
    label: 'Scripts',
  },
  {
    name: 'friends' as const,
    icon: 'users' as const,
    label: 'Friends',
  },
];

function CustomTabBar({ navigation, state }: any) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const insets = useSafeAreaInsets();

  const currentTab = state.routes[state.index]?.name || 'index';

  if (isLandscape) {
    return (
      <View
        style={[
          lsStyles.sidebar,
          {
            paddingTop: insets.top + 20,
          },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="theater" size={24} color="#fcb93c" />
          <Text style={lsStyles.logo}>The Grim</Text>
        </View>
        <Text style={lsStyles.subtitle}>Player Companion</Text>
        <View style={lsStyles.nav}>
          {TABS.map(tab => {
            const active = currentTab === tab.name;
            return (
              <Pressable
                key={tab.name}
                accessibilityLabel={`${tab.label} tab`}
                style={[
                  lsStyles.item,
                  active && lsStyles.itemActive,
                ]}
                onPress={() => navigation.navigate(tab.name)}
              >
                <Icon
                  name={tab.icon}
                  size={22}
                  color={active ? '#fcb93c' : '#ccc'}
                />
                <Text
                  style={[
                    lsStyles.label,
                    active && lsStyles.labelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        tbStyles.bar,
        {
          paddingBottom: insets.bottom + 4,
        },
      ]}
    >
      {TABS.map(tab => {
        const active = currentTab === tab.name;
        return (
          <Pressable
            key={tab.name}
            accessibilityLabel={`${tab.label} tab`}
            style={tbStyles.item}
            onPress={() => navigation.navigate(tab.name)}
          >
            <Icon
              name={tab.icon}
              size={22}
              color={active ? '#fcb93c' : '#888'}
            />
            <Text
              style={[
                tbStyles.label,
                active && tbStyles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isLandscape ? 'left' : 'bottom',
        tabBarLabelPosition: isLandscape ? 'below-icon' : undefined,
        sceneStyle: {
          backgroundColor: '#1a1b1e',
        },
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Games',
          tabBarIcon: () => null,
          href: '/',
        }}
      />
      <Tabs.Screen
        name="scripts"
        options={{
          title: 'Scripts',
          tabBarIcon: () => null,
          href: '/scripts',
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: () => null,
          href: '/friends',
        }}
      />
    </Tabs>
  );
}

// ── Landscape sidebar styles ──
const lsStyles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: '#1e1f23',
    borderRightWidth: 1,
    borderRightColor: '#2f313a',
    paddingHorizontal: 16,
  },
  logo: {
    color: '#fcb93c',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 32,
  },
  nav: {
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: '#2f313a',
  },
  label: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '500',
  },
  labelActive: {
    color: '#fcb93c',
    fontWeight: '700',
  },
});

// ── Portrait tab bar styles ──
const tbStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#1a1b1e',
    borderTopWidth: 1,
    borderTopColor: '#2f313a',
    paddingTop: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  label: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
  },
  labelActive: {
    color: '#fcb93c',
    fontWeight: '700',
  },
});
