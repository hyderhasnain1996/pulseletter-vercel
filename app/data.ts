export type Block = {
  id: string;
  type: string;
  text: string;
  /* Image data URL, or an image/video link. Empty until media is added. */
  src?: string;
};
export type Issue = {
  id: string;
  title: string;
  category: string;
  status: string;
  updated: string;
  issue: string;
  blocks: Block[];
  public: boolean;
  /* Visual theme id from themes.ts; falls back to the first theme. */
  theme?: string;
};
export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  group: string;
  subscribed: boolean;
  smsSubscribed?: boolean;
};
export type Campaign = {
  id: string;
  title: string;
  issueId: string;
  channel: string;
  date: string;
  status: string;
  snapshot: Issue;
  recipients: Contact[];
};
export type State = {
  issues: Issue[];
  contacts: Contact[];
  campaigns: Campaign[];
  automations: {
    id: string;
    name: string;
    frequency: string;
    paused: boolean;
  }[];
  brand: string;
};
export const templates = [
  "Research & Innovation",
  "Business Updates",
  "Events & Community",
];
export const initial: State = {
  brand: "PulseLetter",
  issues: templates.map((category, i) => ({
    id: "sample-" + i,
    title: [
      "The next wave of discovery",
      "A little momentum. A big month.",
      "Good things happen together",
    ][i],
    category,
    status: ["Draft", "Ready", "Draft"][i],
    theme: ["classic", "editorial", "meadow"][i],
    updated: "2026-09-11",
    issue: "ISSUE 00" + (i + 1),
    public: false,
    blocks: [
      {
        id: "heading",
        type: "Title",
        text: [
          "Ideas that move us forward.",
          "Forward, together.",
          "Make room for connection.",
        ][i],
      },
      {
        id: "intro",
        type: "Introduction",
        text: "A fresh perspective, a few meaningful updates, and something worth sharing. Welcome to your next issue.",
      },
      {
        id: "story",
        type: "Featured story",
        text: "Your next great story starts here. Select a block to make it your own.",
      },
    ],
  })),
  contacts: [
    {
      id: "c1",
      name: "Alex Morgan",
      email: "alex@example.com",
      phone: "",
      group: "Community",
      subscribed: true,
    },
    {
      id: "c2",
      name: "Jordan Lee",
      email: "jordan@example.com",
      phone: "",
      group: "Research team",
      subscribed: false,
    },
  ],
  campaigns: [],
  automations: [],
};
