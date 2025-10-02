type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type NullableJson = JsonValue | undefined;

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  videoPath: string | null;
  words: NullableJson;
  config: NullableJson;
}
