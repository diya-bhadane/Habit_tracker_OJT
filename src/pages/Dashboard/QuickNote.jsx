import { useState } from "react";

export default function QuickNote({ notes, onCreateNote, onUpdateNote, onDeleteNote }) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const text = draft.trim();
    if (!text) return;

    if (editingId && onUpdateNote) {
      onUpdateNote(editingId, text);
    } else if (onCreateNote) {
      onCreateNote(text);
    }

    setDraft("");
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEdit = (note) => {
    setDraft(note.text);
    setEditingId(note.id);
  };

  return (
    <section className="flex flex-col rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Quick Notes
        </h2>
        <textarea
          className="mt-3 h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          placeholder={editingId ? "Edit your note..." : "Write a quick note..."}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Note saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="ml-auto inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {editingId ? "Update Note" : "Save Note"}
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <p className="whitespace-pre-wrap break-words">{note.text}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>
                  {note.updatedAt
                    ? new Date(note.updatedAt).toLocaleDateString()
                    : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(note)}
                    className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteNote && onDeleteNote(note.id)}
                    className="rounded-full border border-red-200 px-2 py-0.5 text-[10px] text-red-500 hover:bg-red-50 dark:border-red-500/40 dark:hover:bg-red-900/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            No notes yet. Write something above and save it.
          </p>
        )}
      </div>
    </section>
  );
}
