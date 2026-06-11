// Firestore-backed data layer — replaces sql.js localStorage for multi-device access.
// All data is scoped under users/{uid}/manuscripts, users/{uid}/series, etc.

import {
  fsGet,
  fsGetAll,
  fsCreate,
  fsSet,
  fsUpdate,
  fsDelete,
  fsCreateSub,
  fsUpdateSub,
  fsDeleteSub,
  fsGetSub,
  tsToISO,
  where,
  orderBy,
  serverTimestamp,
} from "./firebase";
import type { Timestamp } from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FirestoreManuscript = {
  id: string;
  seriesId: string | null;
  seriesOrder: number;
  title: string;
  subtitle: string | null;
  author: string | null;
  description: string | null;
  genre: string | null;
  coverPath: string | null;
  trimSize: string;
  theme: string;
  exportFont: "serif" | "sans";
  targetWords: number;
  status: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FirestoreSeries = {
  id: string;
  title: string;
  description: string | null;
  coverPath: string | null;
  createdAt: string;
};

export type FirestoreSection = {
  id: string;
  manuscriptId: string;
  parentId: string | null;
  type: string;
  title: string;
  position: number;
  content: string;
  wordCount: number;
  isIncluded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FirestoreVersion = {
  id: string;
  sectionId: string;
  content: string;
  wordCount: number;
  savedAt: string;
};

export type FirestoreNote = {
  id: string;
  manuscriptId: string;
  category: string;
  title: string;
  content: string;
  color: string;
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
};

export type FirestoreConversation = {
  id: string;
  manuscriptId: string | null;
  title: string;
  createdAt: string;
};

export type FirestoreMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  modelUsed: string | null;
  createdAt: string;
};

export type FirestoreFont = {
  id: string;
  familyName: string;
  fileName: string;
  dataBase64: string;
  format: string;
  weight: string;
  style: string;
  createdAt: string;
};

export type FirestoreSettings = Record<string, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapTimestamp(data: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toDate" in value) {
      mapped[key] = tsToISO(value as Timestamp);
    } else {
      mapped[key] = value;
    }
  }
  return mapped;
}

// ─── API Surface ──────────────────────────────────────────────────────────────

export function createFirestoreApi(uid: string) {
  // ── Manuscripts ────────────────────────────────────────────────────────

  async function manuscriptsGetAll(): Promise<FirestoreManuscript[]> {
    const docs = await fsGetAll<Record<string, unknown>>(
      uid,
      "manuscripts",
      orderBy("updatedAt", "desc")
    );
    return docs.map((d) => ({
      ...mapTimestamp(d),
      id: d.id,
      wordCount: d.wordCount ?? 0,
    })) as unknown as FirestoreManuscript[];
  }

  async function manuscriptsGetById(id: string): Promise<FirestoreManuscript | null> {
    const doc = await fsGet<Record<string, unknown>>(uid, "manuscripts", id);
    return doc
      ? ({ ...mapTimestamp(doc), wordCount: doc.wordCount ?? 0 } as unknown as FirestoreManuscript)
      : null;
  }

  async function manuscriptsCreate(
    data: Partial<FirestoreManuscript>
  ): Promise<FirestoreManuscript> {
    const now = new Date().toISOString();
    const doc = await fsCreate<Record<string, unknown>>(uid, "manuscripts", {
      seriesId: data.seriesId ?? null,
      seriesOrder: data.seriesOrder ?? 1,
      title: data.title ?? "Untitled Novel",
      subtitle: data.subtitle ?? null,
      author: data.author ?? null,
      description: data.description ?? null,
      genre: data.genre ?? null,
      coverPath: data.coverPath ?? null,
      trimSize: data.trimSize ?? "6x9",
      theme: data.theme ?? "classic",
      exportFont: data.exportFont ?? "serif",
      targetWords: data.targetWords ?? 80000,
      status: data.status ?? "drafting",
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { ...doc, id: doc.id } as unknown as FirestoreManuscript;
  }

  async function manuscriptsUpdate(
    id: string,
    data: Partial<FirestoreManuscript>
  ): Promise<void> {
    await fsUpdate(uid, "manuscripts", id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async function manuscriptsDelete(id: string): Promise<void> {
    await fsDelete(uid, "manuscripts", id);
    // Also delete subcollections — sections, notes, versions
    const sections = await fsGetSub<{ id: string }>(uid, `manuscripts/${id}`, "sections");
    for (const s of sections) {
      await fsDeleteSub(uid, `manuscripts/${id}`, "sections", s.id);
    }
    const notes = await fsGetSub<{ id: string }>(uid, `manuscripts/${id}`, "notes");
    for (const n of notes) {
      await fsDeleteSub(uid, `manuscripts/${id}`, "notes", n.id);
    }
  }

  // ── Series ─────────────────────────────────────────────────────────────

  async function seriesGetAll(): Promise<FirestoreSeries[]> {
    const docs = await fsGetAll<Record<string, unknown>>(
      uid,
      "series",
      orderBy("title", "asc")
    );
    return docs.map((d) => ({
      ...mapTimestamp(d),
      id: d.id,
    })) as unknown as FirestoreSeries[];
  }

  async function seriesCreate(data: Partial<FirestoreSeries>): Promise<FirestoreSeries> {
    const now = new Date().toISOString();
    const doc = await fsCreate<Record<string, unknown>>(uid, "series", {
      title: data.title ?? "Untitled Series",
      description: data.description ?? null,
      coverPath: data.coverPath ?? null,
      createdAt: now,
    });
    return { ...doc, id: doc.id } as unknown as FirestoreSeries;
  }

  async function seriesUpdate(id: string, data: Partial<FirestoreSeries>): Promise<void> {
    await fsUpdate(uid, "series", id, data);
  }

  async function seriesDelete(id: string): Promise<void> {
    await fsDelete(uid, "series", id);
  }

  // ── Sections (subcollection under manuscripts/{id}/sections) ───────────

  async function sectionsGetByManuscript(
    manuscriptId: string
  ): Promise<FirestoreSection[]> {
    const docs = await fsGetSub<Record<string, unknown>>(
      uid,
      `manuscripts/${manuscriptId}`,
      "sections",
      orderBy("position", "asc")
    );
    return docs.map((d) => ({
      ...mapTimestamp(d),
      id: d.id,
      manuscriptId,
    })) as unknown as FirestoreSection[];
  }

  async function sectionsGetById(
    manuscriptId: string,
    id: string
  ): Promise<FirestoreSection | null> {
    const section = await fsGet<Record<string, unknown>>(
      uid,
      `manuscripts/${manuscriptId}/sections`,
      id
    );
    return section
      ? ({
          ...mapTimestamp(section),
          manuscriptId,
        } as unknown as FirestoreSection)
      : null;
  }

  async function sectionsCreate(
    data: Partial<FirestoreSection>
  ): Promise<FirestoreSection> {
    const manuscriptId = data.manuscriptId!;
    // Get max position
    const existing = await fsGetSub<{ position: number }>(
      uid,
      `manuscripts/${manuscriptId}`,
      "sections",
      orderBy("position", "desc")
    );
    const maxPos = existing.length > 0 ? existing[0].position : -1;
    const now = new Date().toISOString();
    const doc = await fsCreateSub<Record<string, unknown>>(
      uid,
      `manuscripts/${manuscriptId}`,
      "sections",
      {
        parentId: data.parentId ?? null,
        type: data.type ?? "chapter",
        title: data.title ?? "Untitled",
        position: maxPos + 1,
        content: data.content ?? "{}",
        wordCount: 0,
        isIncluded: data.isIncluded ?? true,
        createdAt: now,
        updatedAt: now,
      }
    );
    return { ...doc, id: doc.id, manuscriptId } as unknown as FirestoreSection;
  }

  async function sectionsUpdate(
    manuscriptId: string,
    id: string,
    data: Partial<FirestoreSection>
  ): Promise<void> {
    await fsUpdateSub(uid, `manuscripts/${manuscriptId}`, "sections", id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async function sectionsDelete(manuscriptId: string, id: string): Promise<void> {
    await fsDeleteSub(uid, `manuscripts/${manuscriptId}`, "sections", id);
  }

  async function sectionsReorder(
    manuscriptId: string,
    sectionId: string,
    newPos: number,
    newParentId: string | null
  ): Promise<void> {
    // Shift others, then place this one
    const all = await fsGetSub<{ id: string; position: number }>(
      uid,
      `manuscripts/${manuscriptId}`,
      "sections",
      orderBy("position", "asc")
    );
    for (const s of all) {
      if (s.id === sectionId) continue;
      if (s.position >= newPos) {
        await fsUpdateSub(uid, `manuscripts/${manuscriptId}`, "sections", s.id, {
          position: s.position + 1,
        });
      }
    }
    await fsUpdateSub(uid, `manuscripts/${manuscriptId}`, "sections", sectionId, {
      position: newPos,
      parentId: newParentId ?? null,
      updatedAt: new Date().toISOString(),
    });
  }

  async function sectionsSaveContent(
    manuscriptId: string,
    sectionId: string,
    content: string,
    wordCount: number
  ): Promise<void> {
    const now = new Date().toISOString();
    await fsUpdateSub(uid, `manuscripts/${manuscriptId}`, "sections", sectionId, {
      content,
      wordCount,
      updatedAt: now,
    });
    // Save version snapshot
    await fsCreateSub(uid, `manuscripts/${manuscriptId}/sections/${sectionId}`, "versions", {
      content,
      wordCount,
      savedAt: now,
    });
  }

  // ── Versions ───────────────────────────────────────────────────────────

  async function versionsGetRecent(
    manuscriptId: string,
    sectionId: string,
    limit: number
  ): Promise<FirestoreVersion[]> {
    const docs = await fsGetSub<Record<string, unknown>>(
      uid,
      `manuscripts/${manuscriptId}/sections/${sectionId}`,
      "versions",
      orderBy("savedAt", "desc")
    );
    const sliced = docs.slice(0, limit);
    return sliced.map((d) => ({
      ...mapTimestamp(d),
      sectionId,
    })) as unknown as FirestoreVersion[];
  }

  async function versionsGetContent(
    manuscriptId: string,
    sectionId: string,
    versionId: string
  ): Promise<string> {
    const v = await fsGet<Record<string, unknown>>(
      uid,
      `manuscripts/${manuscriptId}/sections/${sectionId}/versions`,
      versionId
    );
    return (v?.content as string) ?? "";
  }

  // ── Planning Notes (subcollection) ─────────────────────────────────────

  async function notesGetByManuscript(
    manuscriptId: string
  ): Promise<FirestoreNote[]> {
    const docs = await fsGetSub<Record<string, unknown>>(
      uid,
      `manuscripts/${manuscriptId}`,
      "notes",
      orderBy("category", "asc"),
      orderBy("createdAt", "asc")
    );
    return docs.map((d) => ({
      ...mapTimestamp(d),
      id: d.id,
      manuscriptId,
    })) as unknown as FirestoreNote[];
  }

  async function notesCreate(
    manuscriptId: string,
    data: Partial<FirestoreNote>
  ): Promise<FirestoreNote> {
    const now = new Date().toISOString();
    const doc = await fsCreateSub<Record<string, unknown>>(
      uid,
      `manuscripts/${manuscriptId}`,
      "notes",
      {
        category: data.category ?? "misc",
        title: data.title ?? "New Note",
        content: data.content ?? "",
        color: data.color ?? "#fef3c7",
        positionX: data.positionX ?? 0,
        positionY: data.positionY ?? 0,
        createdAt: now,
        updatedAt: now,
      }
    );
    return { ...doc, id: doc.id, manuscriptId } as unknown as FirestoreNote;
  }

  async function notesUpdate(
    manuscriptId: string,
    id: string,
    data: Partial<FirestoreNote>
  ): Promise<void> {
    await fsUpdateSub(uid, `manuscripts/${manuscriptId}`, "notes", id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async function notesDelete(manuscriptId: string, id: string): Promise<void> {
    await fsDeleteSub(uid, `manuscripts/${manuscriptId}`, "notes", id);
  }

  // ── Fonts ──────────────────────────────────────────────────────────────

  async function fontsGetAll(): Promise<FirestoreFont[]> {
    const docs = await fsGetAll<Record<string, unknown>>(
      uid,
      "fonts",
      orderBy("familyName", "asc")
    );
    return docs.map((d) => ({
      ...mapTimestamp(d),
      id: d.id,
    })) as unknown as FirestoreFont[];
  }

  async function fontsImport(file: File): Promise<FirestoreFont> {
    const familyName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]/g, " ")
      .trim();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "ttf";
    const format =
      ext === "otf" ? "opentype" : ext === "woff2" ? "woff2" : "truetype";
    const base64 = await fileToBase64(file);
    const now = new Date().toISOString();
    const doc = await fsCreate<Record<string, unknown>>(uid, "fonts", {
      familyName,
      fileName: file.name,
      dataBase64: base64,
      format,
      weight: "400",
      style: "normal",
      createdAt: now,
    });
    return { ...doc, id: doc.id } as unknown as FirestoreFont;
  }

  async function fontsDelete(id: string): Promise<void> {
    await fsDelete(uid, "fonts", id);
  }

  // ── Covers ─────────────────────────────────────────────────────────────

  async function coversGetDataUrl(coverKey: string): Promise<string> {
    // coverKey is already the full storage key (e.g. "cover:1730:file.jpg")
    const existing = localStorage.getItem(coverKey);
    if (existing) return existing;
    try {
      const existing2 = localStorage.getItem(`cover:${coverKey}`);
      if (existing2) return existing2;
    } catch { /* ignore */ }
    return coverKey.startsWith("data:") ? coverKey : "";
  }

  async function coversImport(file: File): Promise<string> {
    const base64 = await fileToBase64(file);
    const dataUrl = `data:${file.type};base64,${base64}`;
    const key = `cover:${Date.now()}:${file.name}`;
    localStorage.setItem(key, dataUrl);
    return key;
  }

  // ── AI Chat ────────────────────────────────────────────────────────────

  async function aiGetConversations(
    manuscriptId?: string
  ): Promise<FirestoreConversation[]> {
    const constraints = manuscriptId
      ? [where("manuscriptId", "==", manuscriptId), orderBy("createdAt", "desc")]
      : [orderBy("createdAt", "desc")];
    const docs = await fsGetAll<Record<string, unknown>>(
      uid,
      "conversations",
      ...constraints
    );
    return docs.map((d) => ({
      ...mapTimestamp(d),
      id: d.id,
    })) as unknown as FirestoreConversation[];
  }

  async function aiCreateConversation(
    manuscriptId?: string,
    title?: string
  ): Promise<FirestoreConversation> {
    const now = new Date().toISOString();
    const doc = await fsCreate<Record<string, unknown>>(uid, "conversations", {
      manuscriptId: manuscriptId ?? null,
      title: title ?? "New Conversation",
      createdAt: now,
    });
    return { ...doc, id: doc.id } as unknown as FirestoreConversation;
  }

  async function aiGetMessages(
    conversationId: string
  ): Promise<FirestoreMessage[]> {
    const docs = await fsGetSub<Record<string, unknown>>(
      uid,
      `conversations/${conversationId}`,
      "messages",
      orderBy("createdAt", "asc")
    );
    return docs.map((d) => ({
      ...mapTimestamp(d),
      id: d.id,
      conversationId,
    })) as unknown as FirestoreMessage[];
  }

  async function aiSaveMessage(
    conversationId: string,
    role: string,
    content: string,
    modelUsed?: string
  ): Promise<FirestoreMessage> {
    const now = new Date().toISOString();
    const doc = await fsCreateSub<Record<string, unknown>>(
      uid,
      `conversations/${conversationId}`,
      "messages",
      {
        role,
        content,
        modelUsed: modelUsed ?? null,
        createdAt: now,
      }
    );
    return { ...doc, id: doc.id, conversationId } as unknown as FirestoreMessage;
  }

  async function aiDeleteConversation(id: string): Promise<void> {
    await fsDelete(uid, "conversations", id);
  }

  // ── Settings ───────────────────────────────────────────────────────────

  async function settingsGetAll(): Promise<FirestoreSettings> {
    const doc = await fsGet<Record<string, string>>(uid, "settings", "preferences");
    return doc ?? {};
  }

  async function settingsSet(key: string, value: string): Promise<void> {
    // Read existing first, then merge
    const current = await fsGet<Record<string, string>>(uid, "settings", "preferences");
    const merged = { ...current, [key]: value };
    await fsSet(uid, "settings", "preferences", merged);
  }

  // ────────────────────────────────────────────────────────────────────────
  return {
    manuscripts: {
      getAll: manuscriptsGetAll,
      getById: manuscriptsGetById,
      create: manuscriptsCreate,
      update: manuscriptsUpdate,
      delete: manuscriptsDelete,
    },
    series: {
      getAll: seriesGetAll,
      create: seriesCreate,
      update: seriesUpdate,
      delete: seriesDelete,
    },
    sections: {
      getByManuscript: sectionsGetByManuscript,
      getById: sectionsGetById,
      create: sectionsCreate,
      update: sectionsUpdate,
      delete: sectionsDelete,
      reorder: sectionsReorder,
      saveContent: sectionsSaveContent,
    },
    versions: {
      getRecent: versionsGetRecent,
      getContent: versionsGetContent,
    },
    notes: {
      getByManuscript: notesGetByManuscript,
      create: notesCreate,
      update: notesUpdate,
      delete: notesDelete,
    },
    fonts: {
      getAll: fontsGetAll,
      import: fontsImport,
      delete: fontsDelete,
    },
    covers: {
      import: coversImport,
      getDataUrl: coversGetDataUrl,
    },
    ai: {
      getConversations: aiGetConversations,
      createConversation: aiCreateConversation,
      getMessages: aiGetMessages,
      saveMessage: aiSaveMessage,
      deleteConversation: aiDeleteConversation,
    },
    settings: {
      getAll: settingsGetAll,
      set: settingsSet,
    },
  };
}

// ─── File → base64 helper ──────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}