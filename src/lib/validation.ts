import { z } from "zod";

/** Campo de formulário opcional: string vazia vira undefined. */
export const optionalText = (max = 500) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

export const optionalInt = (min = 0, max = 100000) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ message: "Número inválido." }).int().min(min).max(max).optional(),
  );

export const optionalDate = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.").optional(),
);

export const optionalTime = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido.").optional(),
);

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Verifique os dados informados.";
}
