import { useRef, useLayoutEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Lead } from "../../types";
import LeadCard from "./LeadCard";

interface LeadsGroupProps {
    label: string;
    leads: Lead[];
    selected: string[];
    toggleSelect: (id: string) => void;
}

export default function LeadsGroup({
    label,
    leads,
    selected,
    toggleSelect
}: LeadsGroupProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-base-400 uppercase tracking-wider capitalize">
                    {label}
                </p>
                <span className="text-xs text-base-600">{leads.length}</span>
            </div>
            <LeadsGrid
                leads={leads}
                selected={selected}
                toggleSelect={toggleSelect}
            />
        </div>
    );
}
function LeadsGrid({
    leads,
    selected,
    toggleSelect,
}: {
    leads: Lead[];
    selected: string[];
    toggleSelect: (id: string) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        setScrollElement(document.getElementById("main-content"));
    }, []);

    const virtualizer = useVirtualizer({
        count: leads.length,
        getScrollElement: () => scrollElement,
        estimateSize: () => 340,
        overscan: 4,
        scrollMargin: containerRef.current?.offsetTop ?? 0,
        measureElement: (el) => el.getBoundingClientRect().height,
    });

    return (
        <div ref={containerRef}>
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${
                                virtualItem.start -
                                virtualizer.options.scrollMargin
                            }px)`,
                            paddingBottom: "16px",
                        }}
                    >
                        <LeadCard
                            lead={leads[virtualItem.index]}
                            selected={selected}
                            toggleSelect={toggleSelect}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}