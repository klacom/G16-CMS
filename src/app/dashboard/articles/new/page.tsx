import { requireProfile } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { createArticle } from "../actions";
export default async function NewArticlePage() {
  await requireProfile(["writer", "admin"]);
  return (
    <>
      <p className="kicker">Start the record</p>
      <h1>New article</h1>
      <p>Give it a working title. You can refine every detail in the editor.</p>
      <ActionForm action={createArticle} className="form-stack">
        <label>
          Working title
          <input name="title" maxLength={240} required autoFocus />
        </label>
        <label>
          Type
          <select name="type">
            <option value="news">News</option>
            <option value="event">Event</option>
            <option value="announcement">Announcement</option>
          </select>
        </label>
        <SubmitButton>Create draft</SubmitButton>
      </ActionForm>
    </>
  );
}
