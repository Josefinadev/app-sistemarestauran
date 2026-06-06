/**
 * Input sanitization + validation utilities.
 *
 * These helpers are designed to be used both for blocking invalid
 * keystrokes (onKeyDown) and for cleaning up pasted content
 * (onChange). Combined, they prevent invalid characters from ever
 * landing in state, while still letting the user paste and the
 * browser apply autocomplete.
 */

export type InputRule = "decimal" | "integer" | "email" | "phone" | "slug" | "text";

/** Sanitize a string to match a given input rule. */
export function sanitize(value: string, rule: InputRule): string {
  switch (rule) {
    case "decimal": {
      // Keep digits and a single decimal point. Cap to 2 decimals.
      const cleaned = value.replace(/[^0-9.]/g, "");
      const firstDot = cleaned.indexOf(".");
      let normalized = cleaned;
      if (firstDot >= 0) {
        normalized =
          cleaned.slice(0, firstDot + 1) +
          cleaned.slice(firstDot + 1).replace(/\./g, "");
        const [intPart, decPart = ""] = normalized.split(".");
        normalized = decPart.length > 2 ? `${intPart}.${decPart.slice(0, 2)}` : normalized;
      }
      return normalized;
    }
    case "integer":
      return value.replace(/[^0-9]/g, "");
    case "email":
      return value
        .toLowerCase()
        .replace(/[^a-z0-9@._\-+]/g, "")
        .replace(/@{2,}/g, "@");
    case "phone":
      return value.replace(/[^0-9+\-\s()]/g, "");
    case "slug":
      return value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    case "text":
    default:
      return value;
  }
}

/** Validation for a given input rule, returning a user-facing error or null. */
export function validate(value: string, rule: InputRule, opts?: { required?: boolean; min?: number; max?: number }): string | null {
  if (opts?.required && value.trim() === "") {
    return "Este campo es obligatorio";
  }
  if (value.trim() === "") return null;

  switch (rule) {
    case "decimal": {
      const n = Number(value);
      if (!Number.isFinite(n)) return "Ingresa un número válido";
      if (opts?.min !== undefined && n < opts.min) return `Mínimo ${opts.min}`;
      if (opts?.max !== undefined && n > opts.max) return `Máximo ${opts.max}`;
      return null;
    }
    case "integer": {
      const n = Number(value);
      if (!Number.isInteger(n)) return "Ingresa un entero válido";
      if (opts?.min !== undefined && n < opts.min) return `Mínimo ${opts.min}`;
      if (opts?.max !== undefined && n > opts.max) return `Máximo ${opts.max}`;
      return null;
    }
    case "email": {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        return "Email inválido";
      }
      return null;
    }
    case "phone": {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 6) return "Teléfono demasiado corto";
      return null;
    }
    default:
      return null;
  }
}
