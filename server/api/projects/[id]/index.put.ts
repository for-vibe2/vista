import { updateProject } from "~/server/db/projects";

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing project id" });
  }

  const body = await readBody<{ words?: unknown; config?: unknown }>(event);
  const project = updateProject({ id, words: body?.words, config: body?.config });
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" });
  }

  return project;
});
