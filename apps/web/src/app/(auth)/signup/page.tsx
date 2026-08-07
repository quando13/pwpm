import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <>
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">Tạo tài khoản</h1>
        <p className="text-sm text-muted-foreground">Bắt đầu quản lý danh mục đầu tư của bạn.</p>
      </div>
      <SignupForm />
    </>
  );
}
