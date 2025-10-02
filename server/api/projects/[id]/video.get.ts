import { extname } from "pathe";
import { getProject, readVideoFile } from "~/server/db/projects";

const mimeTypes: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
};

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing project id" });
  }

  const project = getProject(id);
  if (!project || !project.videoPath) {
    throw createError({ statusCode: 404, statusMessage: "Video not found" });
  }

  const buffer = await readVideoFile(project.videoPath);
  const extension = extname(project.videoPath).toLowerCase();
  const mime = mimeTypes[extension] ?? "application/octet-stream";
  event.node.res.setHeader("Content-Type", mime);
  return buffer;
});
