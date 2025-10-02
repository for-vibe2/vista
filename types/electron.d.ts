export type ElectronProjectRecord = {
  id: string;
  title: string;
  video_path: string | null;
  transcription_id: string | null;
  created_at: string;
  words: string | null;
  config: string | null;
};

export type ElectronCreateProjectPayload = {
  id?: string;
  title: string;
  videoPath?: string | null;
  transcriptionId?: string | null;
  words?: string | null;
  config?: string | null;
};

declare global {
  interface Window {
    electronAPI?: {
      pingSQLite: () => Promise<{ ready: boolean; path: string | null }>;
      listProjects: () => Promise<ElectronProjectRecord[]>;
      createProject: (
        payload: ElectronCreateProjectPayload
      ) => Promise<Pick<ElectronProjectRecord, "id" | "created_at">>;
    };
  }
}

export {};
