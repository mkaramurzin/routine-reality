"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Globe } from "lucide-react";
import { DateTime } from "luxon";

const FALLBACK_TIMEZONE_OPTIONS = [
  { label: "(GMT -08:00) Pacific Time (US & Canada)", value: "America/Los_Angeles" },
  { label: "(GMT -07:00) Mountain Time (US & Canada)", value: "America/Denver" },
  { label: "(GMT -06:00) Central Time (US & Canada)", value: "America/Chicago" },
  { label: "(GMT -05:00) Eastern Time (US & Canada)", value: "America/New_York" },
  { label: "(GMT +00:00) Greenwich Mean Time", value: "Etc/UTC" },
  { label: "(GMT +01:00) Central European Time", value: "Europe/Berlin" },
  { label: "(GMT +05:30) India Standard Time", value: "Asia/Kolkata" },
  { label: "(GMT +08:00) China Standard Time", value: "Asia/Shanghai" },
  { label: "(GMT +09:00) Japan Standard Time", value: "Asia/Tokyo" },
  { label: "(GMT +10:00) Australian Eastern Time", value: "Australia/Sydney" },
  { label: "(GMT +13:00) New Zealand Daylight Time", value: "Pacific/Auckland" },
  { label: "(GMT -03:00) Brazil (São Paulo)", value: "America/Sao_Paulo" },
  { label: "(GMT -05:00) Colombia (Bogotá)", value: "America/Bogota" },
  { label: "(GMT +02:00) South Africa (Cape Town)", value: "Africa/Johannesburg" },
  { label: "(GMT +03:00) Moscow Time", value: "Europe/Moscow" },
  { label: "(GMT +04:00) Gulf Standard Time (Dubai)", value: "Asia/Dubai" },
  { label: "(GMT +07:00) Thailand (Bangkok)", value: "Asia/Bangkok" },
  { label: "(GMT +09:30) Australian Central Time", value: "Australia/Adelaide" },
  { label: "(GMT +11:00) Solomon Islands", value: "Pacific/Guadalcanal" },
  { label: "(GMT +12:00) Fiji Time", value: "Pacific/Fiji" },
  { label: "(GMT -09:00) Alaska Time", value: "America/Anchorage" },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
  errorMessage?: string;
};

export function TimezoneSelect({ value, onChange, isInvalid, errorMessage }: Props) {
  const [autoDetected, setAutoDetected] = useState<string>("");
  const timezoneOptions = useMemo(() => {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone").map((tz) => {
        const offset = DateTime.now().setZone(tz).toFormat("ZZ");
        return {
          value: tz,
          label: `(GMT${offset}) ${tz.replace(/_/g, " ")}`,
        };
      });
    }
    return FALLBACK_TIMEZONE_OPTIONS;
  }, []);

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setAutoDetected(detected);
      if (!value) {
        onChange(detected); // Set default only if not set
      }
    } catch (error) {
      console.warn("Could not detect timezone:", error);
      if (!value) {
        onChange("Etc/UTC");
      }
    }
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-default-900">
        Timezone <span className="text-danger">*</span>
      </label>
      <Select
        placeholder="Select your timezone"
        selectedKeys={value ? [value] : []}
        onSelectionChange={(keys) => {
          const selected = [...keys][0] as string;
          onChange(selected);
        }}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        startContent={<Globe className="h-4 w-4 text-default-500" />}
        className="w-full"
        description={autoDetected ? `Auto-detected: ${autoDetected}` : undefined}
      >
        {timezoneOptions.map((tz) => (
          <SelectItem key={tz.value}>{tz.label}</SelectItem>
        ))}
      </Select>
    </div>
  );
} 