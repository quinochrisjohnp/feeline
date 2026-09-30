import { Tabs } from "expo-router";
import FloatingTabBar from "@/components/navigation/FloatingTabBar";

const TabLayout = () => (
  <Tabs
    initialRouteName="camera"
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <FloatingTabBar {...props} />}
  >
    <Tabs.Screen name="camera" options={{ title: "Camera" }} />
    <Tabs.Screen name="album" options={{ title: "Cat Album" }} />
    <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
    <Tabs.Screen name="status" options={{ title: "My Cats" }} />
    <Tabs.Screen name="settings" options={{ title: "Settings" }} />
  </Tabs>
);

export default TabLayout;
