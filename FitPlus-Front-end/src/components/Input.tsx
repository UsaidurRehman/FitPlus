import { StyleSheet, Text, TextInput, View, TextInputProps } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/colors';

// A labeled text input. One per field keeps the screens tidy.
type Props = TextInputProps & {
  label: string;
};

export default function Input({ label, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={COLORS.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    height: 50,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
  },
});
