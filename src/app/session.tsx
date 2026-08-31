import { useSessionTimer } from "@/hooks/use-session-timer";
import { createAlert, createSession, updateSession } from "@/lib/sessions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SessionScreen() {
  const { address } = useLocalSearchParams<{ address: string }>();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const TIMER_MINUTES = 30;

  const handleTestAlert = async () => {
    try {
      // Get agent details from AsyncStorage
      const agentEmail = (await AsyncStorage.getItem("agent_email")) || "";

      // Get agent phone and emergency contact from Supabase
      const { data: agent } = await supabase
        .from("agents")
        .select("name, phone, emergency_contact_phone")
        .eq("email", agentEmail)
        .single();

      if (!agent?.phone || !agent?.emergency_contact_phone) {
        Alert.alert(
          "Missing Details",
          "Please make sure your profile has both your phone number and emergency contact number saved."
        );
        return;
      }

      console.log(
        "Sending test to:",
        agent.phone,
        agent.emergency_contact_phone
      );

      const response = await fetch(
        "https://lwkccijmxdwvlzsbnhkc.supabase.co/functions/v1/send-alert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3a2NjaWpteGR3dmx6c2JuaGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzOTk2MTcsImV4cCI6MjA5ODk3NTYxN30.ioxvol3oBbmKnSKg_ClmE7UgsYIYyXxtbeq6-z1eGOA`,
          },
          body: JSON.stringify({
            agentPhone: agent.phone,
            emergencyPhone: agent.emergency_contact_phone,
            agentName: agent.name,
            address: address || "Test Address",
          }),
        }
      );

      const result = await response.json();
      console.log("Alert result:", JSON.stringify(result));

      if (result.agentSMS?.success && result.emergencySMS?.success) {
        Alert.alert(
          "✓ Test Sent",
          "Test SMS sent to both you and your emergency contact."
        );
      } else {
        Alert.alert(
          "SMS Failed",
          `Agent SMS: ${
            result.agentSMS?.success ? "Sent" : "Failed"
          }\nEmergency SMS: ${
            result.emergencySMS?.success ? "Sent" : "Failed"
          }\n\nError: ${JSON.stringify(
            result.agentSMS?.error || result.emergencySMS?.error
          )}`
        );
      }
    } catch (err) {
      console.error("Test alert error:", err);
      Alert.alert("Error", `Failed to send test: ${err}`);
    }
  };

  // Save session to Supabase on screen load
  useEffect(() => {
    async function initSession() {
      setIsSaving(true);

      // Get agent email from local storage
      const agentEmail = (await AsyncStorage.getItem("agent_email")) || "";
      console.log("Agent email:", agentEmail);

      const session = await createSession(
        address || "",
        agentEmail,
        TIMER_MINUTES
      );

      if (session) {
        setSessionId(session.id);
        console.log("Session created:", session.id);
      } else {
        Alert.alert(
          "Connection Error",
          "Could not save session. Please check your connection."
        );
      }
      setIsSaving(false);
    }

    initSession();
  }, []);

  const handleTimerExpire = async () => {
    // Log the alert to Supabase
    if (sessionId) {
      await createAlert(sessionId, "timer_expired");
    }

    Alert.alert(
      "⚠️ Time Warning",
      "Your inspection timer has expired. Are you still inside?",
      [
        {
          text: "I'm fine, still inside",
          onPress: async () => {
            if (sessionId) {
              await createAlert(sessionId, "agent_safe_reset");
            }
            timer.reset();
          },
        },
        {
          text: "I need help",
          style: "destructive",
          onPress: () => handleEmergency(),
        },
      ]
    );
  };

  const handleEmergency = async () => {
    if (sessionId) {
      await createAlert(sessionId, "emergency");
      await updateSession(sessionId, { status: "emergency" });
    }
    Alert.alert("🚨 Alert Sent", "Your emergency contact has been notified.");
  };

  const handleCheckOut = () => {
    Alert.alert("Check Out", "Are you safely back in your car?", [
      { text: "Not yet", style: "cancel" },
      {
        text: "Yes, check out",
        onPress: async () => {
          timer.stop();
          if (sessionId) {
            await updateSession(sessionId, {
              status: "completed",
              check_out_time: new Date().toISOString(),
            });
          }
          router.back();
        },
      },
    ]);
  };

  const timer = useSessionTimer(TIMER_MINUTES, handleTimerExpire);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Active Inspection</Text>
        <Text style={styles.address}>{address || "123 Example Street"}</Text>
        {isSaving && <Text style={styles.savingText}>Saving session...</Text>}
        {sessionId && <Text style={styles.savedText}>✓ Session saved</Text>}
      </View>

      <View
        style={[
          styles.timerCard,
          timer.secondsRemaining < 300 && styles.timerCardWarning,
        ]}
      >
        <Text style={styles.timerLabel}>Time Remaining</Text>
        <Text
          style={[
            styles.timerDisplay,
            timer.secondsRemaining < 300 && styles.timerDisplayWarning,
          ]}
        >
          {timer.display}
        </Text>
        <Text style={styles.timerSub}>
          {timer.secondsRemaining < 300
            ? "⚠️ Less than 5 minutes remaining"
            : "Alert fires when timer reaches 00:00"}
        </Text>
      </View>

      {!timer.isRunning ? (
        <TouchableOpacity style={styles.startButton} onPress={timer.start}>
          <Text style={styles.startButtonText}>▶ Start Timer</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.resetButton} onPress={timer.reset}>
          <Text style={styles.resetButtonText}>↺ I'm Fine — Reset Timer</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckOut}>
        <Text style={styles.checkoutButtonText}>✓ Check Out Safely</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.panicButton} onPress={handleEmergency}>
        <Text style={styles.panicButtonText}>🚨 Emergency</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.testButton} onPress={handleTestAlert}>
        <Text style={styles.testButtonText}>📱 Test SMS Alert</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  headerLabel: {
    fontSize: 12,
    color: "#8E939B",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  address: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1F2A44",
    lineHeight: 28,
  },
  savingText: {
    fontSize: 12,
    color: "#8E939B",
    marginTop: 6,
  },
  savedText: {
    fontSize: 12,
    color: "#34C759",
    marginTop: 6,
  },
  timerCard: {
    backgroundColor: "#F5F7FA",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "transparent",
  },
  timerCardWarning: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FF4444",
  },
  timerLabel: {
    fontSize: 12,
    color: "#8E939B",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: "200",
    color: "#1F2A44",
    letterSpacing: 4,
    fontVariant: ["tabular-nums"],
  },
  timerDisplayWarning: {
    color: "#FF4444",
  },
  timerSub: {
    fontSize: 12,
    color: "#8E939B",
    marginTop: 8,
    textAlign: "center",
  },
  startButton: {
    backgroundColor: "#1F2A44",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  resetButton: {
    backgroundColor: "#C7DDEA",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  resetButtonText: {
    color: "#1F2A44",
    fontSize: 16,
    fontWeight: "600",
  },
  checkoutButton: {
    backgroundColor: "#1F2A44",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  panicButton: {
    backgroundColor: "#FF4444",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  panicButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  testButton: {
    backgroundColor: "#4A4F57",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
