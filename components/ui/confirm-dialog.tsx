"use client";

import React from "react";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">{message}</p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="h-9 px-4 rounded-lg border border-border/60 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="h-9 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
