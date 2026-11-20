import SectionHeading from "../components/SectionHeading";
import { Label } from "../components/Widget";
import { FillUnderline, LinkArrow } from "../components/LinkDecor";
import { track } from "../lib/analytics";
import { contact, contactIntro } from "../data/content";

// The Contact frame only contains its title in Figma; the details come from the CV. (The LinkedIn
// recommendations have their own section, after Case Studies.)
export default function Contact() {
  return (
    <section
      id="contact"
      className="min-h-[480px] pt-[15px] pb-28 lg:min-h-[862px]"
    >
      <div className="site-container">
        <SectionHeading>Contact</SectionHeading>
        <div className="relative flex flex-col gap-3 pt-10">
          <p className="text-[clamp(24px,3vw,34px)] leading-[1.25] tracking-[-0.01em] text-white text-balance">{contactIntro.invitation}</p>
          <p className="text-[15px] leading-6 tracking-[0.01em] text-light-gray">{contactIntro.availability}</p>
        </div>
        <div className="relative flex flex-col gap-14 pt-10 lg:flex-row lg:items-start lg:gap-16">
          <ul className="flex flex-col gap-10 lg:w-[360px] lg:shrink-0">
            {contact.map((item) => {
              // web links and the CV PDF open in a new tab
              const external = item.href.startsWith("http") || item.href.endsWith(".pdf");
              return (
                <li key={item.label} className="flex flex-col gap-2">
                  <Label>{item.label}</Label>
                  <a
                    href={item.href}
                    onClick={() => track("contact-click", { link: item.label })}
                    {...(external && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                    // the case studies' "Read more" style, in white and a little larger
                    className={`group inline-flex w-fit flex-col pt-1 text-white ${external ? "cursor-new-window" : ""}`}
                  >
                    <span className="inline-flex items-center gap-1.5 text-lg leading-[1.4] font-semibold tracking-[0.08em] uppercase">
                      {item.text}
                      <LinkArrow className="-my-1 size-[1.25em]" />
                    </span>
                    <FillUnderline />
                    {external && (
                      <span className="sr-only">(opens in a new tab)</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
