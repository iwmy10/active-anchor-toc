import {
  createRootMarginRectDiv,
  getLinkId,
  setScrollPaddingTop,
} from "../utils";

const stickyHeaderHeight = 56;
const rootMarginTop = stickyHeaderHeight + 10;

function getRootMarginBottom() {
  return document.documentElement.clientHeight - (rootMarginTop + 1);
}

const rootMarginRect = () => ({
  top: `${rootMarginTop}px`,
  bottom: `${getRootMarginBottom()}px`,
});

const scrollPaddingTop = `${rootMarginTop - 1}px`;

const activeAnchor = () => {
  const tocContainer =
    document.querySelector<HTMLElementTagNameMap["nav"]>("#toc-container");
  const article =
    document.querySelector<HTMLElementTagNameMap["article"]>("article");

  if (!tocContainer || !article) return;

  const observedElements = [
    ...article.querySelectorAll(
      "h1, h1 ~ *, h2, h2 ~ *, h3, h3 ~ *, h4, h4 ~ *, h5, h5 ~ *, h6, h6 ~ *"
    ),
  ];

  const anchorLinks = [
    ...tocContainer.querySelectorAll<HTMLAnchorElement>("a[href^='#'"),
  ];

  const referencedIds = anchorLinks.map((anchorLink) => getLinkId(anchorLink));

  // 見出しのidにelementでアクセスするためのMap
  const idByObservedElement = createHeadingIdByObservedElement({
    observedElements,
    headingIds: referencedIds,
  });

  let activeSectionHeadingId = "";
  let observer: IntersectionObserver | undefined;

  const intersectionObserverCallback: IntersectionObserverCallback = (
    entries
  ) => {
    const intersectingElement = entries.find(
      (heading) => heading.isIntersecting
    );
    if (!intersectingElement) return;

    activeSectionHeadingId =
      idByObservedElement.get(intersectingElement.target) ?? "";

    // // TOCのaタグの状態を更新
    anchorLinks.forEach((anchorLink) => {
      if (getLinkId(anchorLink) === activeSectionHeadingId) {
        anchorLink.setAttribute("aria-current", "true");
        anchorLink.classList.add("text-blue-600");
      } else {
        anchorLink.removeAttribute("aria-current");
        anchorLink.classList.remove("text-blue-600");
      }
    });
  };

  const observe = () => {
    if (observer) observer.disconnect();
    const rootMargin = rootMarginRect();
    observer = new IntersectionObserver(intersectionObserverCallback, {
      rootMargin: `-${rootMargin.top} 0px -${rootMargin.bottom}`,
    });
    observedElements.forEach((observedElement) => {
      observer!.observe(observedElement);
    });
  };
  observe();

  onResizeThrottled(observe);
};

/**
 * 監視対象の要素をキーとし、その要素が紐づく見出し要素のidを値とするmapを返す。
 */
function createHeadingIdByObservedElement({
  observedElements,
  headingIds,
}: {
  /** 監視対象の要素リスト */
  observedElements: Element[];
  /** 見出しのidリスト */
  headingIds: string[];
}) {
  const idByObservedElement = new Map<Element, string>();

  let currentHeadingId: string;
  observedElements.forEach((element) => {
    const id = encodeURI(element.id);
    if (id && headingIds.includes(id)) {
      currentHeadingId = id;
    }
    idByObservedElement.set(element, currentHeadingId);
  });

  return idByObservedElement;
}

const onIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
/** resizeイベントを200msごとに間引く */
function onResizeThrottled(cb: () => void) {
  let timeout: NodeJS.Timeout;
  window.addEventListener("resize", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => onIdle(cb), 200);
  });
}

window.addEventListener("load", () => {
  activeAnchor();

  const { updatePosition } = createRootMarginRectDiv(rootMarginRect());
  onResizeThrottled(() => updatePosition(rootMarginRect()));

  setScrollPaddingTop(scrollPaddingTop);
});
