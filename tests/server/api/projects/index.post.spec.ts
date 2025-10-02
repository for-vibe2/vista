import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

const readFormDataMock = vi.fn();
const createProjectMock = vi.fn();
const saveVideoFileMock = vi.fn();
let createErrorMock: ReturnType<typeof vi.fn>;

declare global {
  // eslint-disable-next-line no-var
  var defineEventHandler: <T>(handler: T) => T;
  // eslint-disable-next-line no-var
  var createError: (input: any) => any;
}

vi.mock("h3", () => ({
  readFormData: (...args: any[]) => readFormDataMock(...args),
}));

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
  createProjectMock.mockReset();
  saveVideoFileMock.mockReset();
  createErrorMock = vi.fn((input) => input);
  vi.stubGlobal("defineEventHandler", <T>(handler: T) => handler);
  vi.stubGlobal("createError", createErrorMock);
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
});
