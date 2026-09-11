import { ChannelShowcase } from "./channel-showcase";

/* The left column: what the workspace is, then the channel showcase.

   The copy stops at what the app can actually do — write an issue, shape it,
   and prepare it for channels. Which of those channels really deliver is
   stated on each one rather than implied here. */
export function HeroContent() {
  return (
    <>
      <p className="lp-eyebrow lp-rise lp-d1">CREATE. CONNECT. SHARE.</p>

      <h1 className="lp-headline lp-rise lp-d2">
        Beautiful newsletters.
        <br />
        <span className="lp-grad">Meaningful connections.</span>
      </h1>

      <p className="lp-lede lp-rise lp-d2">
        Create your newsletter, shape your story, and prepare it for the
        channels your audience uses.
      </p>

      <ChannelShowcase />
    </>
  );
}
