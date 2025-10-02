import type { H3Event } from "h3";
import * as h3 from "h3";
import { createProject, saveVideoFile } from "~/server/db/projects";

interface FormDataLike {
  get(name: string): FormDataEntryValue | null;
}

interface MultipartFormData {
  name: string;
  data: Buffer;
  filename?: string;
  type?: string;
}

async function getFormData(event: H3Event): Promise<FormDataLike> {
  if (typeof (h3 as any).readFormData === "function") {
    return (h3 as any).readFormData(event);
  }

  if (typeof (h3 as any).readMultipartFormData === "function") {
    const multipart = await (h3 as any).readMultipartFormData(event);
    if (multipart) {
      return createFormDataLikeFromMultipart(multipart as MultipartFormData[]);
    }
  }

  const body = await (h3 as any).readBody?.(event);
  if (body && typeof (body as FormDataLike).get === "function") {
    return body as FormDataLike;
  }

  const entries = new Map<string, any>();
  if (body && typeof body === "object") {
    for (const [key, value] of Object.entries(body)) {
      entries.set(key, value);
    }
  }

  return {
    get(name: string) {
      return entries.has(name) ? entries.get(name) : null;
    },
  };
}

function createFormDataLikeFromMultipart(parts: MultipartFormData[]): FormDataLike {
  const entries = new Map<string, FormDataEntryValue>();

  for (const part of parts) {
    if (!part.name) {
      continue;
    }

    if (part.filename || part.type === "file") {
      const file = createFileLike(part);
      entries.set(part.name, file);
    } else {
      entries.set(part.name, part.data.toString("utf8"));
    }
  }

  return {
    get(name: string) {
      return entries.has(name) ? entries.get(name) : null;
    },
  };
}

function createFileLike(part: MultipartFormData): File | Blob {
  const blob = new Blob([part.data], {
    type: part.type || "application/octet-stream",
  });

  if (typeof File === "function") {
    return new File([part.data], part.filename || "file", {
      type: part.type,
    });
  }

  Object.defineProperty(blob, "name", {
    value: part.filename || "file",
    writable: false,
  });

  return blob;
}

export default defineEventHandler(async (event) => {
  const formData = await getFormData(event);
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
