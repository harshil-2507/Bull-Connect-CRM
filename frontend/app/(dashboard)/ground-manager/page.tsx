import { redirect } from "next/navigation";

export default function GroundManagerPage() {
  redirect("/ground-manager/dashboard");
  return null;
}