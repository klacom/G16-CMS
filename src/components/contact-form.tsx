"use client";
import { useActionState, useState } from "react";
import { submitContact } from "@/app/(public)/contact/actions";
import { SubmitButton } from "./action-form";
const topics = [
  ["question", "A question"],
  ["account", "Desk account help"],
  ["event", "An upcoming event"],
  ["correction", "A correction"],
  ["photo", "A photo or removal request"],
  ["partner", "Working with ICG"],
];
function ContactFields({
  requestKey,
  initialTopic,
  article,
  onNew,
}: {
  requestKey: string;
  initialTopic: string;
  article?: string;
  onNew: () => void;
}) {
  const [topic, setTopic] = useState(initialTopic),
    [state, action] = useActionState(submitContact, { ok: false, message: "" });
  if (state.ok)
    return (
      <section className="panel" role="status">
        <p className="kicker">On its way to the desk</p>
        <h2>Message sent.</h2>
        <p>{state.message}</p>
        <button className="button secondary" onClick={onNew}>
          Send another message
        </button>
      </section>
    );
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="request_key" value={requestKey} />
      {article && <input type="hidden" name="article_id" value={article} />}
      <div className="honeypot" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label>
        What is this about?
        <select
          name="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        >
          {topics.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="form-grid">
        <label>
          First name
          <input
            name="first_name"
            autoComplete="given-name"
            required
            maxLength={80}
            aria-invalid={!!state.fields?.first_name}
          />
        </label>
        <label>
          Last name
          <input
            name="last_name"
            autoComplete="family-name"
            required
            maxLength={80}
            aria-invalid={!!state.fields?.last_name}
          />
        </label>
      </div>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={!!state.fields?.email}
        />
      </label>
      <label>
        Phone (optional)
        <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
      </label>
      {topic === "event" && (
        <fieldset className="panel">
          <legend>Event details</legend>
          <div className="form-stack">
            <label>
              Event name
              <input name="event_title" maxLength={240} required />
            </label>
            <label>
              Starts — Philippine time
              <input name="event_starts_at" type="datetime-local" required />
            </label>
            <label>
              Venue
              <input name="event_place" maxLength={240} required />
            </label>
          </div>
        </fieldset>
      )}
      <label>
        Subject
        <input
          name="subject"
          maxLength={200}
          required
          aria-invalid={!!state.fields?.subject}
        />
      </label>
      <label>
        Message
        <textarea
          name="body"
          maxLength={10000}
          rows={7}
          required
          aria-invalid={!!state.fields?.body}
        />
      </label>
      {state.message && (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      )}
      <p className="muted">
        Your contact details and message are shared only with the ICG
        administration desk.
      </p>
      <SubmitButton pendingText="Sending…">Send message</SubmitButton>
    </form>
  );
}
export function ContactForm({
  requestKey,
  topic,
  article,
}: {
  requestKey: string;
  topic?: string;
  article?: string;
}) {
  const [key, setKey] = useState(requestKey),
    initialTopic = topics.some(([value]) => value === topic)
      ? topic!
      : "question";
  return (
    <ContactFields
      key={key}
      requestKey={key}
      initialTopic={initialTopic}
      article={article}
      onNew={() => setKey(crypto.randomUUID())}
    />
  );
}
