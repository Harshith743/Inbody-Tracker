/**
 * AddReport screen — react-hook-form + zod form for manual InBody data entry.
 * Supports Edit Mode and Collapsible Field Sections.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  ActionSheetIOS,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "react-native-image-picker";
import { z } from "zod";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";

import { useReportStore } from "../store/reportStore";
import Theme, { Colors, Spacing, Radius, Shadow, Typography } from "../theme";
import type { RootStackParamList } from "../App";
import { preprocessImage, getImageDimensions } from "../utils/preprocessImage";
import { extractWithGroq } from "../utils/extractWithGroq";
import type { InBodyReportInput } from "../types/report";

type AddNav = NativeStackNavigationProp<RootStackParamList, "AddReport">;
type AddRoute = RouteProp<RootStackParamList, "AddReport">;

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const pos = z.coerce.number().min(0, "Must be ≥ 0");

const reportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  notes: z.string().optional(),

  // Research / Overall
  inbodyScore: pos,
  basalMetabolicRate: pos,
  fatFreeMass: pos,
  obesityDegree: pos,

  // Body composition
  weight: pos,
  totalBodyWater: pos,
  protein: pos,
  mineral: pos,
  bodyFatMass: pos,

  // Muscle & Fat
  skeletalMuscleMass: pos,
  bmi: pos,
  percentBodyFat: pos,
  visceralFatLevel: pos,
  waistHipRatio: pos,

  // Segmental lean
  segLeanLeftArm: pos,
  segLeanLeftArmPct: pos,
  segLeanRightArm: pos,
  segLeanRightArmPct: pos,
  segLeanTrunk: pos,
  segLeanTrunkPct: pos,
  segLeanLeftLeg: pos,
  segLeanLeftLegPct: pos,
  segLeanRightLeg: pos,
  segLeanRightLegPct: pos,

  // Segmental fat
  segFatLeftArm: pos,
  segFatLeftArmPct: pos,
  segFatRightArm: pos,
  segFatRightArmPct: pos,
  segFatTrunk: pos,
  segFatTrunkPct: pos,
  segFatLeftLeg: pos,
  segFatLeftLegPct: pos,
  segFatRightLeg: pos,
  segFatRightLegPct: pos,
});

type FormValues = z.infer<typeof reportSchema>;

// ─── UI Components ────────────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <View style={[Theme.CardStyle, styles.sectionCard]}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={Typography.heading3}>{title}</Text>
        <Text style={[Typography.heading3, { color: Colors.primary }]}>
          {isOpen ? "−" : "+"}
        </Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function Field({
  label,
  name,
  control,
  error,
  keyboardType = "numeric",
  placeholder,
  editable = true,
  highlight = false,
}: any) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={Typography.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              error && styles.inputError,
              !editable && styles.inputDisabled,
              highlight && {
                borderLeftWidth: 4,
                borderLeftColor: Colors.primary,
              },
            ]}
            value={value !== undefined ? String(value) : ""}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={keyboardType}
            placeholder={placeholder ?? label}
            placeholderTextColor={Colors.textDisabled}
            editable={editable}
            returnKeyType="next"
          />
        )}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function DatePickerField({ control, error }: any) {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <View style={styles.fieldWrapper}>
      <Text style={Typography.label}>Date (YYYY-MM-DD)</Text>
      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <>
            <TouchableOpacity
              onPress={() => setShowCalendar(true)}
              style={[
                styles.input,
                error && styles.inputError,
                { justifyContent: "center" },
              ]}
            >
              <Text
                style={{
                  color: value ? Colors.textPrimary : Colors.textDisabled,
                }}
              >
                {value || "Select Date"}
              </Text>
            </TouchableOpacity>

            <Modal visible={showCalendar} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.calendarContainer}>
                  <Calendar
                    theme={{
                      backgroundColor: Colors.surface,
                      calendarBackground: Colors.surface,
                      monthTextColor: Colors.textPrimary,
                      dayTextColor: Colors.textPrimary,
                      todayTextColor: Colors.primary,
                      arrowColor: Colors.primary,
                      textDisabledColor: Colors.textDisabled,
                    }}
                    onDayPress={(day: any) => {
                      onChange(day.dateString);
                      setShowCalendar(false);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setShowCalendar(false)}
                  >
                    <Text style={[Typography.label, { color: Colors.primary }]}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </>
        )}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function FieldPair({
  labelKg,
  nameKg,
  labelPct,
  namePct,
  control,
  errors,
  highlightFields = [],
}: any) {
  return (
    <View style={styles.pair}>
      <View style={{ flex: 1 }}>
        <Field
          label={labelKg}
          name={nameKg}
          control={control}
          error={errors[nameKg]?.message}
          highlight={highlightFields.includes(nameKg)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Field
          label={labelPct}
          name={namePct}
          control={control}
          error={errors[namePct]?.message}
          highlight={highlightFields.includes(namePct)}
        />
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddReportScreen() {
  const navigation = useNavigation<AddNav>();
  const route = useRoute<AddRoute>();
  const reportId = route.params?.reportId;
  const isEdit = !!reportId;

  const { addReport, updateReport, fetchReportById, todayDateString } =
    useReportStore();
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isEdit);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [isCalibrationVisible, setIsCalibrationVisible] = useState(false);
  const [debugImage, setDebugImage] = useState<{ uri: string; width: number; height: number } | null>(null);
  const [debugData, setDebugData] = useState<any>(null);

  const scrollRef = useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(reportSchema) as any,
    defaultValues: {
      date: todayDateString(),
      notes: "",
      inbodyScore: 0,
      basalMetabolicRate: 0,
      fatFreeMass: 0,
      obesityDegree: 0,
      weight: 0,
      totalBodyWater: 0,
      protein: 0,
      mineral: 0,
      bodyFatMass: 0,
      skeletalMuscleMass: 0,
      bmi: 0,
      percentBodyFat: 0,
      visceralFatLevel: 0,
      waistHipRatio: 0,
      segLeanLeftArm: 0,
      segLeanLeftArmPct: 0,
      segLeanRightArm: 0,
      segLeanRightArmPct: 0,
      segLeanTrunk: 0,
      segLeanTrunkPct: 0,
      segLeanLeftLeg: 0,
      segLeanLeftLegPct: 0,
      segLeanRightLeg: 0,
      segLeanRightLegPct: 0,
      segFatLeftArm: 0,
      segFatLeftArmPct: 0,
      segFatRightArm: 0,
      segFatRightArmPct: 0,
      segFatTrunk: 0,
      segFatTrunkPct: 0,
      segFatLeftLeg: 0,
      segFatLeftLegPct: 0,
      segFatRightLeg: 0,
      segFatRightLegPct: 0,
    },
  });

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? "Edit Report" : "New Measurement",
    });

    if (isEdit && reportId) {
      fetchReportById(reportId)
        .then((existing) => {
          if (existing) {
            // Strip the internal `id` before passing to the form to avoid strict Zod issues
            const { id: _id, ...formRest } = existing;
            reset(formRest as FormValues);
          }
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load report for editing.');
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [isEdit, reportId, fetchReportById, reset, navigation]);

  const onSubmit = async (v: FormValues) => {
    setSaving(true);
    try {
      if (isEdit && reportId) {
        await updateReport(reportId, v as InBodyReportInput);
      } else {
        await addReport(v as InBodyReportInput);
      }
      navigation.navigate("MainTabs");
    } catch (err) {
      Alert.alert("Error", String(err));
    } finally {
      setSaving(false);
    }
  };


  const handleScanReport = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "📷 Take Photo", "🖼️ Choose from Gallery"],
          cancelButtonIndex: 0,
          title: "Scan Report",
          message: "Choose an image source to extract data via OCR.",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) runOCR("camera");
          if (buttonIndex === 2) runOCR("gallery");
        }
      );
    } else {
      Alert.alert(
        "Scan Report",
        "Choose an image source to extract data via OCR.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Take Photo", onPress: () => runOCR("camera") },
          { text: "Choose from Gallery", onPress: () => runOCR("gallery") },
        ]
      );
    }
  };

  const runOCR = async (source: "camera" | "gallery") => {
    try {
      const options: ImagePicker.CameraOptions & ImagePicker.ImageLibraryOptions = {
        mediaType: "photo",
        quality: 0.8,
      };

      const result = source === "camera" 
        ? await ImagePicker.launchCamera(options)
        : await ImagePicker.launchImageLibrary(options);

      if (result.didCancel || !result.assets?.[0]?.uri) return;

      const uri = result.assets[0].uri;
      setSaving(true);

      // Preprocess image to standard width (1200px)
      const processedUri = await preprocessImage(uri);
      const dims = await getImageDimensions(processedUri);
      
      // Perform Groq Vision Extraction
      const parsed = await extractWithGroq(processedUri);
      const foundKeys = Object.keys(parsed);

      setDebugImage({ uri: processedUri, ...dims });
      setDebugData(parsed);

      if (foundKeys.length === 0) {
        Alert.alert(
          "Scan Failed",
          "Couldn't read any metrics. Please adjust lighting and try again.",
        );
        return;
      }

      // Reset form with scanned values
      const currentValues = getValues();
      reset({ ...currentValues, ...parsed } as any);
      setAutoFilledFields(foundKeys);

      Alert.alert(
        "Scan Successful",
        `${foundKeys.length} fields auto-filled — please review before saving.`,
      );
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (err) {
      Alert.alert("Scan Error", String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLongPressScan = () => {
    if (debugImage) {
      setIsCalibrationVisible(true);
    } else {
      Alert.alert("No Debug Data", "Scan a report first to view calibration.");
    }
  };

  function CalibrationModal() {
    if (!debugImage) return null;

    // Define zones for overlay (matching parseInBodyText.ts)
    // Scale these to the screen width
    const screenWidth = Dimensions.get("window").width - Spacing.xl * 2;
    const scale = screenWidth / debugImage.width;
    const imgHeight = debugImage.height * scale;

    const zones = [
      { name: "Date", x: 0.35, y: 0.03, w: 0.4, h: 0.05, color: "#00E5FF" },
      { name: "Body", x: 0, y: 0.08, w: 0.55, h: 0.14, color: "#FF6B35" },
      { name: "Score", x: 0.55, y: 0.08, w: 0.45, h: 0.08, color: "#00C97B" },
      { name: "MF", x: 0.35, y: 0.22, w: 0.2, h: 0.13, color: "#A855F7" },
      { name: "Obesity", x: 0.35, y: 0.35, w: 0.2, h: 0.09, color: "#F43F5E" },
    ];

    return (
      <Modal visible={isCalibrationVisible} animationType="slide">
        <View style={styles.debugModal}>
          <View style={styles.debugHeader}>
            <Text style={Typography.heading2}>OCR Calibration</Text>
            <TouchableOpacity onPress={() => setIsCalibrationVisible(false)}>
              <Text style={[Typography.body, { color: Colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ flex: 1 }}>
            <View style={{ width: screenWidth, height: imgHeight, alignSelf: 'center', backgroundColor: '#000' }}>
              <Image 
                source={{ uri: debugImage.uri }} 
                style={{ width: screenWidth, height: imgHeight }} 
                resizeMode="contain" 
              />
              {zones.map(z => (
                <View 
                  key={z.name}
                  style={{
                    position: 'absolute',
                    left: z.x * screenWidth,
                    top: z.y * imgHeight,
                    width: z.w * screenWidth,
                    height: z.h * imgHeight,
                    borderWidth: 1,
                    borderColor: z.color,
                    backgroundColor: z.color + '22',
                  }}
                >
                  <Text style={{ fontSize: 8, color: z.color, backgroundColor: '#0008' }}>{z.name}</Text>
                </View>
              ))}
            </View>

            <View style={{ padding: Spacing.md }}>
              <Text style={Typography.heading3}>Extracted Data:</Text>
              <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                {JSON.stringify(debugData, null, 2)}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  if (loadingInitial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const e = errors as any; // Type override for convenience

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <CalibrationModal />
        
        <TouchableOpacity 
          style={styles.scanBtn} 
          onPress={handleScanReport}
          onLongPress={handleLongPressScan}
          delayLongPress={500}
        >
          <Text style={styles.scanBtnText}>📷 Scan Report (Auto-fill)</Text>
          <Text style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2 }}>
            Long-press for calibration
          </Text>
        </TouchableOpacity>

        <CollapsibleSection title="1. Basic Info" defaultOpen>
          <DatePickerField control={control} error={e.date?.message} />
          <Field
            label="Notes (optional)"
            name="notes"
            control={control}
            keyboardType="default"
          />
        </CollapsibleSection>

        <CollapsibleSection title="2. Body Composition" defaultOpen={!isEdit}>
          <Field
            label="Weight (kg)"
            name="weight"
            control={control}
            error={e.weight?.message}
            highlight={autoFilledFields.includes("weight")}
          />
          <Field
            label="Total Body Water (L)"
            name="totalBodyWater"
            control={control}
            error={e.totalBodyWater?.message}
            highlight={autoFilledFields.includes("totalBodyWater")}
          />
          <Field
            label="Protein (kg)"
            name="protein"
            control={control}
            error={e.protein?.message}
            highlight={autoFilledFields.includes("protein")}
          />
          <Field
            label="Mineral (kg)"
            name="mineral"
            control={control}
            error={e.mineral?.message}
            highlight={autoFilledFields.includes("mineral")}
          />
          <Field
            label="Body Fat Mass (kg)"
            name="bodyFatMass"
            control={control}
            error={e.bodyFatMass?.message}
          />
        </CollapsibleSection>

        <CollapsibleSection title="3. Muscle & Fat" defaultOpen={!isEdit}>
          <Field
            label="Skeletal Muscle Mass (kg)"
            name="skeletalMuscleMass"
            control={control}
            error={e.skeletalMuscleMass?.message}
          />
          <Field
            label="BMI (kg/m²)"
            name="bmi"
            control={control}
            error={e.bmi?.message}
          />
          <Field
            label="Percent Body Fat (%)"
            name="percentBodyFat"
            control={control}
            error={e.percentBodyFat?.message}
          />
          <Field
            label="Visceral Fat Level"
            name="visceralFatLevel"
            control={control}
            error={e.visceralFatLevel?.message}
          />
          <Field
            label="Waist-Hip Ratio"
            name="waistHipRatio"
            control={control}
            error={e.waistHipRatio?.message}
          />
        </CollapsibleSection>

        <CollapsibleSection title="4. Segmental Lean">
          <FieldPair
            labelKg="Left Arm (kg)"
            nameKg="segLeanLeftArm"
            labelPct="Left Arm (%)"
            namePct="segLeanLeftArmPct"
            control={control}
            errors={e}
          />
          <FieldPair
            labelKg="Right Arm (kg)"
            nameKg="segLeanRightArm"
            labelPct="Right Arm (%)"
            namePct="segLeanRightArmPct"
            control={control}
            errors={e}
          />
          <FieldPair
            labelKg="Trunk (kg)"
            nameKg="segLeanTrunk"
            labelPct="Trunk (%)"
            namePct="segLeanTrunkPct"
            control={control}
            errors={e}
          />
          <FieldPair
            labelKg="Left Leg (kg)"
            nameKg="segLeanLeftLeg"
            labelPct="Left Leg (%)"
            namePct="segLeanLeftLegPct"
            control={control}
            errors={e}
          />
          <FieldPair
            labelKg="Right Leg (kg)"
            nameKg="segLeanRightLeg"
            labelPct="Right Leg (%)"
            namePct="segLeanRightLegPct"
            control={control}
            errors={e}
          />
        </CollapsibleSection>

        <CollapsibleSection title="5. Segmental Fat">
          <FieldPair
            labelKg="Left Arm (kg)"
            nameKg="segFatLeftArm"
            labelPct="Left Arm (%)"
            namePct="segFatLeftArmPct"
            control={control}
            errors={e}
          />
          <FieldPair
            labelKg="Right Arm (kg)"
            nameKg="segFatRightArm"
            labelPct="Right Arm (%)"
            namePct="segFatRightArmPct"
            control={control}
            errors={e}
          />
          <FieldPair
            labelKg="Trunk (kg)"
            nameKg="segFatTrunk"
            labelPct="Trunk (%)"
            namePct="segFatTrunkPct"
            control={control}
            errors={e}
          />
          <FieldPair
            labelKg="Left Leg (kg)"
            nameKg="segFatLeftLeg"
            labelPct="Left Leg (%)"
            namePct="segFatLeftLegPct"
            control={control}
            errors={e}
          />
          <FieldPair
            labelKg="Right Leg (kg)"
            nameKg="segFatRightLeg"
            labelPct="Right Leg (%)"
            namePct="segFatRightLegPct"
            control={control}
            errors={e}
          />
        </CollapsibleSection>

        <CollapsibleSection title="6. Research Parameters">
          <Field
            label="Basal Metabolic Rate (kcal)"
            name="basalMetabolicRate"
            control={control}
            error={e.basalMetabolicRate?.message}
          />
          <Field
            label="Fat Free Mass (kg)"
            name="fatFreeMass"
            control={control}
            error={e.fatFreeMass?.message}
          />
          <Field
            label="Obesity Degree (%)"
            name="obesityDegree"
            control={control}
            error={e.obesityDegree?.message}
          />
          <Field
            label="InBody Score (0–100)"
            name="inbodyScore"
            control={control}
            error={e.inbodyScore?.message}
          />
        </CollapsibleSection>

        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.6 }]}
          onPress={handleSubmit(onSubmit as any)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEdit ? "Save Changes" : "Add Report"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  scroll: { padding: Spacing.xl },
  sectionCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  sectionBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  fieldWrapper: { marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    marginTop: Spacing.xs,
  },
  inputError: { borderColor: Colors.error },
  inputDisabled: { opacity: 0.5 },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  pair: { flexDirection: "row", gap: Spacing.md },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 4,
    alignItems: "center",
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  submitBtnText: {
    ...Typography.heading3,
    color: Colors.textInverse,
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  calendarContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    ...Shadow.lg,
  },
  closeBtn: {
    alignItems: "center",
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scanBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  scanBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  debugModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  debugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
