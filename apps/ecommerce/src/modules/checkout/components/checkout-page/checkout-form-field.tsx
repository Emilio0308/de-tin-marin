import type { ReactNode } from "react";

const inputBaseClass =
  "font-body text-body-md text-on-surface bg-surface-container-low w-full rounded-2xl border-2 px-4 py-3 transition-[border-color,background-color,box-shadow] duration-200 outline-none min-h-12 focus-visible:ring-2 focus-visible:ring-offset-0";
const inputNormalClass = `${inputBaseClass} border-outline-variant/35 focus:border-secondary focus:bg-surface-container-lowest focus-visible:ring-secondary/30`;
const inputErrorClass = `${inputBaseClass} border-error bg-error-container/30 focus:border-error focus-visible:ring-error/30`;

type CheckoutFormFieldWrapperProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  requiredHint: string;
  children: (props: {
    id: string;
    describedBy?: string;
    invalid: boolean;
    inputClassName: string;
  }) => ReactNode;
};

export function CheckoutFormFieldWrapper({
  id,
  label,
  required,
  error,
  hint,
  requiredHint,
  children,
}: CheckoutFormFieldWrapperProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="font-label text-label-bold text-on-surface"
        >
          {label}
          {required ? (
            <span className="text-error ml-0.5" aria-hidden>
              *
            </span>
          ) : null}
        </label>
        {required ? (
          <span className="font-body text-body-sm text-on-surface-variant sr-only">
            {requiredHint}
          </span>
        ) : null}
      </div>
      {children({
        id,
        describedBy,
        invalid: Boolean(error),
        inputClassName: error ? inputErrorClass : inputNormalClass,
      })}
      {hint && !error ? (
        <p
          id={hintId}
          className="font-body text-body-sm text-on-surface-variant"
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="font-body text-body-sm text-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type CheckoutTextFieldProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  hint?: string;
  requiredHint: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  maxLength?: number;
  autoCapitalize?: "off" | "none" | "on" | "sentences" | "words" | "characters";
  spellCheck?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function CheckoutTextField({
  id,
  label,
  value,
  required,
  error,
  hint,
  requiredHint,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  autoCapitalize,
  spellCheck,
  onChange,
  onBlur,
}: CheckoutTextFieldProps) {
  return (
    <CheckoutFormFieldWrapper
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      requiredHint={requiredHint}
    >
      {({ id: fieldId, describedBy, invalid, inputClassName }) => (
        <input
          id={fieldId}
          name={fieldId}
          type={type}
          value={value}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={inputClassName}
        />
      )}
    </CheckoutFormFieldWrapper>
  );
}

type CheckoutSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  requiredHint: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function CheckoutSelectField({
  id,
  label,
  value,
  required,
  error,
  requiredHint,
  placeholder,
  options,
  onChange,
  onBlur,
}: CheckoutSelectFieldProps) {
  return (
    <CheckoutFormFieldWrapper
      id={id}
      label={label}
      required={required}
      error={error}
      requiredHint={requiredHint}
    >
      {({ id: fieldId, describedBy, invalid, inputClassName }) => (
        <select
          id={fieldId}
          name={fieldId}
          value={value}
          required={required}
          autoComplete="address-level3"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`${inputClassName} appearance-none`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </CheckoutFormFieldWrapper>
  );
}
