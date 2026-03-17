import { View } from "react-native";
import { useRouter } from "expo-router";
import NewLeadForm from "../components/NewLeadForm";
import { Feather } from "@expo/vector-icons";

export const drawerLabel = 'Add Lead';
export const drawerIcon = ({ color, size }: { color: string; size: number }) => (
  <Feather name="plus-circle" size={size} color={color} />
);

export default function AddLead() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#f6f8f6]">
      <NewLeadForm
        onSuccess={() => {
          console.log("Lead submitted");
            router.navigate("/manager/Leads");
        }}
      />
    </View>
  );
}