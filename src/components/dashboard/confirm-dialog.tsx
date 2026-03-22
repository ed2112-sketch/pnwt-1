"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmButton({
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  variant = "destructive",
  children,
  disabled,
}: {
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  variant?: "destructive" | "default";
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm">
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        <Button
          size="sm"
          variant={variant}
          onClick={() => {
            onConfirm();
            setShowConfirm(false);
          }}
          disabled={disabled}
        >
          {confirmText}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <span onClick={() => !disabled && setShowConfirm(true)}>
      {children}
    </span>
  );
}
