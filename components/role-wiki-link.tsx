import { ExternalLink } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type RoleWikiLinkProps = {
  roleName: string;
};

export function RoleWikiLink({ roleName }: RoleWikiLinkProps) {
  const wikiUrl = `https://wiki.bloodontheclocktower.com/${encodeURIComponent(roleName.replaceAll(' ', '_'))}`;

  return (
    <Pressable
      accessibilityHint="Opens the Blood on the Clocktower wiki in your browser"
      accessibilityRole="link"
      onPress={() => Linking.openURL(wikiUrl)}
      style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
    >
      <Text style={styles.label}>View on BOTC Wiki</Text>
      <ExternalLink color={colors.textMuted} size={16} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  link: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.borderStrong,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  linkPressed: {
    backgroundColor: colors.surfacePressed,
  },
});
