import { listProjects } from "~/server/db/projects";

export default defineEventHandler(() => {
  return listProjects();
});
