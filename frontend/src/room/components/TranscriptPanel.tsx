import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import type { TranscriptLine } from "../types/room.types";

// ── Mock hard vocabulary configured by the topic creator ──
export const HARD_VOCABULARY: Record<string, string> = {
    I: "The speaker themselves",
    compensation: "Money and benefits received for work",
    leverage: "Use something to maximum advantage",
    benchmark: "A standard for comparison",
    counteroffer: "An offer made in response to another",
    equity: "Ownership interest or fairness",
    negotiate: "Discuss terms to reach an agreement",
    assertive: "Confident and forceful",
    articulate: "Express clearly and effectively",
    stakeholder: "A person with interest in a decision",
    compromise: "An agreement with mutual concessions",
    tenure: "The holding of a position or period of time",
    merit: "The quality of being worthy",
    retention: "The act of keeping something",
    attrition: "Gradual reduction in staff",
    incentive: "Something that motivates action",
};

const VOCAB_WORDS = Object.keys(HARD_VOCABULARY);

/** Build a regex that matches any vocabulary word (whole-word, case-insensitive) */
function buildVocabRegex(words: string[]): RegExp | null {
    if (words.length === 0) return null;
    const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

/** Extract all vocab words found in text */
function findVocabWords(text: string, regex: RegExp | null): string[] {
    if (!regex) return [];
    const found: string[] = [];
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
        const word = match[0].toLowerCase();
        if (!found.includes(word)) found.push(word);
    }
    return found;
}

/** Split text into segments: plain text and vocab matches */
function highlightText(
    text: string,
    regex: RegExp | null,
): Array<{ text: string; isVocab: boolean; word?: string }> {
    if (!regex) return [{ text, isVocab: false }];
    const segments: Array<{ text: string; isVocab: boolean; word?: string }> =
        [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({
                text: text.slice(lastIndex, match.index),
                isVocab: false,
            });
        }
        segments.push({
            text: match[0],
            isVocab: true,
            word: match[0].toLowerCase(),
        });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        segments.push({ text: text.slice(lastIndex), isVocab: false });
    }
    return segments;
}

function VocabWord({
    text,
    definition,
    onClick,
}: {
    text: string;
    definition?: string;
    onClick?: () => void;
}) {
    return (
        <span className="vocab-highlight" onClick={onClick}>
            {text}
        </span>
    );
}

/** Top-of-screen popup banner for vocab words */
interface VocabPopup {
    id: number;
    word: string;
    definition: string;
    exiting: boolean;
}

function VocabPopupBanner({
    popups,
    onDismiss,
}: {
    popups: VocabPopup[];
    onDismiss: (id: number) => void;
}) {
    if (popups.length === 0) return null;
    return (
        <div className="vocab-popup-container">
            {popups.map((p) => (
                <div
                    key={p.id}
                    className={`vocab-popup-banner${p.exiting ? " exiting" : ""}`}
                    onClick={() => onDismiss(p.id)}
                >
                    <span className="vocab-popup-label">VOCABULARY</span>
                    <span className="vocab-popup-word">{p.word}</span>
                    <span className="vocab-popup-def">{p.definition}</span>
                </div>
            ))}
        </div>
    );
}

interface TranscriptPanelProps {
    transcript: TranscriptLine[];
    isOpen: boolean;
    onToggle: () => void;
    vocabulary?: Record<string, string>;
}

export function TranscriptPanel({
    transcript,
    isOpen,
    onToggle,
    vocabulary,
}: TranscriptPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    // Use provided vocabulary from topic, fall back to mock
    const activeVocab = vocabulary && Object.keys(vocabulary).length > 0 ? vocabulary : HARD_VOCABULARY;
    const activeWords = useMemo(() => Object.keys(activeVocab), [activeVocab]);
    const vocabRegex = useMemo(() => buildVocabRegex(activeWords), [activeWords]);
    const [popups, setPopups] = useState<VocabPopup[]>([]);
    const seenWordsRef = useRef<Set<string>>(new Set());
    const popupIdRef = useRef(0);

    const dismissPopup = useCallback((id: number) => {
        setPopups((prev) =>
            prev.map((p) => (p.id === id ? { ...p, exiting: true } : p)),
        );
        setTimeout(
            () => setPopups((prev) => prev.filter((p) => p.id !== id)),
            400,
        );
    }, []);

    const showPopup = useCallback(
        (word: string) => {
            const def = activeVocab[word];
            if (!def) return;
            const id = ++popupIdRef.current;
            setPopups((prev) => [
                ...prev,
                { id, word, definition: def, exiting: false },
            ]);
            // Auto-dismiss after 4 seconds
            setTimeout(() => dismissPopup(id), 4000);
        },
        [dismissPopup],
    );

    // Detect new vocab words when transcript changes
    useEffect(() => {
        if (transcript.length === 0) return;
        const lastLine = transcript[transcript.length - 1];
        const words = findVocabWords(lastLine.text, vocabRegex);
        for (const w of words) {
            if (!seenWordsRef.current.has(w)) {
                seenWordsRef.current.add(w);
                showPopup(w);
            }
        }
    }, [transcript, vocabRegex, showPopup]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [transcript]);

    return (
        <>
            <VocabPopupBanner popups={popups} onDismiss={dismissPopup} />
            <div className={`transcript-panel${isOpen ? "" : " closed"}`}>
                <button className="transcript-toggle" onClick={onToggle}>
                    {isOpen ? "CLOSE" : "LOG"}
                </button>
                <div className="transcript-header">Transcript</div>
                <div className="transcript-body">
                    {transcript.length === 0 && (
                        <span
                            style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "10px",
                                color: "#6B6B6B",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase" as const,
                            }}
                        >
                            Conversation will appear here...
                        </span>
                    )}
                    {transcript.map((line) => {
                        const segments = highlightText(line.text, vocabRegex);
                        return (
                            <div
                                key={line.id}
                                className={`transcript-line${line.isUser ? " user" : ""}`}
                            >
                                <span className="transcript-speaker">
                                    {line.speakerName}
                                </span>
                                <span
                                    className={`transcript-text${line.isUser ? " user" : ""}${line.isStreaming ? " streaming" : ""}`}
                                >
                                    {segments.map((seg, i) =>
                                        seg.isVocab ? (
                                            <VocabWord
                                                key={i}
                                                text={seg.text}
                                                definition={
                                                    activeVocab[seg.word!]
                                                }
                                                onClick={() =>
                                                    showPopup(seg.word!)
                                                }
                                            />
                                        ) : (
                                            <span key={i}>{seg.text}</span>
                                        ),
                                    )}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
            </div>
        </>
    );
}
