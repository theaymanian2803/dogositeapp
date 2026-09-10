import { Redirect, Stack, usePathname } from "expo-router";
import { AdminSessionProvider, useAdminSession } from "../../lib/adminSession";
import { Loading } from "../../components/ui/Loading";

function AdminGate() {
  const { email, ready } = useAdminSession();
  const pathname = usePathname();
  if (!ready) return <Loading />;
  if (!email && pathname !== "/admin/login") return <Redirect href="/admin/login" />;
  if (email && pathname === "/admin/login") return <Redirect href="/admin/orders" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function AdminLayout() {
  return (
    <AdminSessionProvider>
      <AdminGate />
    </AdminSessionProvider>
  );
}