import { Button } from "@pwpm/ui";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background font-sans text-foreground">
      <h1 className="text-2xl font-semibold">PwPM</h1>
      <p className="text-sm opacity-70">Personal Wealth & Portfolio Management</p>
      <Button>Get Started</Button>
    </div>
  );
}
