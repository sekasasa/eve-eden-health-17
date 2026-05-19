/**
 * Build a Supabase Storage transform URL with width/quality params.
 * Pass any existing image URL — non-Supabase URLs are returned unchanged.
 */
export function compressed(url: string | null | undefined, width = 400, quality = 75): string {
  if (!url) return "";
  if (!url.includes("/storage/v1/")) return url;
  const rendered = url.replace("/storage/v1/object/", "/storage/v1/render/image/");
  const sep = rendered.includes("?") ? "&" : "?";
  return `${rendered}${sep}width=${width}&quality=${quality}&resize=contain`;
}
