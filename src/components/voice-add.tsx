"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2, Mic, Square, X } from "lucide-react";
import Modal from "@/components/modal";
import { applySpoken, interpretSpoken, type VoiceProposal } from "@/lib/actions/voice";

// Minimal typing for the browser speech API (Chrome / Edge / Safari expose it as webkitSpeechRecognition).
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const ACTION_LABEL = { add_task: "Task", add_deadline: "Deadline", complete: "Mark done" } as const;

function formatDate(ymd: string | null) {
  if (!ymd) return "No date";
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/** Floating "Speak a task" button: talk (or type), check what Perago understood, tap Add. */
export default function VoiceAdd() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [proposals, setProposals] = useState<VoiceProposal[] | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();
  const recRef = useRef<Recognition | null>(null);
  const baseRef = useRef("");

  useEffect(() => setCanListen(!!getRecognition()), []);

  function reset() {
    recRef.current?.stop();
    setText("");
    setListening(false);
    setProposals(null);
    setQuestion(null);
    setError(null);
    setSaved(null);
  }

  function close() {
    reset();
    setOpen(false);
  }

  function startListening() {
    const rec = getRecognition();
    if (!rec) return;
    setError(null);
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = text ? `${text.trim()} ` : "";
    rec.onresult = (e) => {
      let spoken = "";
      for (let i = 0; i < e.results.length; i++) spoken += e.results[i][0].transcript;
      setText(baseRef.current + spoken);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") setError("Allow microphone access for Perago in your browser settings, or use the mic on your keyboard.");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stopListening() {
    recRef.current?.stop();
    setListening(false);
  }

  function understand() {
    stopListening();
    setError(null);
    startTransition(async () => {
      const result = await interpretSpoken(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setProposals(result.proposals);
      setQuestion(result.question);
    });
  }

  function save() {
    const ready = (proposals ?? []).filter((p) => !p.problem);
    startTransition(async () => {
      const result = await applySpoken(ready);
      if (!result.ok) setError(result.error);
      else {
        setSaved(result.saved);
        setProposals(null);
      }
    });
  }

  const readyCount = (proposals ?? []).filter((p) => !p.problem).length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Speak a task"
        aria-label="Speak a task"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-gold shadow-lg transition hover:scale-105 print:hidden"
      >
        <Mic size={24} />
      </button>

      <Modal open={open} onClose={close} title="Speak a task">
        {saved ? (
          <div className="space-y-3">
            <ul className="space-y-1.5">
              {saved.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-800">
                  <Check size={16} className="mt-0.5 shrink-0 text-gold" />
                  {s}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Add more
              </button>
              <button onClick={close} className="flex-1 rounded-lg bg-charcoal px-3 py-2 text-sm font-medium text-white hover:bg-gold hover:text-charcoal">
                Done
              </button>
            </div>
          </div>
        ) : proposals ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Here&apos;s what I understood. Remove anything that&apos;s wrong, then add.</p>
            {question && <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">{question}</p>}
            <ul className="space-y-2">
              {proposals.map((p, i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{ACTION_LABEL[p.action]}</p>
                    <p className="text-sm font-medium text-slate-900">{p.action === "complete" ? p.existingLabel ?? p.title : p.title}</p>
                    {p.action !== "complete" && (
                      <p className="mt-0.5 text-xs text-slate-600">
                        {p.projectLabel ?? "No project"} · {formatDate(p.dueDate)} · {p.assigneeName}
                      </p>
                    )}
                    {p.problem && <p className="mt-1 text-xs font-semibold text-slate-900">Needs fixing: {p.problem} Remove it and say it again with more detail.</p>}
                  </div>
                  <button
                    onClick={() => setProposals(proposals.filter((_, j) => j !== i))}
                    aria-label="Remove"
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
            {proposals.length === 0 && <p className="text-sm text-slate-500">Nothing left to add.</p>}
            {error && <p className="text-sm text-slate-900">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setProposals(null); setQuestion(null); }}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Change what I said
              </button>
              <button
                onClick={save}
                disabled={pending || readyCount === 0}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-charcoal px-3 py-2 text-sm font-medium text-white hover:bg-gold hover:text-charcoal disabled:opacity-50"
              >
                {pending && <Loader2 size={14} className="animate-spin" />}
                Add {readyCount || ""}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              e.g. &quot;Task for Chae&apos;s apartment, chase the travertine templates, due Tuesday. Mark the Springs follow-up as
              done.&quot;
            </p>

            {canListen && (
              <div className="flex justify-center py-2">
                <button
                  onClick={listening ? stopListening : startListening}
                  aria-label={listening ? "Stop" : "Start talking"}
                  className={`flex h-20 w-20 items-center justify-center rounded-full shadow-md transition ${
                    listening ? "animate-pulse bg-gold text-charcoal" : "bg-charcoal text-gold hover:scale-105"
                  }`}
                >
                  {listening ? <Square size={26} /> : <Mic size={30} />}
                </button>
              </div>
            )}
            {canListen && (
              <p className="text-center text-xs text-slate-500">{listening ? "Listening… tap to stop" : "Tap the mic and talk"}</p>
            )}

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={canListen ? "Your words appear here — you can edit them" : "Tap the mic on your keyboard and talk, or type"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />

            {error && <p className="text-sm text-slate-900">{error}</p>}

            <button
              onClick={understand}
              disabled={pending || !text.trim()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-charcoal px-3 py-2.5 text-sm font-medium text-white hover:bg-gold hover:text-charcoal disabled:opacity-50"
            >
              {pending && <Loader2 size={14} className="animate-spin" />}
              {pending ? "Working it out…" : "Next"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
