// Leave enough room for multipart headers below the hosted request limit.
const configured = Number(process.env.NEXT_PUBLIC_REPORT_MAX_MB || "10");
export const REPORT_MAX_MB = Number.isFinite(configured) && configured >= 1 && configured <= 10 ? configured : 10;
export const REPORT_MAX_BYTES = REPORT_MAX_MB * 1024 * 1024;
