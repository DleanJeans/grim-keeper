import { Image, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { getCountryFlagEmoji } from '@/utils/friend-info-utils';

// Windows has no flag emoji (it shows the two letters), so there the flag is an image.
const FLAG_IMAGE_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/';

type CountryFlagProps = {
  code: string;
  size: number;
};

/** A country's flag that also shows on Windows browsers. */
export function CountryFlag({ code, size }: CountryFlagProps) {
  if (needsFlagImage()) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={{ uri: getFlagImageUrl(code) }}
        style={[styles.image, { height: size, width: size }]}
      />
    );
  }
  return (
    <Text style={[styles.emoji, { fontSize: size * 0.85, lineHeight: size }]}>
      {getCountryFlagEmoji(code)}
    </Text>
  );
}

function needsFlagImage() {
  return (
    process.env.EXPO_OS === 'web' &&
    typeof navigator !== 'undefined' &&
    /windows/i.test(navigator.userAgent)
  );
}

function getFlagImageUrl(code: string) {
  const hex = Array.from(getCountryFlagEmoji(code))
    .map((char) => char.codePointAt(0)?.toString(16))
    .join('-');
  return `${FLAG_IMAGE_BASE}${hex}.svg`;
}

const styles = StyleSheet.create({
  emoji: { includeFontPadding: false, textAlign: 'center' },
  image: {},
});
