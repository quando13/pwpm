import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground">Chào mừng trở lại PwPM.</p>
      </div>
      <LoginForm />
    </>
  );
}
