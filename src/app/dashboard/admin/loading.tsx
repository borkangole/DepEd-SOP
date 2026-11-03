import DashboardSkeleton from "@/components/DashboardSkeleton";

// Rendered inside the admin shell (sidebar + top bar stay put).
export default function Loading() {
  return <DashboardSkeleton withHeader={false} />;
}
