import Link from "next/link";
import { Button } from "@pwpm/ui";

import { Dashboard } from "@/components/dashboard/dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background font-sans text-foreground">
        <h1 className="font-[var(--font-serif)] text-2xl font-semibold">PwPM</h1>
        <p className="text-sm text-muted-foreground">Personal Wealth &amp; Portfolio Management</p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">Tạo tài khoản</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "bạn";

  return <Dashboard name={name} />;
}
