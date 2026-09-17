"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle, LockKeyhole, AlertCircle } from "lucide-react";
import { API_URL, fetchWithTimeout } from "@/lib/api";
import { validatePhoneNumber } from "@/lib/format";
import styles from "@/app/(site)/join-our-club/club.module.css";

type Field = "name" | "phone" | "email" | "privacy_consent";

interface FormState {
  name: string;
  phone: string;
  email: string;
  marketing_consent: boolean;
  privacy_consent: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_LETTERS_REGEX = /[a-zA-Z\u00C0-\u017F]/;

type JoinError = Error & { fieldErrors?: Partial<Record<Field, string>> };

interface ClubJoinResponse {
  detail: string;
  email_delivery?: "accepted" | "failed";
}

async function joinClub(values: FormState): Promise<ClubJoinResponse> {
  const res = await fetchWithTimeout(`${API_URL}/club/join/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      privacy_consent: values.privacy_consent,
      marketing_consent: values.marketing_consent,
      website: "",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) return body;

  const fieldErrors: Partial<Record<Field, string>> = {};
  for (const key of ["name", "phone", "email", "privacy_consent"] as const) {
    if (Array.isArray(body[key])) fieldErrors[key] = body[key][0];
  }
  const error = new Error(
    res.status === 429
      ? "Too many attempts. Please try again in a few moments."
      : Object.keys(fieldErrors).length
        ? "Please check the highlighted fields."
        : "We couldn’t save your registration. Please try again.",
  ) as JoinError;
  error.fieldErrors = fieldErrors;
  throw error;
}

export default function ClubRegistrationForm({ contactEmail }: { contactEmail: string }) {
  const [success, setSuccess] = useState(false);
  const [emailDeliveryFailed, setEmailDeliveryFailed] = useState(false);
  const [error, setError] = useState("");

  const [formValues, setFormValues] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    marketing_consent: false,
    privacy_consent: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const joinMutation = useMutation({ mutationFn: joinClub });
  const busy = joinMutation.isPending;

  function validateSingleField(field: Field, val: string | boolean): string | undefined {
    if (field === "name") {
      const str = typeof val === "string" ? val.trim() : "";
      if (!str) return "Please enter your name.";
      if (str.length < 2) return "Name must be at least 2 characters.";
      if (!NAME_LETTERS_REGEX.test(str)) return "Name must contain letters.";
      return undefined;
    }

    if (field === "phone") {
      const str = typeof val === "string" ? val.trim() : "";
      if (!str) return undefined; // Phone is optional
      const res = validatePhoneNumber(str);
      if (!res.isValid) {
        return res.error || "Please enter a valid phone number (e.g. 0452 135 499).";
      }
      return undefined;
    }

    if (field === "email") {
      const str = typeof val === "string" ? val.trim() : "";
      if (!str) return "Please enter your email address.";
      if (!EMAIL_REGEX.test(str)) return "Please enter a valid email address (e.g. you@example.com).";
      if (str.length > 254) return "Email address is too long.";
      return undefined;
    }

    if (field === "privacy_consent") {
      if (!val) return "Please agree to the privacy notice to join.";
      return undefined;
    }

    return undefined;
  }

  function validateAll(): { isValid: boolean; errors: Partial<Record<Field, string>> } {
    const errors: Partial<Record<Field, string>> = {};

    const nameErr = validateSingleField("name", formValues.name);
    if (nameErr) errors.name = nameErr;

    const phoneErr = validateSingleField("phone", formValues.phone);
    if (phoneErr) errors.phone = phoneErr;

    const emailErr = validateSingleField("email", formValues.email);
    if (emailErr) errors.email = emailErr;

    const privacyErr = validateSingleField("privacy_consent", formValues.privacy_consent);
    if (privacyErr) errors.privacy_consent = privacyErr;

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  function handleBlur(field: Field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === "privacy_consent" ? formValues.privacy_consent : formValues[field];
    const err = validateSingleField(field, val);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: err,
    }));
  }

  function handlePrivacyChange(checked: boolean) {
    setFormValues((prev) => ({ ...prev, privacy_consent: checked }));
    setTouched((prev) => ({ ...prev, privacy_consent: true }));
    setFieldErrors((prev) => ({
      ...prev,
      privacy_consent: validateSingleField("privacy_consent", checked),
    }));
    setError("");
  }

  function handleChange(field: keyof FormState, value: string | boolean) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setError("");

    // If the field has already shown an error, re-validate immediately for smooth feedback
    if (fieldErrors[field as Field]) {
      const err = validateSingleField(field as Field, value);
      setFieldErrors((prev) => ({
        ...prev,
        [field]: err,
      }));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (joinMutation.isPending) return;

    // Run full client-side validation
    const { isValid, errors } = validateAll();
    setTouched({
      name: true,
      phone: true,
      email: true,
      privacy_consent: true,
    });
    setFieldErrors(errors);

    if (!isValid) {
      setError("Please check the highlighted fields below.");
      const firstKey = Object.keys(errors)[0];
      if (firstKey) {
        const el = document.getElementById(`club-${firstKey}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }
      return;
    }

    setError("");

    try {
      const result = await joinMutation.mutateAsync(formValues);
      setEmailDeliveryFailed(result.email_delivery === "failed");
      setSuccess(true);
    } catch (e) {
      const serverErrors = (e as JoinError).fieldErrors;
      if (serverErrors && Object.keys(serverErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...serverErrors }));
        const first = Object.keys(serverErrors)[0];
        document.getElementById(`club-${first}`)?.focus();
      }
      setError(
        e instanceof TypeError || (e instanceof DOMException && e.name === "AbortError")
          ? "We couldn’t reach the club. Please check your connection and try again."
          : e instanceof Error
          ? e.message
          : "Something went wrong. Please try again."
      );
    }
  }

  if (success) {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successIcon}>
          <Check size={30} aria-hidden="true" />
        </span>
        <h3>Thanks for joining!</h3>
        <p>There’s always room for another pancake person.</p>
        {emailDeliveryFailed ? (
          <p className={styles.deliveryWarning} role="alert">
            Your membership is saved, but we couldn&apos;t send the email update to{" "}
            <strong>{formValues.email}</strong>. You do not need to submit the form again.
          </p>
        ) : (
          <p>
            We’ve sent an update to <strong>{formValues.email}</strong>. New members receive a welcome; existing members keep their saved preferences unchanged.
          </p>
        )}
        <p>
          To change them or leave the club anytime, <a href={`mailto:${contactEmail}`}>get in touch</a>.
        </p>
        <Link href="/menu" className={styles.submit}>
          Find your next favourite <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={styles.form} aria-busy={busy} noValidate>
      {/* Name Field */}
      <div className={styles.field}>
        <label htmlFor="club-name">Your name</label>
        <input
          id="club-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Alex Taylor"
          required
          maxLength={100}
          value={formValues.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          aria-invalid={touched.name && !!fieldErrors.name}
          aria-describedby={fieldErrors.name ? "club-name-error" : undefined}
        />
        {touched.name && fieldErrors.name && (
          <p id="club-name-error" className={styles.fieldError} role="alert">
            <AlertCircle size={13} className="inline mr-1" aria-hidden="true" />
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Phone Field (Optional with validation) */}
      <div className={styles.field}>
        <label htmlFor="club-phone">
          Phone number <span className={styles.optionalTag}>Optional</span>
        </label>
        <input
          id="club-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="e.g. 0452 135 499 or +61 452 135 499"
          maxLength={20}
          value={formValues.phone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("phone", e.target.value)}
          onBlur={() => handleBlur("phone")}
          aria-invalid={touched.phone && !!fieldErrors.phone}
          aria-describedby={fieldErrors.phone ? "club-phone-error" : undefined}
        />
        {touched.phone && fieldErrors.phone && (
          <p id="club-phone-error" className={styles.fieldError} role="alert">
            <AlertCircle size={13} className="inline mr-1" aria-hidden="true" />
            {fieldErrors.phone}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className={styles.field}>
        <label htmlFor="club-email">Email address</label>
        <input
          id="club-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@example.com"
          required
          maxLength={254}
          value={formValues.email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          aria-invalid={touched.email && !!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "club-email-error" : undefined}
        />
        {touched.email && fieldErrors.email && (
          <p id="club-email-error" className={styles.fieldError} role="alert">
            <AlertCircle size={13} className="inline mr-1" aria-hidden="true" />
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Marketing Consent */}
      <label className={styles.check}>
        <input
          name="marketing_consent"
          type="checkbox"
          checked={formValues.marketing_consent}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("marketing_consent", e.target.checked)}
        />
        <span>
          Send me menu news, club updates and occasional offers by email. <em>Optional.</em>
        </span>
      </label>

      {/* Privacy Consent (Mandatory) */}
      <label className={styles.check}>
        <input
          id="club-privacy_consent"
          name="privacy_consent"
          type="checkbox"
          required
          checked={formValues.privacy_consent}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handlePrivacyChange(e.target.checked)}
          aria-invalid={touched.privacy_consent && !!fieldErrors.privacy_consent}
          aria-describedby={fieldErrors.privacy_consent ? "club-privacy-error" : undefined}
        />
        <span>
          I agree to my details being stored to manage my club registration, as explained in the{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy (opens in a new tab)
          </Link>
          .
        </span>
      </label>
      {touched.privacy_consent && fieldErrors.privacy_consent && (
        <p id="club-privacy-error" className={styles.fieldError} role="alert">
          <AlertCircle size={13} className="inline mr-1" aria-hidden="true" />
          {fieldErrors.privacy_consent}
        </p>
      )}

      {/* Top Level Error */}
      {error && (
        <p className={styles.error} role="alert">
          <AlertCircle size={15} className="inline mr-1.5" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Submit Button */}
      <button className={styles.submit} type="submit" disabled={busy}>
        {busy ? (
          <>
            Joining… <LoaderCircle size={20} className={styles.spinner} aria-hidden="true" />
          </>
        ) : (
          <>
            Count me in <ArrowRight size={20} aria-hidden="true" />
          </>
        )}
      </button>

      <p className={styles.reassurance}>
        <LockKeyhole size={13} aria-hidden="true" /> Your details stay between you and the club.
      </p>
      <p className={styles.preferenceNote}>
        Already joined? <a href={`mailto:${contactEmail}`}>Contact us</a> to update your details, opt out or leave the club.
      </p>
    </form>
  );
}
