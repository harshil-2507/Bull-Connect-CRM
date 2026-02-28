import { View } from "react-native";
import { useRouter } from "expo-router";
import NewLeadForm from "../components/NewLeadForm";

export default function AddLead() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#f6f8f6]">
      <NewLeadForm
        onSuccess={() => {
          console.log("Lead submitted");
            router.navigate("/manager/leads");
        }}
      />
    </View>
  );
}