import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { profile, isLoading } = useAuth();
  if (isLoading) return null;
  return <Redirect href={profile ? "/(screens)/(tabs)/camera" : "/(screens)/(auth)/login"} />;
};

export default Index;
