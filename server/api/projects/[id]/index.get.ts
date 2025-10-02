import { getProject } from "~/server/db/projects";

export default defineEventHandler((event) => {
  const id = event.context.params?.id;
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing project id" });
  }

  const project = getProject(id);
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" });
  }

  return project;
});
