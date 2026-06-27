"use client";

import { forwardRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Banknote,
  Boxes,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  FileCheck2,
  Home,
  ImagePlus,
  ListChecks,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Search,
  Tags,
  UploadCloud,
  User,
} from "lucide-react";

const ICONS = {
  banknote: Banknote,
  boxes: Boxes,
  calendar: CalendarDays,
  check: Check,
  file: FileCheck2,
  home: Home,
  image: ImagePlus,
  list: ListChecks,
  lock: Lock,
  mail: Mail,
  map: MapPin,
  message: MessageSquareText,
  phone: Phone,
  search: Search,
  tags: Tags,
  upload: UploadCloud,
  user: User,
};

function resolveIcon(icon) {
  if (!icon) return null;
  if (typeof icon === "string") return ICONS[icon] || null;
  return icon;
}

export function FormSection({ title, eyebrow, description, children, aside, className = "" }) {
  return (
    <section className={`card dashboard-reveal space-y-5 ${className}`}>
      {(eyebrow || title || description) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="mt-1 font-display text-xl font-bold text-ink">{title}</h2>}
            {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function FormField({ label, hint, error, required, children }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label}{required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      {children}
      <div className="min-h-[1.25rem] pt-1">
        {error ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-ink-faint">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

export const TextInput = forwardRef(function TextInput(
  { icon, error, className = "", type = "text", ...props },
  ref
) {
  const Icon = resolveIcon(icon);
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={`input-wrap ${error ? "input-wrap-error" : ""}`}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-faint" />}
      <input
        ref={ref}
        type={isPassword && show ? "text" : type}
        className={`min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink-faint ${className}`}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          className="text-ink-faint transition hover:text-ink"
          onClick={() => setShow((v) => !v)}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
});

export function SelectInput({ icon, error, children, className = "", ...props }) {
  const Icon = resolveIcon(icon);
  return (
    <div className={`input-wrap ${error ? "input-wrap-error" : ""}`}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-faint" />}
      <select className={`min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

export function TextareaInput({ icon, error, className = "", ...props }) {
  const Icon = resolveIcon(icon);
  return (
    <div className={`input-wrap items-start ${error ? "input-wrap-error" : ""}`}>
      {Icon && <Icon className="mt-1 h-4 w-4 shrink-0 text-ink-faint" />}
      <textarea className={`min-w-0 flex-1 resize-y bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink-faint ${className}`} {...props} />
    </div>
  );
}

export function SegmentedControl({ value, onChange, options, columns = "sm:grid-cols-2" }) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {options.map(({ value: optionValue, label, description, icon }) => {
        const Icon = resolveIcon(icon);
        const active = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`segmented-option ${active ? "segmented-option-active" : ""}`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="text-left">
              <span className="block font-bold">{label}</span>
              {description && <span className="block text-xs opacity-75">{description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function FormStepper({ steps, active }) {
  return (
    <ol className="grid gap-2 text-xs sm:grid-cols-5">
      {steps.map((step, i) => {
        const done = i < active;
        const current = i === active;
        const Icon = resolveIcon(step.icon);
        return (
          <li key={step.label} className={`form-step ${current ? "form-step-current" : done ? "form-step-done" : ""}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-current/10">
              {done ? <Check className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" /> : i + 1}
            </span>
            <span className="min-w-0 truncate font-bold">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function FileUploadBox({ label, hint, accept, multiple, onChange, count = 0, uploading = false }) {
  return (
    <label className="file-upload-box">
      <input type="file" accept={accept} multiple={multiple} className="sr-only" onChange={onChange} />
      <UploadCloud className="h-6 w-6 text-brand" />
      <span>
        <span className="block font-bold text-ink">{label}</span>
        <span className="block text-xs text-ink-faint">{uploading ? "Uploading..." : hint}</span>
      </span>
      <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand">{count}</span>
    </label>
  );
}

export function SubmitButton({ children, loading, className = "", ...props }) {
  return (
    <button className={`btn-primary ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function MotionFormCard({ children, className = "", ...props }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
