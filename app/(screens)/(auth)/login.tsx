import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";

const Login = () => {
  const { signIn, isSigningIn, error } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FeELINE</Text>
      <Text style={styles.subtitle}>
        Sign in to track your cat's emotional wellbeing.
      </Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={signIn}
        disabled={isSigningIn}
      >
        {isSigningIn ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: "#111111",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 240,
    alignItems: "center",
  },
  googleButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#cc3333",
    marginTop: 16,
    textAlign: "center",
  },
});