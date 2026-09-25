"use client";
import { useT, type Key } from "./i18n";

import { useMemo, useState } from "react";
import {
  BellRing,
  CalendarClock,
  Check,
  Mail,
  Search,
  Users,
} from "lucide-react";
import type { Contact, Issue } from "./data";

/* Setting up an automation.

   Four decisions, in the order someone actually makes them: what goes out,
   how it travels, who receives it, and how often. The summary at the foot
   says the whole thing back as one sentence, so the schedule can be checked
   before it is switched on. */

export type NewAutomation = {
  name: string;
  issueId: string;
  channel: string;
  group: string;
  recipients?: string[];
  frequency: string;
};

const FREQUENCIES = [
  { value: "Daily", label: "af.Every day", hint: "af.dailyHint" },
  { value: "Weekly", label: "af.Every week", hint: "af.The usual rhythm" },
  { value: "Monthly", label: "af.Every month", hint: "af.monthlyHint" },
] as const;

const WHO = [
  { value: "all", label: "af.Everyone" },
  { value: "group", label: "af.aGroup" },
  { value: "people", label: "af.Pick people" },
] as const;

export function AutomationForm({
  issues,
  contacts,
  groups,
  onCreate,
}: {
  issues: Issue[];
  contacts: Contact[];
  groups: string[];
  onCreate: (a: NewAutomation) => void;
}) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [issueId, setIssueId] = useState("");
  const [channel, setChannel] = useState("Email");
  const [who, setWho] = useState("all");
  const [group, setGroup] = useState(groups[0] ?? "All contacts");
  const [picked, setPicked] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("Weekly");
  const [query, setQuery] = useState("");

  /* Only people who agreed to receive email can be chosen. Showing the rest
     would offer a choice the sender is not allowed to act on. */
  const mailable = useMemo(
    () => contacts.filter((c) => c.subscribed && c.email),
    [contacts],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mailable;
    return mailable.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [mailable, query]);

  const toggle = (email: string) =>
    setPicked((p) =>
      p.includes(email) ? p.filter((e) => e !== email) : [...p, email],
    );

  const phone = channel === "Phone alert";
  const inGroup = mailable.filter((c) => c.group === group).length;

  const audience = phone
    ? "everyone with notifications on"
    : who === "people"
      ? `${picked.length} ${picked.length === 1 ? "person" : "people"}`
      : who === "group"
        ? `${group} (${inGroup})`
        : `all ${mailable.length} subscribed`;

  const incomplete = !phone && who === "people" && picked.length === 0;

  const first = new Date();
  first.setUTCDate(first.getUTCDate() + 1);
  first.setUTCHours(9, 0, 0, 0);
  const firstDay = first.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <form
      className="auto-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (incomplete) return;
        onCreate({
          name: name.trim(),
          issueId,
          channel,
          group: phone || who !== "group" ? "All contacts" : group,
          recipients: !phone && who === "people" ? picked : undefined,
          frequency,
        });
      }}
    >
      <label className="auto-field">
        <span className="auto-label">{t("af.name")}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={t("af.namePlaceholder")}
        />
      </label>

      <label className="auto-field">
        <span className="auto-label">{t("af.which")}</span>
        <select value={issueId} onChange={(e) => setIssueId(e.target.value)}>
          <option value="">{t("af.latest")}</option>
          {issues.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title}
            </option>
          ))}
        </select>
      </label>

      <div className="auto-field">
        <span className="auto-label">{t("af.how")}</span>
        <div className="auto-seg" role="group" aria-label={t("af.channel")}>
          {(
            [
              { v: "Email", label: "af.Email", icon: <Mail size={15} /> },
              {
                v: "Phone alert",
                label: "af.Phone alert",
                icon: <BellRing size={15} />,
              },
            ] as const
          ).map((c) => (
            <button
              key={c.v}
              type="button"
              className={"auto-seg-btn" + (channel === c.v ? " on" : "")}
              aria-pressed={channel === c.v}
              onClick={() => setChannel(c.v)}
            >
              {c.icon}
              {t(c.label)}
            </button>
          ))}
        </div>
      </div>

      {phone ? (
        <p className="auto-note">
          <BellRing size={15} aria-hidden="true" />
          {t("af.pushNote")}
        </p>
      ) : (
        <div className="auto-field">
          <span className="auto-label">{t("af.who")}</span>
          <div className="auto-seg" role="group" aria-label={t("af.who")}>
            {WHO.map((w) => (
              <button
                key={w.value}
                type="button"
                className={"auto-seg-btn" + (who === w.value ? " on" : "")}
                aria-pressed={who === w.value}
                onClick={() => setWho(w.value)}
              >
                {t(w.label)}
              </button>
            ))}
          </div>

          {who === "group" && (
            <select
              className="auto-sub"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              aria-label={t("af.group")}
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g} ({mailable.filter((c) => c.group === g).length})
                </option>
              ))}
            </select>
          )}

          {who === "people" && (
            <div className="auto-people">
              <div className="auto-search">
                <Search size={15} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("af.searchHint")}
                  aria-label={t("af.search")}
                />
              </div>

              <div className="auto-list">
                {matches.length ? (
                  matches.map((c) => {
                    const on = picked.includes(c.email);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={"auto-person" + (on ? " on" : "")}
                        aria-pressed={on}
                        onClick={() => toggle(c.email)}
                      >
                        <span className="auto-tick" aria-hidden="true">
                          {on && <Check size={13} />}
                        </span>
                        <span>
                          {c.name}
                          <small>{c.email}</small>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="auto-empty">
                    {mailable.length
                      ? t("af.noMatch")
                      : t("af.noneYet")}
                  </p>
                )}
              </div>

              <p className="auto-count">
                {picked.length
                  ? `${picked.length} selected`
                  : t("af.pickOne")}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="auto-field">
        <span className="auto-label">{t("af.often")}</span>
        <div className="auto-freq" role="group" aria-label={t("af.often")}>
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              className={"auto-card" + (frequency === f.value ? " on" : "")}
              aria-pressed={frequency === f.value}
              onClick={() => setFrequency(f.value)}
            >
              <strong>{t(f.label)}</strong>
              <small>{t(f.hint)}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="auto-summary">
        <CalendarClock size={18} aria-hidden="true" />
        <p>
          <strong>
            {t(
              (FREQUENCIES.find((f) => f.value === frequency)?.label ??
                "af.Every week") as Key,
            )}{" "}
            {t("af.atNine")}
          </strong>
          <span>
            {t(phone ? "af.aPhoneAlert" : "af.anEmail", {
              audience,
              day: firstDay,
            })}
          </span>
        </p>
      </div>

      <div className="auto-actions">
        <button className="primary" disabled={incomplete}>
          <Users size={16} aria-hidden="true" />
          {t("af.turnOn")}
        </button>
      </div>
    </form>
  );
}
