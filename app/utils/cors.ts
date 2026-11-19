const ALLOWED_ORIGIN = "https://dsp2b.github.io";
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/;

// 返回允许的 Origin（原样回显），不允许则返回 null
export const allowedOrigin = (origin: string | null | undefined) => {
  if (!origin) return null;
  if (origin === ALLOWED_ORIGIN || LOCAL_ORIGIN.test(origin)) return origin;
  return null;
};

// MongoDB ObjectId: 24 位十六进制
export const isValidBlueprintId = (id: string | null | undefined) =>
  !!id && /^[0-9a-fA-F]{24}$/.test(id);
