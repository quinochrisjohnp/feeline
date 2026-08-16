import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import React from 'react'

const Index = () => {
  return (
    <View style={styles.container}>
      <Text>index</Text>

    <Link href="/(tabs)/camera">
      Click this
    </Link>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  link: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "blue",
    color: "white",
  },
});