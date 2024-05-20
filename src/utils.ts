/** ページ内リンクを持つaタグから、リンク先の要素のidを取得する */
export function getLinkId(a: HTMLAnchorElement) {
  return a.hash.replace("#", "");
}

export function createRootMarginRectDiv({
  top,
  bottom,
}: {
  top: string;
  bottom: string;
}) {
  const div = document.createElement("div");
  div.classList.add(
    "fixed",
    "left-0",
    "right-0",
    "min-h-1",
    "outline",
    "outline-4",
    "-outline-offset-4",
    "outline-red-400",
    "pointer-events-none"
  );
  div.style.top = top;
  div.style.bottom = bottom;

  document.body.appendChild(div);
}

export function setScrollPaddingTop(value: string) {
  document.documentElement.style.scrollPaddingTop = value;
}
