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
    ...article.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  ];

  const anchorLinks = [
    ...tocContainer.querySelectorAll<HTMLAnchorElement>("a[href^='#'"),
  ];

  let activeSectionHeadingId = "";
  const observer = new IntersectionObserver(
    (entries) => {
      const intersectingHeading = entries.find(
        (heading) => heading.isIntersecting
      );
      if (!intersectingHeading) return;

      activeSectionHeadingId = intersectingHeading.target.id;
      // // TOCのaタグの状態を更新
      anchorLinks.forEach((anchorLink) => {
        if (getLinkId(anchorLink) === encodeURI(activeSectionHeadingId)) {
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

window.addEventListener("load", () => {
  activeAnchor();
  createRootMarginRectDiv(rootMarginRect);
  setScrollPaddingTop(scrollPaddingTop);
});
