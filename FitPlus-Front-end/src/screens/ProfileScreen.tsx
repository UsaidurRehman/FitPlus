import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import { COLORS, RADIUS, SPACING } from '../constants/colors';
import { useAuth } from '../store/authStore';

export default function ProfileScreen() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  function onLogout() {
    Alert.alert('Log out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Profile</Text>

        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Athlete'}</Text>
          <Text style={styles.email}>{user?.email || 'No email'}</Text>
        </Card>

        <Card>
          <Row label="Daily calorie goal" value="2200 kcal" />
          <Row label="Theme" value="Dark" />
        </Card>

        <Button title="Log out" onPress={onLogout} variant="danger" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  h1: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  profileCard: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarLetter: { fontSize: 32, fontWeight: 'bold', color: COLORS.background },
  name: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  email: { color: COLORS.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  rowLabel: { color: COLORS.text, fontSize: 15 },
  rowValue: { color: COLORS.textMuted, fontSize: 15 },
});
