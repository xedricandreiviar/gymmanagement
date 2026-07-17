"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PhotoUpload } from "@/components/registration/photo-upload";

interface RegistrationFormProps {
  token: string;
  email: string;
  fullName: string;
}

interface FieldErrors {
  password?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  photo?: string;
  general?: string;
}

export function RegistrationForm({ token, email, fullName }: RegistrationFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function validateForm(): boolean {
    const newErrors: FieldErrors = {};

    // Password validation: 8-72 chars, uppercase, lowercase, number
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8 || password.length > 72) {
      newErrors.password = "Password must be between 8 and 72 characters.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter.";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number.";
    }

    // Phone validation: 7-15 digits
    if (!phone) {
      newErrors.phone = "Phone number is required.";
    } else {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        newErrors.phone = "Phone number must contain between 7 and 15 digits.";
      }
    }

    if (!emergencyContactName.trim()) {
      newErrors.emergencyContactName = "Emergency contact name is required.";
    }

    if (!emergencyContactPhone) {
      newErrors.emergencyContactPhone = "Emergency contact phone is required.";
    } else {
      const digits = emergencyContactPhone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        newErrors.emergencyContactPhone = "Phone number must contain between 7 and 15 digits.";
      }
    }

    if (!photo) {
      newErrors.photo = "A photo is required to complete registration.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("password", password);
      formData.append("phone", phone);
      formData.append("emergencyContactName", emergencyContactName);
      formData.append("emergencyContactPhone", emergencyContactPhone);
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Clear password on error (per requirement 3.6)
        setPassword("");

        if (data.field) {
          setErrors({ [data.field]: data.error });
        } else {
          setErrors({ general: data.error || "Registration failed. Please try again." });
        }
        setLoading(false);
        return;
      }

      // Success: redirect to success page
      router.push("/register/success");
    } catch {
      setPassword("");
      setErrors({ general: "A network error occurred. Please try again." });
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-center mb-2">Complete Registration</h1>
      <p className="text-sm text-muted text-center mb-6">
        Welcome, {fullName}! Set up your account to get started.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email - read-only, pre-filled */}
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          readOnly
          disabled
          className="opacity-70"
        />

        {/* Password with requirements */}
        <div className="space-y-1.5">
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
          />
          <ul className="text-xs text-muted space-y-0.5 ml-1">
            <li className={password.length >= 8 && password.length <= 72 ? "text-success" : ""}>
              • 8–72 characters
            </li>
            <li className={/[A-Z]/.test(password) ? "text-success" : ""}>
              • At least one uppercase letter
            </li>
            <li className={/[a-z]/.test(password) ? "text-success" : ""}>
              • At least one lowercase letter
            </li>
            <li className={/[0-9]/.test(password) ? "text-success" : ""}>
              • At least one number
            </li>
          </ul>
        </div>

        {/* Phone */}
        <Input
          id="phone"
          label="Phone Number"
          type="tel"
          placeholder="e.g. 09171234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          required
        />

        {/* Emergency Contact Name */}
        <Input
          id="emergency-contact-name"
          label="Emergency Contact Name"
          type="text"
          placeholder="Full name of emergency contact"
          value={emergencyContactName}
          onChange={(e) => setEmergencyContactName(e.target.value)}
          error={errors.emergencyContactName}
          required
        />

        {/* Emergency Contact Phone */}
        <Input
          id="emergency-contact-phone"
          label="Emergency Contact Phone"
          type="tel"
          placeholder="e.g. 09179876543"
          value={emergencyContactPhone}
          onChange={(e) => setEmergencyContactPhone(e.target.value)}
          error={errors.emergencyContactPhone}
          required
        />

        {/* Photo Upload - Mandatory */}
        <PhotoUpload
          onPhotoSelect={(file) => setPhoto(file)}
          error={errors.photo}
        />

        {/* General error */}
        {errors.general && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2" role="alert">
            {errors.general}
          </p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Complete Registration
        </Button>
      </form>
    </Card>
  );
}
