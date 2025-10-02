import { randomUUID } from "node:crypto";
import { join } from "pathe";
import { promises as fs } from "node:fs";
import db from "./client";
import type { NullableJson, Project } from "~/types/project";

interface ProjectRow {
  id: string;
  title: string;
  created_at: string;
  video_path: string | null;
  words: string | null;
  config: string | null;
}

const listStatement = db.prepare(
  "SELECT id, title, created_at, video_path, words, config FROM projects ORDER BY datetime(created_at) DESC"
);

const getStatement = db.prepare(
  "SELECT id, title, created_at, video_path, words, config FROM projects WHERE id = ?"
);

const insertStatement = db.prepare(
  "INSERT INTO projects (id, title, created_at, video_path, words, config) VALUES (@id, @title, @created_at, @video_path, @words, @config)"
);

const updateStatement = db.prepare(
  "UPDATE projects SET words = @words, config = @config WHERE id = @id"
);

function deserialize(row: ProjectRow | undefined): Project | null {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    videoPath: row.video_path,
    words: row.words ? JSON.parse(row.words) : undefined,
    config: row.config ? JSON.parse(row.config) : undefined,
  };
}

export function listProjects(): Project[] {
  const rows = listStatement.all() as ProjectRow[];
  return rows.map((row) => deserialize(row)).filter(Boolean) as Project[];
}

export function getProject(id: string): Project | null {
  const row = getStatement.get(id) as ProjectRow | undefined;
  return deserialize(row);
}

interface CreateProjectInput {
  title: string;
  videoPath: string | null;
  words?: NullableJson;
  config?: NullableJson;
}

export function createProject({ title, videoPath, words, config }: CreateProjectInput): Project {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  insertStatement.run({
    id,
    title,
    created_at: createdAt,
    video_path: videoPath,
    words: words !== undefined ? JSON.stringify(words) : null,
    config: config !== undefined ? JSON.stringify(config) : null,
  });
  return {
    id,
    title,
    createdAt,
    videoPath,
    words,
    config,
  };
}

interface UpdateProjectInput {
  id: string;
  words?: NullableJson;
  config?: NullableJson;
}

export function updateProject({ id, words, config }: UpdateProjectInput): Project | null {
  const payload = {
    id,
    words: words !== undefined ? JSON.stringify(words) : null,
    config: config !== undefined ? JSON.stringify(config) : null,
  };
  updateStatement.run(payload);
  return getProject(id);
}

export async function saveVideoFile(file: File | Blob | null, originalName?: string | null): Promise<string | null> {
  if (!file || typeof (file as any).arrayBuffer !== "function") return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = originalName?.split(".").pop();
  const safeExtension = extension ? `.${extension}` : "";
  const filename = `${randomUUID()}${safeExtension}`;
  const uploadDir = join(process.cwd(), "data", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(join(uploadDir, filename), buffer);
  return filename;
}

export async function readVideoFile(path: string): Promise<Buffer> {
  const uploadDir = join(process.cwd(), "data", "uploads");
  return fs.readFile(join(uploadDir, path));
}
