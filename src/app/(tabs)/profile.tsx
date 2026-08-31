import { AgentProfile, getProfile, saveProfile } from "@/lib/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load existing profile on screen open
  useEffect(() => {
    async function loadProfile() {
      if (!email) return;
      const profile = await getProfile(email);
      if (profile) {
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setEmergencyName(profile.emergency_contact_name || "");
        setEmergencyPhone(profile.emergency_contact_phone || "");
      }
    }
    loadProfile();
  }, [email]);

  const handleSave = async () => {
    // Validate fields
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }
    if (!emergencyName.trim()) {
      Alert.alert("Required", "Please enter an emergency contact name.");
      return;
    }
    if (!emergencyPhone.trim()) {
      Alert.alert(
        "Required",
        "Please enter an emergency contact phone number."
      );
      return;
    }

    setIsSaving(true);

    const profile: AgentProfile = {
      name,
      email,
      phone,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
    };

    const saved = await saveProfile(profile);

    if (saved) {
      await AsyncStorage.setItem("agent_email", email);
      await AsyncStorage.setItem("agent_name", name);
    }

    setIsSaving(false);

    if (saved) {
      setIsSaved(true);
      Alert.alert(
        "✓ Profile Saved",
        "Your details and emergency contact have been saved successfully."
      );
    } else {
      Alert.alert("Error", "Could not save your profile. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>
            Your details are used to notify your emergency contact if your
            safety timer expires.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR DETAILS</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Amy Macdonald"
            placeholderTextColor="#8E939B"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. amy@twbrealty.com.au"
            placeholderTextColor="#8E939B"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0444 123 456"
            placeholderTextColor="#8E939B"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMERGENCY CONTACT</Text>
          <Text style={styles.sectionSubtitle}>
            This person will be notified by SMS if your timer expires and you do
            not respond.
          </Text>

          <Text style={styles.label}>Contact Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jane Smith"
            placeholderTextColor="#8E939B"
            value={emergencyName}
            onChangeText={setEmergencyName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Contact Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0400 000 000"
            placeholderTextColor="#8E939B"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Important</Text>
          <Text style={styles.warningText}>
            Make sure your emergency contact knows they may receive safety
            alerts from this app. They should be someone who can take immediate
            action if needed.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving
              ? "Saving..."
              : isSaved
              ? "✓ Profile Saved"
              : "Save Profile"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1F2A44",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8E939B",
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#F97316",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#8E939B",
    marginBottom: 16,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4A4F57",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#1F2A44",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  warningCard: {
    backgroundColor: "#FFF5F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#F97316",
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2A44",
    marginBottom: 6,
  },
  warningText: {
    fontSize: 13,
    color: "#4A4F57",
    lineHeight: 19,
  },
  saveButton: {
    backgroundColor: "#1F2A44",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: "#8E939B",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
