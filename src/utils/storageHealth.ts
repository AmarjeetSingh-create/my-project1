export const LOCAL_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MiB standard browser localStorage quota
export const STORAGE_WARN_PERCENT = 75;
export const STORAGE_CRITICAL_PERCENT = 90;
export const STORAGE_UPDATE_EVENT = "kisan:storage-updated";

export interface LocalStorageUsage {
  usedBytes: number;
  limitBytes: number;
  percentUsed: number;
  isNearCapacity: boolean;
  isCritical: boolean;
  storageUnavailable: boolean;
}

function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return value.length * 2;
}

export function measureLocalStorageUsage(): LocalStorageUsage {
  try {
    let usedBytes = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key !== null) {
        const val = window.localStorage.getItem(key) ?? "";
        usedBytes += byteLength(key) + byteLength(val);
      }
    }
    const percentUsed = Math.min(
      100,
      Math.round((usedBytes / LOCAL_STORAGE_LIMIT_BYTES) * 100)
    );
    return {
      usedBytes,
      limitBytes: LOCAL_STORAGE_LIMIT_BYTES,
      percentUsed,
      isNearCapacity: percentUsed >= STORAGE_WARN_PERCENT,
      isCritical: percentUsed >= STORAGE_CRITICAL_PERCENT,
      storageUnavailable: false,
    };
  } catch {
    return {
      usedBytes: 0,
      limitBytes: LOCAL_STORAGE_LIMIT_BYTES,
      percentUsed: 0,
      isNearCapacity: false,
      isCritical: false,
      storageUnavailable: true,
    };
  }
}

export function notifyStorageChanged(quotaExceeded = false): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ quotaExceeded: boolean }>(STORAGE_UPDATE_EVENT, {
      detail: { quotaExceeded },
    })
  );
}

export function formatBytesCompact(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
