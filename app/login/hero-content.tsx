"use client";
import { ChannelShowcase } from "./channel-showcase";
import { useT } from "../i18n";

/* The left column: what the workspace is, then the channel showcase.

   The copy stops at what the app can actually do — write an issue, shape it,
   and prepare it for channels. Which of those channels really deliver is
   stated on each one rather than implied here. */
export function HeroContent() {
  const { t } = useT();
  return (
    <>
      <p className="lp-eyebrow lp-rise lp-d1">{t("lp.eyebrow")}</p>

      <h1 className="lp-headline lp-rise lp-d2">
        {t("lp.headline1")}
        <br />
        <span className="lp-grad">{t("lp.headline2")}</span>
      </h1>

      <p className="lp-lede lp-rise lp-d2">
        {t("lp.lede")}
      </p>

      <ChannelShowcase />
    </>
  );
}
