/**
 * Explicit public-safe column lists.
 *
 * Every community query MUST use one of these constants. `author_id` is not
 * listed anywhere, so no future query can accidentally request it.
 */

export const PUBLIC_POST_COLUMNS = [
  "id",
  "anonymous_alias",
  "title",
  "body",
  "category",
  "life_stage",
  "city",
  "country_code",
  "language_code",
  "visibility",
  "status",
  "is_anonymous",
  "is_seeded",
  "created_at",
  "updated_at",
] as const;

export const PUBLIC_REPLY_COLUMNS = [
  "id",
  "post_id",
  "provider_id",
  "body",
  "reply_type",
  "status",
  "is_seeded",
  "created_at",
  "updated_at",
] as const;

export const PUBLIC_POST_SELECT = PUBLIC_POST_COLUMNS.join(",");
export const PUBLIC_REPLY_SELECT = PUBLIC_REPLY_COLUMNS.join(",");

/** Minimal shape returned after a create — never includes author_id. */
export const CREATED_POST_SELECT = "id,status";
export const CREATED_REPLY_SELECT = "id,status";
