import { Redirect } from "expo-router";
import BrandedSplash from "@/components/common/BrandedSplash";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { profile, isLoading } = useAuth();
  if (isLoading) return <BrandedSplash />;
  return <Redirect href={profile ? "/(screens)/(tabs)/camera" : "/(screens)/(auth)/login"} />;
};

export default Index;
