import { NewsletterPreview } from "./newsletter-preview";

/* The left column: what the workspace is, then a demonstration of it.

   Every claim here maps to something the app actually does — drafting from a
   theme, editing blocks in place, and sending by email or phone alert. */
export function HeroContent() {
  return (
    <>
      <p className="lp-eyebrow lp-rise lp-d1">YOUR NEWSLETTER WORKSPACE</p>

      <h1 className="lp-headline lp-rise lp-d2">
        Your ideas.
        <br />
        <span className="lp-grad">Beautiful newsletters.</span>
        <br />
        Ready to send.
      </h1>

      <p className="lp-lede lp-rise lp-d2">
        Turn a theme into a polished newsletter. Refine every detail, then share
        it with your audience — all from one workspace.
      </p>

      <NewsletterPreview />
    </>
  );
}
