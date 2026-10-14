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
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { getFoodItems, logMeal } from '../api/endpoints';
import { FoodItem } from '../api/types';
import Button from '../components/Button';
import Card from '../components/Card';
import { COLORS, RADIUS, SPACING } from '../constants/colors';

type Nav = BottomTabNavigationProp<any>;

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// One food item the user picked, with its serving count.
type Selected = { food: FoodItem; servings: number };

export default function MealsScreen() {
  const navigation = useNavigation<Nav>();

  const [mealType, setMealType] = useState('Breakfast');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [picked, setPicked] = useState<Selected[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFoods();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadFoods());
    return unsub;
  }, [navigation]);

  async function loadFoods() {
    try {
      const list = await getFoodItems();
      setFoods(list);
    } catch {
      Alert.alert('Error', 'Could not load food items.');
    } finally {
      setLoadingFoods(false);
    }
  }

  function addFood(food: FoodItem) {
    setPicked((prev) => {
      const found = prev.find((p) => p.food.foodItemId === food.foodItemId);
      if (found) {
        return prev.map((p) =>
          p.food.foodItemId === food.foodItemId
            ? { ...p, servings: p.servings + 1 }
            : p
        );
      }
      return [...prev, { food, servings: 1 }];
    });
    setPickerOpen(false);
  }

  function changeServings(id: number, delta: number) {
    setPicked((prev) =>
      prev
        .map((p) =>
          p.food.foodItemId === id
            ? { ...p, servings: Math.max(0.5, Math.round((p.servings + delta) * 10) / 10) }
            : p
        )
        .filter((p) => p.servings > 0)
    );
  }

  function removeFood(id: number) {
    setPicked((prev) => prev.filter((p) => p.food.foodItemId !== id));
  }

  // Live totals shown as the user picks foods.
  const totals = picked.reduce(
    (acc, p) => ({
      calories: acc.calories + p.food.calories * p.servings,
      protein: acc.protein + p.food.proteinGrams * p.servings,
      carbs: acc.carbs + p.food.carbsGrams * p.servings,
      fat: acc.fat + p.food.fatGrams * p.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  async function save() {
    if (picked.length === 0) return Alert.alert('Add at least one food');
    setSaving(true);
    try {
      await logMeal({
        mealType,
        loggedAt: new Date().toISOString(),
        items: picked.map((p) => ({ foodItemId: p.food.foodItemId, servings: p.servings })),
      });
      Alert.alert('Saved!', `${mealType} logged.`);
      setPicked([]);
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Log a meal</Text>

        {/* Meal type tabs */}
        <View style={styles.tabs}>
          {MEAL_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setMealType(t)}
              style={[styles.tab, mealType === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, mealType === t && styles.tabTextActive]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Live totals */}
        <Card>
          <Text style={styles.cardTitle}>Live totals</Text>
          <View style={styles.totalsRow}>
            <Stat label="kcal" value={Math.round(totals.calories)} />
            <Stat label="Protein" value={`${totals.protein.toFixed(1)}g`} color={COLORS.primary} />
            <Stat label="Carbs" value={`${totals.carbs.toFixed(1)}g`} color={COLORS.secondary} />
            <Stat label="Fat" value={`${totals.fat.toFixed(1)}g`} color={COLORS.fat} />
          </View>
        </Card>

        <Button title="+ Add food" onPress={() => setPickerOpen(true)} variant="secondary" />

        <Text style={styles.section}>Items ({picked.length})</Text>
        {picked.length === 0 ? (
          <Text style={styles.empty}>Tap "Add food" to start.</Text>
        ) : (
          picked.map((p) => (
            <Card key={p.food.foodItemId} style={{ marginBottom: SPACING.md }}>
              <View style={styles.itemHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{p.food.name}</Text>
                  <Text style={styles.itemSub}>
                    {Math.round(p.food.calories * p.servings)} kcal · per {p.food.servingSizeUnit}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFood(p.food.foodItemId)}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.stepperRow}>
                <Text style={styles.muted}>Servings</Text>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => changeServings(p.food.foodItemId, -0.5)}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.stepVal}>{p.servings}</Text>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => changeServings(p.food.foodItemId, 0.5)}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}

        <Button
          title={`Save ${mealType}`}
          onPress={save}
          loading={saving}
          disabled={picked.length === 0}
        />
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Pick a food</Text>
            {loadingFoods ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
            ) : (
              <FlatList
                data={foods}
                keyExtractor={(f) => String(f.foodItemId)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.opt} onPress={() => addFood(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optName}>{item.name}</Text>
                      <Text style={styles.optSub}>
                        {item.calories} kcal/{item.servingSizeUnit} · P{item.proteinGrams} C{item.carbsGrams} F{item.fatGrams}
                      </Text>
                    </View>
                    <Text style={styles.addText}>Add</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  h1: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: COLORS.background, fontWeight: 'bold' },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: SPACING.sm },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  section: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.md, marginTop: SPACING.lg },
  empty: { color: COLORS.textMuted, textAlign: 'center', padding: SPACING.lg },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  itemSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  remove: { color: COLORS.danger, fontSize: 13 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.background },
  muted: { color: COLORS.textMuted, fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { backgroundColor: COLORS.background, width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  stepVal: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginHorizontal: SPACING.md, minWidth: 24, textAlign: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: SPACING.lg },
  modal: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '75%' },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: SPACING.md },
  opt: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  optName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  optSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  addText: { color: COLORS.primary, fontWeight: 'bold' },
  modalClose: { marginTop: SPACING.md, alignItems: 'center', padding: SPACING.sm },
  modalCloseText: { color: COLORS.danger, fontSize: 16, fontWeight: '700' },
});
