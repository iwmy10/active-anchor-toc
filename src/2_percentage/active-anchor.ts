import {
  createRootMarginRectDiv,
  getLinkId,
  setScrollPaddingTop,
} from "../utils";

const rootMarginTopPercentage = 15;
const rootMarginBottomPercentage = 100 - rootMarginTopPercentage;

const rootMarginRect = {
  top: `${rootMarginTopPercentage}%`,
  bottom: `${rootMarginBottomPercentage}%`,
};

const scrollPaddingTopOffset = "10px";
const scrollPaddingTop = `calc(${rootMarginTopPercentage}% - ${scrollPaddingTopOffset})`;

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
  const observer = new IntersectionObserver(
    (entries) => {
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
    },
    {
      rootMargin: `-${rootMarginRect.top} 0px -${rootMarginRect.bottom}`,
      threshold: 0,
    }
  );
  observedElements.forEach((observedElement) => {
    observer.observe(observedElement);
  });
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
    const id = element.id;
    if (id && headingIds.includes(id)) {
      currentHeadingId = id;
    }
    idByObservedElement.set(element, currentHeadingId);
  });

  return idByObservedElement;
}

window.addEventListener("load", () => {
  activeAnchor();
  createRootMarginRectDiv(rootMarginRect);
  setScrollPaddingTop(scrollPaddingTop);
});
