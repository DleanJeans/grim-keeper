import { Pointer } from 'lucide-react-native';
import { View } from 'react-native';

type NomIconProps = {
  color: string;
  size?: number;
  strokeWidth?: number;
  rotate?: number;
};

export function NomIcon({ color, rotate = 90, size = 16, strokeWidth }: NomIconProps) {
  return (
    <View style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Pointer color={color} size={size} strokeWidth={strokeWidth} />
    </View>
  );
}
