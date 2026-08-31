import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

type Session = {
  id: string;
  address: string;
  status: string;
  check_in_time: string;
  check_out_time: string | null;
  timer_minutes: number;
};

function getStatusColour(status: string) {
  switch (status) {
    case "completed":
      return "#34C759";
    case "active":
      return "#007AFF";
    case "warning_1":
      return "#FF9500";
    case "warning_2":
      return "#FF3B30";
    case "emergency":
      return "#FF3B30";
    default:
      return "#8E939B";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "✓ Completed";
    case "active":
      return "● Active";
    case "warning_1":
      return "⚠ Warning";
    case "warning_2":
      return "⚠ Escalated";
    case "emergency":
      return "🚨 Emergency";
    default:
      return status;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-AU", {
    timeZone: "Australia/Melbourne",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getDuration(checkIn: string, checkOut: string | null) {
  if (!checkOut) return "In progress";
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const minutes = Math.floor((end - start) / 60000);
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

export default function InspectionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("check_in_time", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading sessions:", error);
    } else {
      setSessions(data || []);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadSessions();
  };

  const renderSession = ({ item }: { item: Session }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColour(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColour(item.status) }]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Check in</Text>
          <Text style={styles.detailValue}>
            {formatDate(item.check_in_time)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>
            {getDuration(item.check_in_time, item.check_out_time)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Timer set</Text>
          <Text style={styles.detailValue}>{item.timer_minutes} mins</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centreContainer}>
        <Text style={styles.loadingText}>Loading inspections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inspection History</Text>
        <Text style={styles.subtitle}>
          {sessions.length} inspection{sessions.length !== 1 ? "s" : ""}{" "}
          recorded
        </Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No inspections yet</Text>
          <Text style={styles.emptySubtitle}>
            Start an inspection from the Home tab and it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#1F2A44"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centreContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    fontSize: 15,
    color: "#8E939B",
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1F2A44",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#8E939B",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  sessionCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  sessionAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2A44",
    flex: 1,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  sessionDetails: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#8E939B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: "#4A4F57",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2A44",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E939B",
    textAlign: "center",
    lineHeight: 20,
  },
});
