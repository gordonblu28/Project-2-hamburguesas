"use client";

import { useState } from "react";
import { z } from "zod";
import { restaurant } from "@/config/restaurant";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  topic: z.string(),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
});

/**
 * No backend email service is configured, so this form composes a message in
 * the visitor's own email app (mailto:). It never pretends a message was sent.
 */
export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        const r = schema.safeParse(data);
        if (!r.success) {
          setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));
          return;
        }
        setErrors({});
        const subject = encodeURIComponent(`[${r.data.topic}] Message from ${r.data.name}`);
        const body = encodeURIComponent(r.data.message);
        window.location.href = `mailto:${restaurant.email}?subject=${subject}&body=${body}`;
      }}
    >
      <div>
        <label htmlFor="c-name" className="mb-1.5 block text-sm font-semibold">
          Name
        </label>
        <input id="c-name" name="name" className="field" autoComplete="name" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "c-name-e" : undefined} />
        {errors.name && <p id="c-name-e" className="mt-1 text-sm font-semibold text-tomato-ink">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="c-topic" className="mb-1.5 block text-sm font-semibold">
          Topic
        </label>
        <select id="c-topic" name="topic" className="field">
          <option>General</option>
          <option>An existing order</option>
          <option>Catering & large orders</option>
          <option>Press & partnerships</option>
        </select>
      </div>
      <div>
        <label htmlFor="c-msg" className="mb-1.5 block text-sm font-semibold">
          Message
        </label>
        <textarea id="c-msg" name="message" className="field min-h-36" aria-invalid={errors.message ? true : undefined} aria-describedby={errors.message ? "c-msg-e" : undefined} />
        {errors.message && <p id="c-msg-e" className="mt-1 text-sm font-semibold text-tomato-ink">{errors.message}</p>}
      </div>
      <button type="submit" className="btn btn-dark">
        Open in my email app
      </button>
      <p className="text-xs text-ink-soft">This opens your email app with the message ready to send to {restaurant.email}.</p>
    </form>
  );
}
