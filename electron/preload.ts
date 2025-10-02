import { contextBridge, ipcRenderer } from "electron";

type CreateProjectPayload = {
  id?: string;
  title: string;
  videoPath?: string | null;
  transcriptionId?: string | null;
  words?: string | null;
  config?: string | null;
};

const api = {
  pingSQLite: () => ipcRenderer.invoke("sqlite:ping"),
  listProjects: () => ipcRenderer.invoke("sqlite:projects:list"),
  createProject: (payload: CreateProjectPayload) => ipcRenderer.invoke("sqlite:projects:create", payload),
};

contextBridge.exposeInMainWorld("electronAPI", api);
