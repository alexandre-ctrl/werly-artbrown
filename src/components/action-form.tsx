"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";
import { FormMessage } from "./form-message";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  className?: string;
  buttonClassName?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
};

/** Formulário genérico para Server Actions com mensagem de erro/sucesso. */
export function ActionForm({
  action,
  children,
  submitLabel = "Salvar",
  pendingLabel = "Salvando...",
  className = "space-y-4",
  buttonClassName = "btn btn-primary",
  resetOnSuccess = false,
  confirm,
}: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <div>
        <FormMessage state={state} />
        <button className={buttonClassName} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
