"use client";
import { useRef, useState } from "react";
import { widgetConfigSchema, embedCode } from "@/lib/embeds";
export function EmbedBuilder({
  origin,
  today,
}: {
  origin: string;
  today: string;
}) {
  const [kind, setKind] = useState("events"),
    [view, setView] = useState("list"),
    [layout, setLayout] = useState("column"),
    [startdate, setStartdate] = useState(today),
    [limit, setLimit] = useState("5"),
    [height, setHeight] = useState("640"),
    [narrow, setNarrow] = useState(false),
    [message, setMessage] = useState(""),
    [ready, setReady] = useState(false),
    [reload, setReload] = useState(0),
    codeRef = useRef<HTMLTextAreaElement>(null);
  const parsed = widgetConfigSchema.safeParse({
    kind,
    view,
    layout,
    startdate,
    limit: kind === "events" && view === "calendar" ? 5 : limit,
    height,
  });
  const result = parsed.success ? embedCode(parsed.data, origin) : null,
    errors = parsed.success ? {} : parsed.error.flatten().fieldErrors;
  const local =
    new URL(origin).hostname === "localhost" ||
    new URL(origin).hostname === "127.0.0.1";
  return (
    <div className="embed-builder">
      <section className="panel">
        <h2>Configure</h2>
        <div className="form-stack">
          <label>
            Widget
            <select
              value={kind}
              onChange={(event) => {
                setKind(event.target.value);
                setReady(false);
              }}
            >
              <option value="events">Events</option>
              <option value="announcements">Announcements</option>
            </select>
          </label>
          {kind === "events" ? (
            <>
              <label>
                View
                <select
                  value={view}
                  onChange={(event) => {
                    setView(event.target.value);
                    setReady(false);
                  }}
                >
                  <option value="list">List</option>
                  <option value="calendar">Calendar</option>
                </select>
              </label>
              <label>
                Show events from
                <input
                  type="date"
                  min="2000-01-01"
                  max="2099-12-31"
                  value={startdate}
                  aria-invalid={!!errors.startdate}
                  onChange={(event) => {
                    setStartdate(event.target.value);
                    setReady(false);
                  }}
                />
                {errors.startdate && (
                  <small className="form-error">{errors.startdate[0]}</small>
                )}
              </label>
            </>
          ) : (
            <label>
              Layout
              <select
                value={layout}
                onChange={(event) => {
                  setLayout(event.target.value);
                  setReady(false);
                }}
              >
                <option value="column">Column</option>
                <option value="row">Row</option>
              </select>
            </label>
          )}
          {!(kind === "events" && view === "calendar") && (
            <label>
              Number of {kind === "events" ? "events" : "announcements"}
              <input
                type="number"
                min={1}
                max={10}
                step={1}
                value={limit}
                aria-invalid={!!errors.limit}
                onChange={(event) => {
                  setLimit(event.target.value);
                  setReady(false);
                }}
              />
              {errors.limit && (
                <small className="form-error">{errors.limit[0]}</small>
              )}
            </label>
          )}
          <label>
            Frame height (pixels)
            <input
              type="number"
              min={240}
              max={1600}
              step={1}
              value={height}
              aria-invalid={!!errors.height}
              onChange={(event) => setHeight(event.target.value)}
            />
            {errors.height && (
              <small className="form-error">{errors.height[0]}</small>
            )}
          </label>
        </div>
        <h2>{local ? "Local preview code" : "Embed code"}</h2>
        {local && (
          <p className="muted">
            This code points to your local site. Use the public site address
            when ICG is hosted.
          </p>
        )}
        <label>
          Iframe code
          <textarea
            ref={codeRef}
            value={result?.code ?? ""}
            readOnly
            rows={7}
          />
        </label>
        <div className="actions">
          <button
            className="button"
            disabled={!result}
            onClick={async () => {
              if (!result) return;
              try {
                await navigator.clipboard.writeText(result.code);
                setMessage("Code copied.");
              } catch {
                codeRef.current?.focus();
                codeRef.current?.select();
                setMessage("Select the code and copy it with your keyboard.");
              }
            }}
          >
            Copy code
          </button>
          <button
            className="button secondary"
            disabled={!result}
            onClick={() => {
              codeRef.current?.focus();
              codeRef.current?.select();
              setMessage("Code selected. Copy with your keyboard.");
            }}
          >
            Select code
          </button>
        </div>
        <p role="status">{message}</p>
      </section>
      <section className="embed-stage">
        <div className="page-head">
          <h2>Preview</h2>
          <div className="actions">
            <button
              className="button secondary"
              aria-pressed={narrow}
              onClick={() => setNarrow(true)}
            >
              Narrow
            </button>
            <button
              className="button secondary"
              aria-pressed={!narrow}
              onClick={() => setNarrow(false)}
            >
              Wide
            </button>
            <button
              className="text-button"
              onClick={() => {
                setReload(reload + 1);
                setReady(false);
              }}
            >
              Reload
            </button>
          </div>
        </div>
        {result ? (
          <>
            <p className="muted" role="status">
              {ready ? "Preview loaded" : "Loading preview…"} ·{" "}
              {narrow ? "280px" : "Available width"} · {height}px high
            </p>
            <iframe
              key={`${result.url}:${reload}`}
              src={result.url}
              title={`${result.title} preview`}
              onLoad={() => setReady(true)}
              onError={() => setReady(false)}
              style={{
                width: narrow ? 280 : "100%",
                maxWidth: "100%",
                height: parsed.success ? parsed.data.height : 640,
                border: 0,
              }}
            />
            <p className="muted">
              Interactions inside the preview do not change the starting options
              in the copied code.
            </p>
          </>
        ) : (
          <p className="form-error">
            Fix the highlighted options to restore the preview and code.
          </p>
        )}
      </section>
    </div>
  );
}
