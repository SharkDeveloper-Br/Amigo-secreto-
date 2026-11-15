export class InvalidPhoneError extends Error {
  constructor() {
    super("Telefone inválido. Use DDD + número, ex: (11) 98765-4321.");
    this.name = "InvalidPhoneError";
  }
}

/**
 * Normaliza telefone para dígitos no formato internacional (sem "+"),
 * pronto para wa.me. Sem "+", assume Brasil.
 * Vazio → null. Inválido → InvalidPhoneError.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/[^\d\s()+.-]/.test(trimmed)) throw new InvalidPhoneError();

  const digits = trimmed.replace(/\D/g, "");
  let full: string;
  if (trimmed.startsWith("+")) {
    full = digits;
  } else if (/^55\d{10,11}$/.test(digits)) {
    full = digits;
  } else if (/^\d{10,11}$/.test(digits)) {
    full = `55${digits}`;
  } else {
    throw new InvalidPhoneError();
  }

  if (full.startsWith("55") && !/^55[1-9]{2}\d{8,9}$/.test(full)) throw new InvalidPhoneError();
  if (full.length < 8 || full.length > 15) throw new InvalidPhoneError();
  return full;
}

/** Mostra telefone de forma amigável. */
export function formatPhone(phone: string): string {
  const br = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(phone);
  if (br) return `(${br[1]}) ${br[2]}-${br[3]}`;
  return `+${phone}`;
}
