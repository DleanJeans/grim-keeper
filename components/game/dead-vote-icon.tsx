import { Vote } from 'lucide-react-native';

export function DeadVoteIcon({ color, size = 12 }: { color: string; size?: number }) {
  return <Vote color={color} size={size} strokeWidth={2.3} />;
}
