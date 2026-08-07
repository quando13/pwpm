import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">Quên mật khẩu</h1>
        <p className="text-sm text-muted-foreground">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
