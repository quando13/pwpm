import { Button } from "@pwpm/ui";

import { signInWithFacebook, signInWithGoogle } from "@/lib/auth/actions";

export function OAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      <form action={signInWithGoogle}>
        <Button type="submit" variant="outline" className="w-full gap-2.5">
          <GoogleLogo />
          Tiếp tục với Google
        </Button>
      </form>
      <form action={signInWithFacebook}>
        <Button type="submit" variant="outline" className="w-full gap-2.5">
          <FacebookLogo />
          Tiếp tục với Facebook
        </Button>
      </form>

      <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-input" />
        hoặc
        <span className="h-px flex-1 bg-input" />
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.06-1-.14-1.5H12z"
      />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94z"
      />
    </svg>
  );
}
