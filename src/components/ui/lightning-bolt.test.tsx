import { describe, it, expect } from "vitest";
import { LightningBolt } from "./lightning-bolt";
import { renderToStaticMarkup } from "react-dom/server";

describe("LightningBolt", () => {
  it("renders with default props (medium size, 0.15 opacity)", () => {
    const html = renderToStaticMarkup(<LightningBolt />);
    expect(html).toContain('width="140"');
    expect(html).toContain('height="140"');
    expect(html).toContain("opacity:0.15");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders small size variant", () => {
    const html = renderToStaticMarkup(<LightningBolt size="small" />);
    expect(html).toContain('width="80"');
    expect(html).toContain('height="80"');
  });

  it("renders large size variant at max 200x200", () => {
    const html = renderToStaticMarkup(<LightningBolt size="large" />);
    expect(html).toContain('width="200"');
    expect(html).toContain('height="200"');
  });

  it("clamps opacity to max 0.15 when a higher value is provided", () => {
    const html = renderToStaticMarkup(<LightningBolt opacity={0.5} />);
    expect(html).toContain("opacity:0.15");
    expect(html).not.toContain("opacity:0.5");
  });

  it("allows opacity lower than 0.15", () => {
    const html = renderToStaticMarkup(<LightningBolt opacity={0.08} />);
    expect(html).toContain("opacity:0.08");
  });

  it("applies custom className for positioning", () => {
    const html = renderToStaticMarkup(<LightningBolt className="absolute top-0 right-0" />);
    expect(html).toContain("absolute top-0 right-0");
  });

  it("always includes pointer-events-none class", () => {
    const html = renderToStaticMarkup(<LightningBolt className="absolute" />);
    expect(html).toContain("pointer-events-none");
  });

  it("enforces max dimensions via inline style", () => {
    const html = renderToStaticMarkup(<LightningBolt size="large" />);
    expect(html).toContain("max-width:200px");
    expect(html).toContain("max-height:200px");
  });
});
