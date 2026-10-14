import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/colors';

// One simple button used everywhere. Has loading + disabled states built in.
type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: Props) {
  const bg =
    variant === 'primary'
      ? COLORS.primary
      : variant === 'danger'
      ? COLORS.surface
      : COLORS.surface;
  const fg = variant === 'secondary' ? COLORS.text : COLORS.background;
  const borderColor = variant === 'danger' ? COLORS.danger : 'transparent';

  return (
    <Pressable
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor, borderWidth: variant === 'danger' ? 1 : 0 },
        (disabled || loading) && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.text, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
