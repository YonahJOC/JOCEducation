"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CYCLES, getCycleState, getCurrentWeek, type Cycle } from "@/lib/cycles";
import { CurrentCycleSection } from "./CurrentCycleSection";

const CARD_WIDTH = 300;
const CARD_GAP = 12;
const DRAG_THRESHOLD = 4;
const CLICK_SUPPRESS_MS = 60;

function RailCard({
  cycle,
  active,
  onClick,
}: {
  cycle: Cycle;
  active: boolean;
  onClick: () => void;
}) {
  const state = getCycleState(cycle);
  const week = getCurrentWeek(cycle);

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        flexShrink: 0,
        width: `${CARD_WIDTH}px`,
        scrollSnapAlign: "start",
        backgroundColor: active ? "#fff" : "rgba(16,35,63,.03)",
        border: active ? `1px solid ${cycle.color}` : "1px solid rgba(16,35,63,.1)",
        borderRadius: "20px",
        padding: "20px",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: active ? `0 6px 20px rgba(16,35,63,.1)` : "none",
        transition: "all .2s",
        outline: "none",
        userSelect: "none",
      }}
    >
      {/* Accent + number */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            backgroundColor: active ? cycle.color : "rgba(16,35,63,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: active ? "#fff" : "rgba(16,35,63,.55)",
              lineHeight: 1,
            }}
          >
            {cycle.num}
          </span>
        </div>
        {state === "current" && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#1B7F4B",
              background: "rgba(27,127,75,.1)",
              padding: "3px 8px",
              borderRadius: "9999px",
            }}
          >
            <span
              className="joc-pulse"
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                backgroundColor: "#1B7F4B",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            Now
          </span>
        )}
        {state === "past" && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "rgba(16,35,63,.4)",
            }}
          >
            ✓ Done
          </span>
        )}
      </div>

      {/* Hebrew month */}
      <p
        style={{
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: active ? cycle.color : "rgba(16,35,63,.45)",
          marginBottom: "4px",
        }}
      >
        {cycle.hebrew}
      </p>

      {/* Theme */}
      <p
        style={{
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "-0.02em",
          color: "#10233F",
          lineHeight: 1.25,
          marginBottom: "4px",
        }}
      >
        {cycle.theme}
      </p>
      <p style={{ fontSize: "12.5px", color: "rgba(16,35,63,.55)", marginBottom: "14px", lineHeight: 1.4 }}>
        {cycle.gloss}
      </p>

      {/* Progress bar */}
      <div>
        <div style={{ height: "4px", borderRadius: "9999px", backgroundColor: "rgba(16,35,63,.08)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: "9999px",
              backgroundColor:
                state === "past"
                  ? "rgba(16,35,63,.25)"
                  : active
                  ? cycle.color
                  : "rgba(16,35,63,.2)",
              width:
                state === "past"
                  ? "100%"
                  : state === "upcoming"
                  ? "0%"
                  : `${Math.round((week / cycle.weeks) * 100)}%`,
              transition: "width .4s ease",
            }}
          />
        </div>
        <p style={{ fontSize: "11px", color: "rgba(16,35,63,.4)", marginTop: "5px" }}>{cycle.range}</p>
      </div>
    </button>
  );
}

export function CycleRailSection({ initialIndex }: { initialIndex: number }) {
  const [selected, setSelected] = useState(initialIndex);
  const railRef = useRef<HTMLDivElement>(null);

  // Drag state
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const isDragging = useRef(false);
  const suppressClick = useRef(false);

  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Scroll card into view
  const scrollToCard = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const rail = railRef.current;
      if (!rail) return;
      const targetX = index * (CARD_WIDTH + CARD_GAP);
      rail.scrollTo({ left: targetX, behavior: prefersReduced ? "auto" : behavior });
    },
    [prefersReduced]
  );

  // On mount, scroll to initial (auto, no animation)
  useEffect(() => {
    scrollToCard(initialIndex, "auto");
  }, [initialIndex, scrollToCard]);

  const handleSelect = useCallback(
    (index: number) => {
      setSelected(index);
      scrollToCard(index);
    },
    [scrollToCard]
  );

  const handlePrev = () => {
    const next = Math.max(0, selected - 1);
    handleSelect(next);
  };

  const handleNext = () => {
    const next = Math.min(CYCLES.length - 1, selected + 1);
    handleSelect(next);
  };

  const handleJumpToday = () => {
    handleSelect(initialIndex);
  };

  // Pointer drag handlers
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    dragStartX.current = e.clientX;
    dragStartScroll.current = rail.scrollLeft;
    isDragging.current = false;
    rail.setPointerCapture(e.pointerId);
    // Disable snap during drag
    rail.style.scrollSnapType = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    const dx = e.clientX - dragStartX.current;
    if (!isDragging.current && Math.abs(dx) > DRAG_THRESHOLD) {
      isDragging.current = true;
    }
    if (isDragging.current) {
      rail.scrollLeft = dragStartScroll.current - dx;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.releasePointerCapture(e.pointerId);
    if (isDragging.current) {
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, CLICK_SUPPRESS_MS);
      // Snap to nearest card
      const nearest = Math.round(rail.scrollLeft / (CARD_WIDTH + CARD_GAP));
      const clamped = Math.max(0, Math.min(CYCLES.length - 1, nearest));
      rail.style.scrollSnapType = prefersReduced ? "none" : "x mandatory";
      setSelected(clamped);
      scrollToCard(clamped);
    } else {
      rail.style.scrollSnapType = prefersReduced ? "none" : "x mandatory";
    }
    isDragging.current = false;
  };

  // Keyboard on rail
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handleSelect(Math.max(0, selected - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleSelect(Math.min(CYCLES.length - 1, selected + 1));
    }
  };

  const selectedCycle = CYCLES[selected];

  return (
    <section style={{ padding: "56px 26px 32px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Page heading */}
      <p
        style={{
          fontWeight: 700,
          fontSize: "11.5px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#C96C00",
          marginBottom: "10px",
        }}
      >
        THE CHESED CYCLE
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "36px",
        }}
      >
        <h1
          style={{
            fontWeight: 800,
            fontSize: "clamp(30px, 4vw, 52px)",
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: "#10233F",
            margin: 0,
          }}
        >
          The year in chesed.
        </h1>
        <p
          style={{
            fontStyle: "italic",
            fontFamily: "var(--font-newsreader)",
            fontSize: "17px",
            color: "rgba(16,35,63,.6)",
            lineHeight: 1.5,
            maxWidth: "400px",
          }}
        >
          Eight cycles. Eight middos. One question to carry through each.
        </p>
      </div>

      {/* Detail panel */}
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(16,35,63,.1)",
          borderRadius: "26px",
          padding: "32px",
          marginBottom: "20px",
        }}
      >
        <CurrentCycleSection cycle={selectedCycle} />
      </div>

      {/* Rail controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(16,35,63,.5)" }}>
          {selected + 1} of {CYCLES.length}
        </p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={handleJumpToday}
            aria-label="Jump to current cycle"
            style={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#2D46AF",
              background: "rgba(45,70,175,.08)",
              border: "none",
              borderRadius: "9999px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Jump to today
          </button>
          <button
            onClick={handlePrev}
            disabled={selected === 0}
            aria-label="Previous cycle"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid rgba(16,35,63,.15)",
              background: "#fff",
              cursor: selected === 0 ? "default" : "pointer",
              opacity: selected === 0 ? 0.3 : 1,
              fontSize: "16px",
              color: "#10233F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            disabled={selected === CYCLES.length - 1}
            aria-label="Next cycle"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid rgba(16,35,63,.15)",
              background: "#fff",
              cursor: selected === CYCLES.length - 1 ? "default" : "pointer",
              opacity: selected === CYCLES.length - 1 ? 0.3 : 1,
              fontSize: "16px",
              color: "#10233F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Rail */}
      <div
        ref={railRef}
        role="group"
        aria-label={`Chesed Cycles — all ${CYCLES.length}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          display: "flex",
          gap: `${CARD_GAP}px`,
          overflowX: "auto",
          scrollSnapType: prefersReduced ? "none" : "x mandatory",
          scrollbarWidth: "none",
          paddingBottom: "6px",
          cursor: "grab",
          outline: "none",
        }}
      >
        {CYCLES.map((c, i) => (
          <RailCard
            key={c.slug}
            cycle={c}
            active={selected === i}
            onClick={() => {
              if (suppressClick.current) return;
              handleSelect(i);
            }}
          />
        ))}
      </div>

      {/* Footnote */}
      <p
        style={{
          fontStyle: "italic",
          fontFamily: "var(--font-newsreader)",
          fontSize: "13px",
          color: "rgba(16,35,63,.45)",
          marginTop: "18px",
          lineHeight: 1.6,
        }}
      >
        Cycles 7 (Nisan) and 8 (Iyar&ndash;Sivan) include Israel-focused programming around Yom HaShoah, Yom HaZikaron, Yom Ha&apos;atzmaut, and Yom Yerushalayim.
      </p>
    </section>
  );
}
