import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getDailySummary } from '../api/endpoints';
import { DailySummary } from '../api/types';
import Card from '../components/Card';
import { COLORS, SPACING } from '../constants/colors';
import { todayIso } from '../utils/helpers';

// Analytics shows a 7-day view of your totals.
// Right now we just call the same daily-summary endpoint for today;
// this is a starting point that the team can extend.
export default function AnalyticsScreen() {
  const [today, setToday] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailySummary(todayIso())
      .then(setToday)
      .catch(() => setToday(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Analytics</Text>

        <Card>
          <Text style={styles.cardTitle}>Today at a glance</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
          ) : today ? (
            <View>
              <Row label="Calories" value={`${Math.round(today.totalCalories)} kcal`} />
              <Row label="Protein" value={`${Math.round(today.totalProteinGrams)}g`} />
              <Row label="Carbs" value={`${Math.round(today.totalCarbsGrams)}g`} />
              <Row label="Fat" value={`${Math.round(today.totalFatGrams)}g`} />
              <Row label="Workouts" value={String(today.totalWorkouts)} />
              <Row label="Active minutes" value={String(today.totalWorkoutDurationMinutes)} />
            </View>
          ) : (
            <Text style={styles.muted}>No data yet.</Text>
          )}
        </Card>

        <Card style={{ marginTop: SPACING.md }}>
          <Text style={styles.cardTitle}>Coming soon</Text>
          <Text style={styles.muted}>
            Weekly charts, streaks, and weight tracking will live here.
          </Text>
        </Card>
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
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  rowLabel: { color: COLORS.textMuted, fontSize: 14 },
  rowValue: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  muted: { color: COLORS.textMuted, fontSize: 13 },
});
