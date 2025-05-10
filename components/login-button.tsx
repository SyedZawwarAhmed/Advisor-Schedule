import { Button, type ButtonProps } from "@/components/ui/button";

import { signIn } from "@/auth";

export function LoginButton({ size, ...props }: ButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <Button size={size} {...props} type="submit">
        Signin with Google
      </Button>
    </form>
  );
}
