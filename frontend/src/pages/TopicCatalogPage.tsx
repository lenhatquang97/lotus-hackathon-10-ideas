import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { topicsApi } from "../services/api";
import type { Topic } from "../types";

const DOMAIN_FILTERS = [
    "All",
    "business",
    "negotiation",
    "healthcare",
    "career",
    "travel",
    "environment",
];
const DIFFICULTY_FILTERS = ["All", "Beginner", "Intermediate", "Advanced"];

function FilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className="meta relative px-3 py-1.5 transition-colors duration-150 cursor-pointer"
            style={{
                color: active
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                background: "transparent",
                border: "none",
            }}
        >
            {children}
            <span
                className="absolute bottom-0 left-3 right-3"
                style={{
                    height: "1.5px",
                    backgroundColor: "var(--color-accent)",
                    display: "block",
                    transform: active ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: "transform 180ms",
                }}
            />
        </button>
    );
}

function TopicCard({ topic, onJoin }: { topic: Topic; onJoin: () => void }) {
    return (
        <div
            className="h-full px-6 py-7 transition-all duration-200 cursor-pointer group"
            style={{ backgroundColor: "var(--color-surface)" }}
            onClick={onJoin}
        >
            <div className="flex items-baseline justify-between">
                <span
                    className="meta"
                    style={{ fontSize: "10px", letterSpacing: "0.12em" }}
                >
                    {(topic.tags || [])[0] || "General"}
                </span>
                <span className="meta" style={{ fontSize: "10px" }}>
                    {(topic.characters || []).length}{" "}
                    {(topic.characters || []).length === 1
                        ? "CHARACTER"
                        : "CHARACTERS"}
                </span>
            </div>

            <div
                className="my-3.5 h-px"
                style={{ backgroundColor: "var(--color-border)" }}
            />

            <h3
                className="font-display text-[22px] font-semibold leading-[1.2] mb-2.5 transition-colors"
                style={{ color: "var(--color-text-primary)" }}
            >
                {topic.title}
            </h3>

            <p
                className="font-body text-[13px] leading-relaxed mb-5 line-clamp-3 transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
            >
                {topic.description}
            </p>

            <div className="flex items-center">
                <span
                    className="meta transition-colors"
                    style={{ fontSize: "10px", letterSpacing: "0.12em" }}
                >
                    {topic.play_count} plays
                </span>
                {(topic.difficulty_levels || []).map((l) => (
                    <span
                        key={l}
                        className="meta ml-auto px-2 py-0.5 border transition-colors"
                        style={{
                            fontSize: "10px",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-secondary)",
                        }}
                    >
                        {l}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function TopicCatalogPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [tagFilter, setTagFilter] = useState("All");
    const [difficultyFilter, setDifficultyFilter] = useState("All");
    const [joining, setJoining] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        topicsApi
            .list()
            .then((r) => setTopics(r.data))
            .finally(() => setLoading(false));
    }, []);

    const filtered = topics.filter((t) => {
        if (tagFilter !== "All" && !(t.tags || []).includes(tagFilter))
            return false;
        if (
            difficultyFilter !== "All" &&
            !(t.difficulty_levels || []).includes(difficultyFilter)
        )
            return false;
        return true;
    });

    const handleJoin = (topicId: string) => {
        setJoining(topicId);
        navigate(`/world/${topicId}`);
    };

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: "var(--color-bg)" }}
        >
            <Navbar />
            <div className="max-w-[1200px] mx-auto px-12 py-16">
                <div className="flex items-end justify-between mb-2">
                    <h1
                        className="font-display text-[56px] italic"
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        Available Worlds
                    </h1>
                    <Link
                        to="/studio/topics/create"
                        className="font-body text-[13px] px-5 py-2.5 border transition-all duration-200"
                        style={{
                            borderColor: "var(--color-accent)",
                            color: "var(--color-accent)",
                        }}
                    >
                        + Create World
                    </Link>
                </div>
                <p
                    className="font-body text-[15px] mb-12"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    Choose a conversation scenario to practice.
                </p>

                {/* Filters */}
                <div className="flex items-center mb-10 overflow-x-auto pb-2">
                    <div className="flex items-center">
                        {DOMAIN_FILTERS.map((d) => (
                            <FilterButton
                                key={d}
                                active={tagFilter === d}
                                onClick={() => setTagFilter(d)}
                            >
                                {d}
                            </FilterButton>
                        ))}
                    </div>
                    <div
                        className="w-px h-4 mx-4 flex-shrink-0"
                        style={{ backgroundColor: "var(--color-border)" }}
                    />
                    <div className="flex items-center ml-auto">
                        {DIFFICULTY_FILTERS.map((l) => (
                            <FilterButton
                                key={l}
                                active={difficultyFilter === l}
                                onClick={() => setDifficultyFilter(l)}
                            >
                                {l}
                            </FilterButton>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div
                        className="text-center py-24 meta"
                        style={{ fontSize: "11px" }}
                    >
                        Loading worlds...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <p
                            className="font-display text-xl mb-2"
                            style={{ color: "var(--color-text-primary)" }}
                        >
                            No worlds match your filters
                        </p>
                        <p
                            className="font-body text-sm"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            Try adjusting your filters
                        </p>
                    </div>
                ) : (
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
                        style={{ backgroundColor: "var(--color-border)" }}
                    >
                        {filtered.map((topic, i) => (
                            <div
                                key={topic.id}
                                className="animate-fade-up"
                                style={{ animationDelay: `${(i + 1) * 60}ms` }}
                            >
                                <TopicCard
                                    topic={topic}
                                    onJoin={() =>
                                        !joining && handleJoin(topic.id)
                                    }
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
