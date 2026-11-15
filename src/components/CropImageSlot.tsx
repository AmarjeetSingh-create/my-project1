import { Sprout } from "lucide-react";
import { useState } from "react";

interface CropImageSlotProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function CropImageSlot({
  src,
  alt,
  className = "",
  fallbackTitle,
}: CropImageSlotProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EEF2EC] text-[#355E3B] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sprout className="w-7 h-7 mb-1.5 opacity-80" strokeWidth={1.75} />
        {fallbackTitle && (
          <span className="text-xs font-medium text-center text-[#3D4B41] line-clamp-2">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
