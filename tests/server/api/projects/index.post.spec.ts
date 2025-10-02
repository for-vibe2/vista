import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

const readFormDataMock = vi.fn();
const readMultipartFormDataMock = vi.fn();
const readBodyMock = vi.fn();
const createProjectMock = vi.fn();
const saveVideoFileMock = vi.fn();
let createErrorMock: ReturnType<typeof vi.fn>;

let readFormDataImpl: ((...args: any[]) => any) | undefined;
let readMultipartFormDataImpl: ((...args: any[]) => any) | undefined;
let readBodyImpl: ((...args: any[]) => any) | undefined;

declare global {
  // eslint-disable-next-line no-var
  var defineEventHandler: <T>(handler: T) => T;
  // eslint-disable-next-line no-var
  var createError: (input: any) => any;
}

vi.mock("h3", () => {
  const module: Record<string, any> = { __esModule: true };

  Object.defineProperty(module, "readFormData", {
    enumerable: true,
    get: () => readFormDataImpl,
    set: (value) => {
      readFormDataImpl = value;
    },
  });

  Object.defineProperty(module, "readMultipartFormData", {
    enumerable: true,
    get: () => readMultipartFormDataImpl,
    set: (value) => {
      readMultipartFormDataImpl = value;
    },
  });

  Object.defineProperty(module, "readBody", {
    enumerable: true,
    get: () => readBodyImpl,
    set: (value) => {
      readBodyImpl = value;
    },
  });

  return module;
});

vi.mock("~/server/db/projects", () => ({
  createProject: (...args: any[]) => createProjectMock(...args),
  saveVideoFile: (...args: any[]) => saveVideoFileMock(...args),
}));

async function importHandler() {
  const module = await import("~/server/api/projects/index.post");
  return module.default;
}

beforeEach(() => {
  vi.resetModules();
  readFormDataMock.mockReset();
  readMultipartFormDataMock.mockReset();
  readBodyMock.mockReset();
  createProjectMock.mockReset();
  saveVideoFileMock.mockReset();
  createErrorMock = vi.fn((input) => input);
  vi.stubGlobal("defineEventHandler", <T>(handler: T) => handler);
  vi.stubGlobal("createError", createErrorMock);

  readFormDataImpl = (...args: any[]) => readFormDataMock(...args);
  readMultipartFormDataImpl = (...args: any[]) => readMultipartFormDataMock(...args);
  readBodyImpl = (...args: any[]) => readBodyMock(...args);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/projects", () => {
  it("rejects requests without a valid title", async () => {
    readFormDataMock.mockResolvedValue({
      get: (key: string) => (key === "title" ? "" : null),
    });

    const handler = await importHandler();

    await expect(handler({} as any)).rejects.toEqual({
      statusCode: 400,
      statusMessage: "Title is required",
    });

    expect(createErrorMock).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: "Title is required",
    });
    expect(createProjectMock).not.toHaveBeenCalled();
    expect(saveVideoFileMock).not.toHaveBeenCalled();
  });

  it("creates a project when the title is provided", async () => {
    readFormDataMock.mockResolvedValue({
      get: (key: string) => {
        if (key === "title") {
          return "  My Project  ";
        }
        return null;
      },
    });

    createProjectMock.mockResolvedValue({ id: 123 });

    const handler = await importHandler();
    const result = await handler({} as any);

    expect(saveVideoFileMock).not.toHaveBeenCalled();
    expect(createProjectMock).toHaveBeenCalledWith({
      title: "My Project",
      videoPath: null,
    });
    expect(result).toEqual({ id: 123 });
  });

  it("saves the uploaded video when provided", async () => {
    const file = {
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    };

    readFormDataMock.mockResolvedValue({
      get: (key: string) => {
        if (key === "title") {
          return "Project with video";
        }
        if (key === "file") {
          return file;
        }
        return null;
      },
    });

    createProjectMock.mockResolvedValue({ id: 456 });
    saveVideoFileMock.mockResolvedValue("video-path.mp4");

    const handler = await importHandler();
    const result = await handler({} as any);

    expect(saveVideoFileMock).toHaveBeenCalledWith(file, null);
    expect(createProjectMock).toHaveBeenCalledWith({
      title: "Project with video",
      videoPath: "video-path.mp4",
    });
    expect(result).toEqual({ id: 456 });
  });

  it("falls back to multipart parsing when readFormData is unavailable", async () => {
    readFormDataImpl = undefined;

    readMultipartFormDataMock.mockResolvedValue([
      { name: "title", data: Buffer.from("Multipart Title") },
      {
        name: "file",
        data: Buffer.from("content"),
        filename: "video.mp4",
        type: "video/mp4",
      },
    ]);

    createProjectMock.mockResolvedValue({ id: 789 });
    saveVideoFileMock.mockResolvedValue("stored.mp4");

    const handler = await importHandler();
    const result = await handler({} as any);

    expect(readMultipartFormDataMock).toHaveBeenCalled();
    const [fileArg, nameArg] = saveVideoFileMock.mock.calls[0];
    expect(typeof (fileArg as Blob).arrayBuffer).toBe("function");
    expect(nameArg).toBe("video.mp4");
    expect(createProjectMock).toHaveBeenCalledWith({
      title: "Multipart Title",
      videoPath: "stored.mp4",
    });
    expect(result).toEqual({ id: 789 });
  });

  it("falls back to parsing the request body when multipart data is unavailable", async () => {
    readFormDataImpl = undefined;
    readMultipartFormDataMock.mockResolvedValue(null);
    readBodyMock.mockResolvedValue({ title: "Body Title" });

    createProjectMock.mockResolvedValue({ id: 321 });

    const handler = await importHandler();
    const result = await handler({} as any);

    expect(readBodyMock).toHaveBeenCalled();
    expect(saveVideoFileMock).not.toHaveBeenCalled();
    expect(createProjectMock).toHaveBeenCalledWith({
      title: "Body Title",
      videoPath: null,
    });
    expect(result).toEqual({ id: 321 });
  });

  it("parses JSON string bodies when readBody returns text", async () => {
    readFormDataImpl = undefined;
    readMultipartFormDataMock.mockResolvedValue(undefined);
    readBodyMock.mockResolvedValue('{"title":"From JSON"}');

    createProjectMock.mockResolvedValue({ id: 654 });

    const handler = await importHandler();
    const result = await handler({} as any);

    expect(createProjectMock).toHaveBeenCalledWith({
      title: "From JSON",
      videoPath: null,
    });
    expect(result).toEqual({ id: 654 });
  });

  it("parses urlencoded bodies when readBody returns text", async () => {
    readFormDataImpl = undefined;
    readMultipartFormDataMock.mockResolvedValue(undefined);
    readBodyMock.mockResolvedValue("title=Encoded+Title");

    createProjectMock.mockResolvedValue({ id: 987 });

    const handler = await importHandler();
    const result = await handler({} as any);

    expect(createProjectMock).toHaveBeenCalledWith({
      title: "Encoded Title",
      videoPath: null,
    });
    expect(result).toEqual({ id: 987 });
  });
});
