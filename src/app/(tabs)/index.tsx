import {
  getTodaysInspections,
  InspectionEvent,
  requestCalendarPermission,
} from "@/lib/calendar";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [inspections, setInspections] = useState<InspectionEvent[]>([]);
  const [manualAddress, setManualAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    setIsLoading(true);
    const granted = await requestCalendarPermission();
    setHasPermission(granted);

    if (granted) {
      const events = await getTodaysInspections();
      setInspections(events);
    }
    setIsLoading(false);
  }

  const handleStartFromCalendar = (inspection: InspectionEvent) => {
    if (!inspection.address) {
      Alert.alert(
        "No Address",
        "This inspection has no address in the calendar. Please enter it manually."
      );
      return;
    }
    router.push({
      pathname: "/session",
      params: { address: inspection.address },
    });
  };

  const handleStartManual = () => {
    if (!manualAddress.trim()) {
      Alert.alert("Address Required", "Please enter the property address.");
      return;
    }
    router.push({
      pathname: "/session",
      params: { address: manualAddress },
    });
  };

  function formatTime(date: Date) {
    return date.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Australia/Melbourne",
    });
  }

  const renderInspection = ({ item }: { item: InspectionEvent }) => (
    <TouchableOpacity
      style={styles.inspectionCard}
      onPress={() => handleStartFromCalendar(item)}
    >
      <View style={styles.inspectionTime}>
        <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
        <Text style={styles.durationText}>{formatTime(item.endTime)}</Text>
      </View>
      <View style={styles.inspectionInfo}>
        <Text style={styles.inspectionTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.inspectionAddress} numberOfLines={1}>
          {item.address || "No address"}
        </Text>
        {item.phone && <Text style={styles.inspectionPhone}>{item.phone}</Text>}
      </View>
      <View style={styles.startArrow}>
        <Text style={styles.startArrowText}>▶</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>TWB</Text>
        <Text style={styles.logoSub}>Property Management</Text>
      </View>

      {/* Today's inspections from calendar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TODAY'S INSPECTIONS</Text>

        {isLoading ? (
          <Text style={styles.loadingText}>Loading calendar...</Text>
        ) : !hasPermission ? (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={loadInspections}
          >
            <Text style={styles.permissionButtonText}>
              Allow Calendar Access
            </Text>
          </TouchableOpacity>
        ) : inspections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No inspections scheduled for today
            </Text>
          </View>
        ) : (
          <FlatList
            data={inspections}
            renderItem={renderInspection}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* Manual entry */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MANUAL ENTRY</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter address manually..."
          placeholderTextColor="#8E939B"
          value={manualAddress}
          onChangeText={setManualAddress}
          autoCapitalize="words"
        />
        <TouchableOpacity
          style={styles.manualButton}
          onPress={handleStartManual}
        >
          <Text style={styles.manualButtonText}>Start Inspection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 28,
  },
  logo: {
    fontSize: 32,
    fontWeight: "600",
    color: "#1F2A44",
    letterSpacing: 3,
  },
  logoSub: {
    fontSize: 14,
    color: "#8E939B",
    marginTop: 4,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1F2A44",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#8E939B",
    textAlign: "center",
    padding: 20,
  },
  permissionButton: {
    backgroundColor: "#C7DDEA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#1F2A44",
    fontSize: 15,
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#8E939B",
  },
  inspectionCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inspectionTime: {
    alignItems: "center",
    minWidth: 56,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2A44",
  },
  durationText: {
    fontSize: 11,
    color: "#8E939B",
    marginTop: 2,
  },
  inspectionInfo: {
    flex: 1,
  },
  inspectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2A44",
    marginBottom: 2,
  },
  inspectionAddress: {
    fontSize: 13,
    color: "#4A4F57",
    marginBottom: 2,
  },
  inspectionPhone: {
    fontSize: 12,
    color: "#8E939B",
  },
  startArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1F2A44",
    alignItems: "center",
    justifyContent: "center",
  },
  startArrowText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  separator: {
    height: 8,
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#1F2A44",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  manualButton: {
    backgroundColor: "#1F2A44",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  manualButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
