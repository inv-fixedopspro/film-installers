"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Image as ImageIcon, Loader as Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  label: string;
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  aspectRatio?: "square" | "wide";
  maxSizeMb?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
  hint?: string;
}

const DEFAULT_ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const DEFAULT_MAX_MB = 5;

export function ImageUpload({
  label,
  currentImageUrl,
  onUpload,
  onRemove,
  aspectRatio = "wide",
  maxSizeMb = DEFAULT_MAX_MB,
  acceptedTypes = DEFAULT_ACCEPTED,
  disabled = false,
  className,
  hint,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? currentImageUrl ?? null;

  const handleFile = useCallback(
    async (file: File) => {
      if (!acceptedTypes.includes(file.type)) {
        setError(`File type not supported. Use ${acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}.`);
        return;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`File too large. Maximum size is ${maxSizeMb}MB.`);
        return;
      }

      setError(null);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsUploading(true);
      setProgress(10);

      const progressTimer = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 85));
      }, 200);

      try {
        await onUpload(file);
        setProgress(100);
        setTimeout(() => {
          setProgress(0);
          setIsUploading(false);
        }, 600);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreviewUrl(null);
        setIsUploading(false);
        setProgress(0);
        URL.revokeObjectURL(objectUrl);
      } finally {
        clearInterval(progressTimer);
      }
    },
    [onUpload, acceptedTypes, maxSizeMb]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRemove || isRemoving) return;
    setIsRemoving(true);
    setError(null);
    try {
      await onRemove();
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove image");
    } finally {
      setIsRemoving(false);
    }
  };

  const triggerInput = () => {
    if (!disabled && !isUploading) inputRef.current?.click();
  };

  const hasImage = !!displayUrl;

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Upload ${label}`}
        onClick={triggerInput}
        onKeyDown={(e) => e.key === "Enter" || e.key === " " ? triggerInput() : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer select-none",
          aspectRatio === "square" ? "aspect-square" : "aspect-[3/1]",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : hasImage
            ? "border-border hover:border-primary/50"
            : "border-muted-foreground/25 hover:border-primary/50 bg-muted/30",
          (disabled || isUploading) && "cursor-not-allowed opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        {hasImage ? (
          <>
            <Image
              src={displayUrl!}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Upload className="w-4 h-4" />
                <span>Replace</span>
              </div>
            </div>

            {onRemove && !isRemoving && !isUploading && (
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Remove image"
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {isRemoving && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            {isUploading ? (
              <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
            ) : (
              <ImageIcon className="w-7 h-7 text-muted-foreground/50" />
            )}
            {!isUploading && (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  {isDragging ? "Drop to upload" : "Click or drag to upload"}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {acceptedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")} · max {maxSizeMb}MB
                </p>
              </>
            )}
          </div>
        )}

        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
