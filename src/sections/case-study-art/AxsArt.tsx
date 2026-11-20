import glow from "../../assets/case-studies/axs-glow.svg";
// The AXS deck's cover image (1056×1128, shown at half size so it stays sharp on high-resolution screens)
import hero from "../../assets/case-studies/axs/hero.webp";

// Figma: AXS 2 > Ellipse 2345 (glow, rotation from Figma) + the order emails, e-ticket and mobile ticket
// from the deck's cover, centred in the card's crop (520, 140, 660×600)
export default function AxsArt() {
  return (
    <>
      <div className="absolute top-[188.33px] left-[600.57px] flex h-[724.54px] w-[683.97px] items-center justify-center">
        <div className="relative h-[601.17px] w-[542.87px] flex-none rotate-[15.52deg]">
          <img src={glow} alt="" className="absolute inset-[-23.87%_-26.43%] block size-auto h-[147.74%] w-[152.86%] max-w-none" />
        </div>
      </div>
      <img
        src={hero}
        alt=""
        loading="lazy"
        width={528}
        height={564}
        className="absolute top-[158px] left-[586px] h-[564px] w-[528px] max-w-none drop-shadow-[0_24px_36px_rgb(0_0_0/0.45)]"
      />
    </>
  );
}
