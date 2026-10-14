import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { getExercises, logWorkout } from '../api/endpoints';
import { Exercise } from '../api/types';
import Button from '../components/Button';
import Card from '../components/Card';
import { COLORS, RADIUS, SPACING } from '../constants/colors';

type Nav = BottomTabNavigationProp<any>;

// A single set the user is building.
type DraftSet = {
  id: string;
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  reps: string;
  weight: string;
};

// Screen for logging a new workout.
export default function WorkoutsScreen() {
  const navigation = useNavigation<Nav>();

  const [title, setTitle] = useState('Upper Body');
  const [duration, setDuration] = useState('45');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [picked, setPicked] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<DraftSet[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  // Refresh the exercise list when this tab is focused.
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadExercises());
    return unsub;
  }, [navigation]);

  async function loadExercises() {
    try {
      const list = await getExercises();
      setExercises(list);
      if (!picked && list.length > 0) setPicked(list[0]);
    } catch (e) {
      Alert.alert('Error', 'Could not load exercises.');
    } finally {
      setLoadingList(false);
    }
  }

  function addSet() {
    if (!picked) {
      Alert.alert('Pick an exercise first');
      return;
    }
    const count = sets.filter((s) => s.exerciseId === picked.exerciseId).length + 1;
    setSets((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        exerciseId: picked.exerciseId,
        exerciseName: picked.name,
        setNumber: count,
        reps: '10',
        weight: '20',
      },
    ]);
  }

  function updateSet(id: string, field: 'reps' | 'weight', value: string) {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function removeSet(id: string) {
    setSets((prev) => prev.filter((s) => s.id !== id));
  }

  async function save() {
    if (!title.trim()) return Alert.alert('Title required');
    if (sets.length === 0) return Alert.alert('Add at least one set');

    setSaving(true);
    try {
      await logWorkout({
        title: title.trim(),
        durationMinutes: parseInt(duration, 10) || 30,
        loggedAt: new Date().toISOString(),
        sets: sets.map((s) => ({
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: parseInt(s.reps, 10) || 0,
          weight: parseFloat(s.weight) || 0,
        })),
      });
      Alert.alert('Saved!', 'Your workout was logged.');
      setSets([]);
      setTitle('Workout');
      setDuration('45');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Log a workout</Text>

        <Card>
          <Text style={styles.label}>Workout title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="e.g. Chest & Triceps"
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            style={styles.input}
            keyboardType="numeric"
            placeholder="45"
            placeholderTextColor={COLORS.textMuted}
          />
        </Card>

        <Card>
          <Text style={styles.label}>Exercise</Text>
          {loadingList ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
          ) : (
            <Pressable style={styles.picker} onPress={() => setPickerOpen(true)}>
              <Text style={styles.pickerText}>{picked?.name ?? 'Tap to pick'}</Text>
              <Text style={styles.pickerChev}>›</Text>
            </Pressable>
          )}
          <Pressable style={styles.addSetBtn} onPress={addSet}>
            <Text style={styles.addSetText}>+ Add Set</Text>
          </Pressable>
        </Card>

        <Text style={styles.sectionTitle}>Sets ({sets.length})</Text>
        {sets.length === 0 ? (
          <Text style={styles.empty}>No sets yet. Pick an exercise and tap "Add Set".</Text>
        ) : (
          sets.map((s, i) => (
            <Card key={s.id} style={styles.setCard}>
              <View style={styles.setHead}>
                <Text style={styles.setTitle}>
                  {i + 1}. {s.exerciseName} · Set {s.setNumber}
                </Text>
                <TouchableOpacity onPress={() => removeSet(s.id)}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.setRow}>
                <View style={styles.col}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    value={s.weight}
                    onChangeText={(v) => updateSet(s.id, 'weight', v)}
                    keyboardType="numeric"
                    style={styles.smallInput}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Reps</Text>
                  <TextInput
                    value={s.reps}
                    onChangeText={(v) => updateSet(s.id, 'reps', v)}
                    keyboardType="numeric"
                    style={styles.smallInput}
                  />
                </View>
              </View>
            </Card>
          ))
        )}

        <Button
          title="Save workout"
          onPress={save}
          loading={saving}
          disabled={sets.length === 0}
        />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pick an exercise</Text>
            <FlatList
              data={exercises}
              keyExtractor={(e) => String(e.exerciseId)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.opt}
                  onPress={() => {
                    setPicked(item);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.optName}>{item.name}</Text>
                  <Text style={styles.optSub}>{item.muscleGroup}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  h1: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  label: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600', marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    height: 46,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  picker: {
    backgroundColor: COLORS.background,
    height: 46,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  pickerText: { color: COLORS.text, fontSize: 16 },
  pickerChev: { color: COLORS.textMuted, fontSize: 22 },
  addSetBtn: {
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetText: { color: COLORS.primary, fontWeight: '700' },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.md },
  empty: { color: COLORS.textMuted, textAlign: 'center', padding: SPACING.lg },
  setCard: { marginBottom: SPACING.md },
  setHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  setTitle: { color: COLORS.text, fontWeight: '700', fontSize: 15, flex: 1 },
  remove: { color: COLORS.danger, fontSize: 13 },
  setRow: { flexDirection: 'row', gap: SPACING.md },
  col: { flex: 1 },
  smallInput: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    height: 42,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    fontSize: 16,
    textAlign: 'center',
  },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: SPACING.lg },
  modal: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '70%' },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: SPACING.md },
  opt: { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  optName: { color: COLORS.text, fontSize: 16 },
  optSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  modalClose: { marginTop: SPACING.md, alignItems: 'center', padding: SPACING.sm },
  modalCloseText: { color: COLORS.danger, fontSize: 16, fontWeight: '700' },
});
