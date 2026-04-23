import { useEffect, useMemo, useRef, useState } from "react";
import {
  BaseBoxShapeUtil,
  Editor,
  FrameShapeUtil,
  HTMLContainer,
  Rectangle2d,
  T,
  Tldraw,
  createShapeId,
  useEditor,
} from "tldraw";
import { useValue } from "@tldraw/state-react";
import type { CSSProperties } from "react";
import type {
  TLBaseShape,
  TLFrameShape,
  TLOnMountHandler,
  TLShapeId,
  TLUiToolsContextType,
} from "tldraw";
import "./App.css";

const CARD_COUNTS = [1000, 2000, 3000, 4000] as const;
const CARD_WIDTH = 320;
const CARD_HEIGHT = 500;
const GRID_GAP_X = 36;
const GRID_GAP_Y = 44;
const GRID_COLUMNS = 8;
const FRAME_ID = createShapeId("product-counter-frame");
const FRAME_WIDTH = 520;
const FRAME_HEIGHT = 720;

type ProductCardShape = TLBaseShape<
  "product-card",
  {
    w: number;
    h: number;
    title: string;
    subtitle: string;
    category: string;
    accent: string;
    price: string;
    originalPrice: string;
    rating: string;
    reviews: string;
    sku: string;
    badge: string;
    inventory: string;
    shipping: string;
    heroLabel: string;
    metrics: [string, string, string];
    specs: [string, string, string, string];
    swatches: [string, string, string, string];
    bars: [number, number, number, number, number, number];
  }
>;

type ProductCardShapePartial = {
  id: TLShapeId;
  type: "product-card";
  x: number;
  y: number;
  props: ProductCardShape["props"];
};

class ProductCardShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = "product-card" as const;

  static override props = {
    w: T.number,
    h: T.number,
    title: T.string,
    subtitle: T.string,
    category: T.string,
    accent: T.string,
    price: T.string,
    originalPrice: T.string,
    rating: T.string,
    reviews: T.string,
    sku: T.string,
    badge: T.string,
    inventory: T.string,
    shipping: T.string,
    heroLabel: T.string,
    metrics: T.arrayOf(T.string),
    specs: T.arrayOf(T.string),
    swatches: T.arrayOf(T.string),
    bars: T.arrayOf(T.number),
  };

  override getDefaultProps(): ProductCardShape["props"] {
    return {
      w: CARD_WIDTH,
      h: CARD_HEIGHT,
      title: "Nimbus Shelf",
      subtitle: "Modular product system",
      category: "Workspace",
      accent: "#2563eb",
      price: "$129",
      originalPrice: "$159",
      rating: "4.8",
      reviews: "184",
      sku: "NMB-001",
      badge: "Top Rated",
      inventory: "Ready to ship",
      shipping: "2-day delivery",
      heroLabel: "Studio finish",
      metrics: ["Carbon neutral", "4 finishes", "11 presets"],
      specs: ["40 cm", "Stackable", "Matte shell", "2.4 kg"],
      swatches: ["#0f172a", "#2563eb", "#f97316", "#10b981"],
      bars: [38, 52, 76, 68, 84, 94],
    };
  }

  override canEdit() {
    return false;
  }

  override canResize() {
    return false;
  }

  override getGeometry(shape: ProductCardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override component(shape: ProductCardShape) {
    return (
      <HTMLContainer className="product-card-shell">
        <ProductCardView shape={shape} />
      </HTMLContainer>
    );
  }

  override indicator(shape: ProductCardShape) {
    return (
      <rect width={shape.props.w} height={shape.props.h} rx={28} ry={28} />
    );
  }
}

class ProductAwareFrameShapeUtil extends FrameShapeUtil {
  override component(shape: TLFrameShape) {
    return (
      <>
        {super.component(shape)}
        <HTMLContainer className="product-counter-shell">
          <FrameCountBadge shape={shape} />
        </HTMLContainer>
      </>
    );
  }
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCarouselImages(shape: ProductCardShape) {
  const frames = ["Front", "Angle", "Detail"] as const;

  return frames.map((frame, index) => {
    const primary = shape.props.swatches[index % shape.props.swatches.length];
    const secondary =
      shape.props.swatches[(index + 1) % shape.props.swatches.length];
    const tertiary =
      shape.props.swatches[(index + 2) % shape.props.swatches.length];
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 192">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="${shape.props.accent}" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
        </defs>
        <rect width="320" height="192" rx="30" fill="url(#bg)" />
        <circle cx="248" cy="46" r="58" fill="rgba(255,255,255,0.12)" />
        <circle cx="82" cy="156" r="74" fill="rgba(255,255,255,0.08)" />
        <g transform="translate(${96 + index * 10},${42 - index * 4}) rotate(${index * 8 - 6})">
          <rect x="0" y="0" width="124" height="88" rx="24" fill="url(#panel)" />
          <rect x="18" y="18" width="88" height="52" rx="18" fill="rgba(255,255,255,0.2)" />
          <circle cx="104" cy="18" r="18" fill="${tertiary}" />
        </g>
        <g fill="white" font-family="Inter, Arial, sans-serif">
          <text x="24" y="28" font-size="12" opacity="0.8">${shape.props.category.toUpperCase()}</text>
          <text x="24" y="158" font-size="26" font-weight="700">${shape.props.title}</text>
          <text x="24" y="176" font-size="13" opacity="0.78">${frame} view · ${shape.props.heroLabel}</text>
        </g>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  });
}

function ProductCardView({ shape }: { shape: ProductCardShape }) {
  const { props } = shape;
  const [activeImage, setActiveImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [compare, setCompare] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const carouselImages = useMemo(() => buildCarouselImages(shape), [shape]);
  const imageLabels = ["Front", "Angle", "Detail"] as const;

  const stepImage = (delta: number) => {
    setActiveImage(
      (current) =>
        (current + delta + carouselImages.length) % carouselImages.length,
    );
  };

  return (
    <article
      className="product-card"
      style={
        {
          "--card-accent": props.accent,
          width: props.w,
          height: props.h,
        } as CSSProperties
      }
    >
      <div className="product-card__hero">
        <div className="product-card__heroGlow" />
        <div className="product-card__badgeRow">
          <span className="product-card__badge">{props.badge}</span>
          <span className="product-card__sku">{props.sku}</span>
        </div>

        <div className="product-card__heroFrame">
          <img
            className="product-card__heroImage"
            src={carouselImages[activeImage]}
            alt={`${props.title} ${imageLabels[activeImage]} view`}
            loading="lazy"
            draggable={false}
          />
          <div className="product-card__heroControls">
            <button
              type="button"
              className="product-card__carouselButton"
              aria-label={`Previous ${props.title} image`}
              onClick={() => stepImage(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="product-card__carouselButton"
              aria-label={`Next ${props.title} image`}
              onClick={() => stepImage(1)}
            >
              ›
            </button>
          </div>
          <div className="product-card__heroActions">
            <button
              type="button"
              className={`product-card__toggle ${isSaved ? "is-active" : ""}`}
              onClick={() => setIsSaved((value) => !value)}
            >
              {isSaved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              className={`product-card__toggle ${compare ? "is-active" : ""}`}
              onClick={() => setCompare((value) => !value)}
            >
              {compare ? "Comparing" : "Compare"}
            </button>
          </div>
          <div className="product-card__heroLabel">
            {imageLabels[activeImage]} · {props.heroLabel}
          </div>
        </div>

        <div
          className="product-card__carouselDots"
          role="tablist"
          aria-label={`${props.title} images`}
        >
          {carouselImages.map((_, index) => (
            <button
              key={`${props.sku}-slide-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeImage}
              className={index === activeImage ? "is-active" : undefined}
              onClick={() => setActiveImage(index)}
            >
              <span className="sr-only">{imageLabels[index]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="product-card__body">
        <div className="product-card__heading">
          <p className="product-card__category">{props.category}</p>
          <h3>{props.title}</h3>
          <p className="product-card__subtitle">{props.subtitle}</p>
        </div>

        <div className="product-card__ratingRow">
          <div className="product-card__stars" aria-hidden="true">
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
            <span>★</span>
          </div>
          <span>
            {props.rating} · {props.reviews} reviews
          </span>
        </div>

        <div className="product-card__metrics">
          {props.metrics.map((metric) => (
            <span key={metric} className="product-card__metricPill">
              {metric}
            </span>
          ))}
        </div>

        <div className="product-card__specGrid">
          {props.specs.map((spec) => (
            <div key={spec} className="product-card__specCell">
              {spec}
            </div>
          ))}
        </div>

        <div className="product-card__swatches">
          {props.swatches.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className="product-card__swatch"
              style={{ background: swatch }}
              aria-label={`Preview finish ${swatch}`}
              onClick={() =>
                setActiveImage(
                  (current) => (current + 1) % carouselImages.length,
                )
              }
            />
          ))}
          <span className="product-card__inventory">{props.inventory}</span>
        </div>

        <div className="product-card__sparkline" aria-hidden="true">
          {props.bars.map((height, index) => (
            <span
              key={`${props.sku}-${index}`}
              className="product-card__sparkBar"
              style={{ height }}
            />
          ))}
        </div>

        <div className="product-card__footer">
          <div>
            <div className="product-card__priceRow">
              <strong>{props.price}</strong>
              <span>{props.originalPrice}</span>
            </div>
            <p className="product-card__shipping">{props.shipping}</p>
          </div>

          <div className="product-card__ctaCluster">
            <div
              className="product-card__quantity"
              aria-label="Quantity selector"
            >
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label={`Decrease quantity for ${props.title}`}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(9, value + 1))}
                aria-label={`Increase quantity for ${props.title}`}
              >
                +
              </button>
            </div>
            <button type="button" className="product-card__inspectButton">
              Inspect
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FrameCountBadge({ shape }: { shape: TLFrameShape }) {
  const editor = useEditor();

  const cardCount = useValue(
    `product-counter-${shape.id}`,
    () => {
      const frameBounds = editor.getShapePageBounds(shape.id);
      if (!frameBounds) return 0;

      const containedIds = new Set(
        editor
          .getSortedChildIdsForParent(shape.id)
          .map(
            (id) =>
              editor.getShape(id) as
                | { id: TLShapeId; type: string }
                | undefined,
          )
          .filter((candidate): candidate is { id: TLShapeId; type: string } =>
            Boolean(candidate),
          )
          .filter((candidate) => candidate.type === "product-card")
          .map((candidate) => candidate.id),
      );

      (editor.getCurrentPageShapes() as Array<{ id: TLShapeId; type: string }>)
        .filter((candidate) => candidate.type === "product-card")
        .filter((candidate) => {
          const bounds = editor.getShapePageBounds(candidate.id);
          if (!bounds) return false;

          return (
            bounds.minX >= frameBounds.minX &&
            bounds.maxX <= frameBounds.maxX &&
            bounds.minY >= frameBounds.minY &&
            bounds.maxY <= frameBounds.maxY
          );
        })
        .forEach((candidate) => containedIds.add(candidate.id));

      return containedIds.size;
    },
    [editor, shape.id],
  );

  return (
    <div
      className="product-count-badge"
      style={
        {
          width: shape.props.w,
        } as CSSProperties
      }
    >
      <div className="product-count-badge__pill">
        <span>Products</span>
        <strong>{cardCount.toLocaleString()}</strong>
      </div>
    </div>
  );
}

function buildProductCard(index: number): ProductCardShapePartial {
  const random = mulberry32(index + 1);
  const families = ["Nimbus", "Summit", "Astra", "Harbor", "Drift", "Vector"];
  const categories = [
    "Workspace",
    "Outdoor",
    "Audio",
    "Kitchen",
    "Storage",
    "Travel",
  ];
  const subtitles = [
    "Adaptive layout kit",
    "Premium daily carry",
    "Modular studio system",
    "High-density utility stack",
    "Refined performance build",
    "Multi-surface edition",
  ];
  const badges = ["Top Rated", "Low Return Rate", "Fast Mover", "Limited Drop"];
  const finishes = [
    "Studio finish",
    "Carbon weave",
    "Stone matte",
    "Soft-touch shell",
  ];
  const accents = [
    "#2563eb",
    "#0f766e",
    "#ea580c",
    "#7c3aed",
    "#db2777",
    "#0891b2",
  ];
  const swatchSets: ProductCardShape["props"]["swatches"][] = [
    ["#111827", "#2563eb", "#f97316", "#10b981"],
    ["#172554", "#0891b2", "#22c55e", "#fde047"],
    ["#3f3f46", "#8b5cf6", "#ec4899", "#fb7185"],
    ["#1f2937", "#0f766e", "#84cc16", "#f59e0b"],
  ];

  const family = families[index % families.length];
  const category = categories[Math.floor(random() * categories.length)];
  const title = `${family} ${["Deck", "Shelf", "Pack", "Hub", "Dock", "Panel"][index % 6]}`;
  const priceValue = 79 + Math.floor(random() * 240);
  const rating = (4.2 + random() * 0.7).toFixed(1);
  const reviews = 90 + Math.floor(random() * 900);
  const bars = Array.from(
    { length: 6 },
    () => 30 + Math.round(random() * 74),
  ) as ProductCardShape["props"]["bars"];

  return {
    id: createShapeId(`product-card-${index}`),
    type: "product-card",
    x: (index % GRID_COLUMNS) * (CARD_WIDTH + GRID_GAP_X),
    y: Math.floor(index / GRID_COLUMNS) * (CARD_HEIGHT + GRID_GAP_Y),
    props: {
      w: CARD_WIDTH,
      h: CARD_HEIGHT,
      title,
      subtitle: subtitles[Math.floor(random() * subtitles.length)],
      category,
      accent: accents[index % accents.length],
      price: `$${priceValue}`,
      originalPrice: `$${priceValue + 34 + (index % 7) * 3}`,
      rating,
      reviews: reviews.toLocaleString(),
      sku: `SKU-${String(index + 1).padStart(5, "0")}`,
      badge: badges[Math.floor(random() * badges.length)],
      inventory: `${12 + Math.floor(random() * 64)} units in stock`,
      shipping: `${1 + (index % 3)}-day delivery`,
      heroLabel: finishes[Math.floor(random() * finishes.length)],
      metrics: [
        `${80 + Math.floor(random() * 20)}% sell-through`,
        `${2 + Math.floor(random() * 8)} variants`,
        `${12 + Math.floor(random() * 36)} hr QA`,
      ],
      specs: [
        `${28 + Math.floor(random() * 22)} cm`,
        ["Stackable", "Fold-flat", "Weather sealed", "Tool-free"][index % 4],
        ["Matte shell", "Anodized trim", "Soft knit", "Glass touch"][
          Math.floor(random() * 4)
        ],
        `${(1.2 + random() * 3.8).toFixed(1)} kg`,
      ],
      swatches: swatchSets[index % swatchSets.length],
      bars,
    },
  };
}

function buildCounterFrame(cardCount: number) {
  const rows = Math.ceil(cardCount / GRID_COLUMNS);
  const gridWidth = GRID_COLUMNS * CARD_WIDTH + (GRID_COLUMNS - 1) * GRID_GAP_X;
  const totalGridHeight =
    rows * CARD_HEIGHT + Math.max(0, rows - 1) * GRID_GAP_Y;

  return {
    id: FRAME_ID,
    type: "frame",
    x: gridWidth + 180,
    y: Math.max(120, totalGridHeight * 0.08),
    props: {
      w: FRAME_WIDTH,
      h: FRAME_HEIGHT,
      name: "Product Drop Frame",
      color: "blue",
    },
  };
}

function App() {
  const [cardCount, setCardCount] =
    useState<(typeof CARD_COUNTS)[number]>(3000);
  const [status, setStatus] = useState("Initializing canvas…");
  const [lastRenderMs, setLastRenderMs] = useState<number | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const currentShapeIdsRef = useRef<TLShapeId[]>([]);

  const uiOverrides = useMemo(
    () => ({
      tools: (
        _editor: Editor,
        tools: TLUiToolsContextType,
      ): TLUiToolsContextType => {
        const { frame, ...rest } = tools;
        return frame ? { frame, ...rest } : tools;
      },
    }),
    [],
  );

  const productShapes = useMemo(
    () =>
      Array.from({ length: cardCount }, (_, index) => buildProductCard(index)),
    [cardCount],
  );

  const counterFrame = useMemo(() => buildCounterFrame(cardCount), [cardCount]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const startedAt = performance.now();
    const currentShapeIds = currentShapeIdsRef.current;

    setStatus(`Rendering ${cardCount.toLocaleString()} cards…`);

    if (currentShapeIds.length > 0) {
      editor.deleteShapes(currentShapeIds);
    }

    editor.createShapes(productShapes as any);
    const existingFrame = editor.getShape(FRAME_ID);

    if (!existingFrame) {
      editor.createShape(counterFrame as any);
    }

    editor.selectNone();
    editor.zoomToFit({ animation: { duration: 0 } });

    currentShapeIdsRef.current = productShapes.map((shape) => shape.id);

    const elapsed = performance.now() - startedAt;
    setLastRenderMs(elapsed);
    setStatus(`Rendered ${cardCount.toLocaleString()} cards`);
  }, [cardCount, counterFrame, editorReady, productShapes]);

  const handleMount: TLOnMountHandler = (editor) => {
    editorRef.current = editor;
    setEditorReady(true);
  };

  return (
    <main className="app-shell">
      <section className="header-panel">
        <div className="header-stack">
          <aside className="floating-intro">
            <p className="floating-intro__text">
              A small test for how performant the current open-source tldraw is
              with many shapes. Frames can be created in the toolbar below. Code
              lives here:
              <a
                href="https://github.com/gleasonw/test-tldraw-perf"
                target="_blank"
                rel="noreferrer"
              >
                https://github.com/gleasonw/test-tldraw-perf
              </a>
            </p>
          </aside>

          <div className="floating-controls__panel" id="product-count-panel">
            <p className="floating-controls__label">Add product cards</p>
            <div
              className="segmented-control"
              role="group"
              aria-label="Select card count"
            >
              {CARD_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={count === cardCount ? "is-active" : undefined}
                  onClick={() => {
                    setCardCount(count);
                  }}
                >
                  {count.toLocaleString()}
                </button>
              ))}
            </div>

            <dl className="stats-strip">
              <div>
                <dt>Cards</dt>
                <dd>{cardCount.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Populate</dt>
                <dd>
                  {lastRenderMs ? `${lastRenderMs.toFixed(0)} ms` : "Pending"}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{status}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="canvas-panel">
        <Tldraw
          autoFocus
          initialState="frame"
          onMount={handleMount}
          overrides={uiOverrides}
          shapeUtils={[ProductCardShapeUtil, ProductAwareFrameShapeUtil]}
          className="canvas-panel__editor"
        />
      </section>
    </main>
  );
}

export default App;
