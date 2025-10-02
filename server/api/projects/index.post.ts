import { readFormData } from "h3";
import { createProject, saveVideoFile } from "~/server/db/projects";

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event);
  const title = formData.get("title");

  if (typeof title !== "string" || !title.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Title is required" });
  }

  const file = formData.get("file");
  let videoPath: string | null = null;
  if (file && typeof (file as any).arrayBuffer === "function") {
    const typedFile = file as File;
    const originalName = typeof typedFile.name === "string" ? typedFile.name : null;
    videoPath = await saveVideoFile(typedFile, originalName);
  }

  return createProject({
    title: title.trim(),
    videoPath,
  });
});
