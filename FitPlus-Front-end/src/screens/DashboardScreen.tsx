import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { getDailySummary } from '../api/endpoints';
import { DailySummary } from '../api/types';
import Card from '../components/Card';
import { COLORS, RADIUS, SPACING } from '../constants/colors';
import { useAuth } from '../store/authStore';
import { caloriePercent, caloriesLeft, formatLongDate, greeting, todayIso } from '../utils/helpers';

type Nav = BottomTabNavigationProp<any>;

// The home screen. Shows today's calories + macros + activity summary.
export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const target = 2200; // hard-coded daily calorie goal (could come from UserMetrics later)

  const load = useCallback(async () => {
    try {
      const data = await getDailySummary(todayIso());
      setSummary(data);
    } catch (e) {
      console.warn('Could not load daily summary', e);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Refresh whenever the tab is focused (so logging a meal updates the dashboard).
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load());
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  const eaten = summary?.totalCalories ?? 0;
  const pct = caloriePercent(eaten, target);
  const left = caloriesLeft(eaten, target);
  const over = pct >= 100;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>{greeting()},</Text>
            <Text style={styles.name}>{user?.name || 'Athlete'} 👋</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.date}>{formatLongDate()}</Text>

        {/* Big calorie ring */}
        <Card style={styles.calorieCard}>
          <Text style={styles.calorieLabel}>Calories today</Text>
          <View
            style={[
              styles.ring,
              { borderColor: over ? COLORS.danger : COLORS.primary },
            ]}
          >
            <Text style={styles.calorieEaten}>{Math.round(eaten)}</Text>
            <Text style={styles.calorieTarget}>/ {target} kcal</Text>
            <Text
              style={[
                styles.caloriePct,
                { color: over ? COLORS.danger : COLORS.primary },
              ]}
            >
              {pct}%
            </Text>
          </View>
          <Text style={styles.calorieSub}>
            {over ? '🔥 Daily goal reached!' : `${Math.round(left)} kcal remaining`}
          </Text>
        </Card>

        {/* Quick actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.action, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('Meals')}
          >
            <Text style={[styles.actionText, { color: COLORS.background }]}>+ Log Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.action, { backgroundColor: COLORS.surface }]}
            onPress={() => navigation.navigate('Workouts')}
          >
            <Text style={[styles.actionText, { color: COLORS.text }]}>+ Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Macros */}
        <Text style={styles.section}>Macros</Text>
        <View style={styles.row}>
          <MacroCard label="Protein" value={summary?.totalProteinGrams ?? 0} color={COLORS.primary} />
          <MacroCard label="Carbs" value={summary?.totalCarbsGrams ?? 0} color={COLORS.secondary} />
          <MacroCard label="Fat" value={summary?.totalFatGrams ?? 0} color={COLORS.fat} />
        </View>

        {/* Activity */}
        <Text style={styles.section}>Activity</Text>
        <View style={styles.row}>
          <StatCard label="Workouts" value={String(summary?.totalWorkouts ?? 0)} />
          <StatCard
            label="Active min"
            value={String(summary?.totalWorkoutDurationMinutes ?? 0)}
          />
          <StatCard label="Meals" value={String(summary?.totalMealLogs ?? 0)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.stat, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{Math.round(value)}g</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  greet: { color: COLORS.textMuted, fontSize: 14 },
  name: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  logout: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  logoutText: { color: COLORS.danger, fontWeight: '600' },
  date: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.lg },
  calorieCard: { alignItems: 'center', marginBottom: SPACING.lg },
  calorieLabel: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600', marginBottom: SPACING.md },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieEaten: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  calorieTarget: { color: COLORS.textMuted, fontSize: 12 },
  caloriePct: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  calorieSub: { color: COLORS.textMuted, fontSize: 13, marginTop: SPACING.md },
  actions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  action: { flex: 1, height: 46, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 15, fontWeight: '700' },
  section: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
});
