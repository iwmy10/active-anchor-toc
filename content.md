## はじめに

「ページをスクロールすると、現在画面に表示されているセクションがハイライトされる目次」を実装してみます。
ちょうど Qiita の右側にもあるやつですね。
この記事を読んで具体的にどのような目次が作れるのか、GitHub Pages で公開していますので見ていただけると嬉しいです!

### デモ

https://iwmy10.github.io/active-anchor-toc/1_percentage-simple/

## 前提

```html: メインコンテンツ
<article>
  <!-- セクション1 -->
  <h2 id="heading-1">見出し1</h2>
  <p>本文1</p>
  <p>本文2</p>
  <!-- セクション1 ここまで -->

  <!-- セクション2 -->
  <h3 id="heading-2">見出し2</h3>
  <p>本文3</p>
  <p>本文4</p>
  <!-- セクション2 ここまで -->
</article>
```

```html:目次
<ul id="toc-container">
  <!-- 以下のようにアクティブなセクションに対応するaタグにクラスを追加するなどしたい -->
  <li><a href="#heading-1" class="active">見出し1</a></li>
  <li><a href="#heading-2">見出し2</a></li>
</ul>
```

監視対象となる HTML は、`メインコンテンツ` のような形式を想定しています。
監視する要素の表示状態が変化するたびに「アクティブなセクション」を判定し、`目次`の a タグにクラスや attribute を追加・削除したい、というのがこの記事でやりたいことです。

## 1. 「画面上部から `x%` の位置にある見出しをアクティブとする」実装

### `IntersectionObserver` の概要

https://developer.mozilla.org/ja/docs/Web/API/Intersection_Observer_API

まずはこの記事でメインに扱う `IntersectionObserver` について簡単に説明します。

`IntersectionObserver` の一番シンプルな使い方を見てみます。
コンストラクタの第１引数に、監視対象（ターゲット）の表示状態（正確には交差状態と呼ばれています）が変化したときに実行したい処理を記述します。
以下では、ターゲットが表示されているかどうかを `console.log` で出力します。

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    console.log(entry.isIntersecting ? "表示されています" : "非表示です");
    // isIntersecting以外に、以下のプロパティが利用できます
    // entry.boundingClientRect
    // entry.intersectionRatio
    // entry.intersectionRect
    // entry.isIntersecting
    // entry.rootBounds
    // entry.target
    // entry.time
  });
});
```

`IntersectionObserver` をインスタンスを作成したのちに、監視したい要素を `observe()` で登録します。
複数の要素を登録可能です。

```js
const target = document.querySelector("#target");
observer.observe(target);
```

`IntersectionObserver` のコンストラクタには、第 2 引数でオプションを渡すこともできますが上のコードでは指定していません。
未指定の場合、ビューポート（ウィンドウに現在表示されている領域）とターゲットの交差状態を検出しますので、「ターゲットが画面に表示されているかどうか」を検出できます。

### `IntersectionObserver` の検出領域を線状にする

次は `IntersectionObserver` にオプションを渡して、検出領域を変更してみましょう。
`rootMargin` を指定すると、検出領域を拡大・縮小することができます。
CSS の `margin` のような指定が可能です。

top と bottom の組み合わせで、検出領域を矩形ではなく、線状にすることができます。
これを利用し以下のように指定すると、画面の上からちょうど 10%の位置にある要素を検出することができます。

```js
const observer = new IntersectionObserver(callback, {
  rootMargin: "-10% 0 -90%", // 上、左右、下
});
```

### 実装

ここまでの内容を使って、「画面上部から `x%` の位置にある見出しをアクティブとする目次」を実装してみます。

```js
// 監視対象を取得
const observedElements = document
  .querySelector("article")
  .querySelectorAll("h1, h2, h3, h4, h5, h6");

// 目次に含まれるアンカー要素を取得
const anchorLinks = document
  .querySelector("#toc-container")
  .querySelectorAll("a");

// アクティブなセクションの見出しidを保持する変数
let activeSectionHeadingId = "";

const observer = new IntersectionObserver(
  (entries) => {
    const intersectingHeading = entries.find(
      (heading) => heading.isIntersecting
    );
    if (!intersectingHeading) return;

    activeSectionHeadingId = intersectingHeading.target.id;

    // アンカー要素の状態を更新
    anchorLinks.forEach((anchorLink) => {
      if (anchorLink.hash === "#" + activeSectionHeadingId) {
        anchorLink.setAttribute("aria-current", "true");
      } else {
        anchorLink.removeAttribute("aria-current");
      }
    });
  },
  {
    rootMargin: "-10% 0px -90%",
  }
);

observedElements.forEach((observedElement) => {
  observer.observe(observedElement);
});
```

完成です!

デモ: https://iwmy10.github.io/active-anchor-toc/1_percentage-simple/
ソース: https://github.com/iwmy10/active-anchor-toc/blob/main/src/1_percentage-simple/active-anchor.ts

### 【問題点】 スクロールの方向によってアクティブなセクションが切り替わる位置が変わる

この実装では、「上から下に」スクロールした場合と、「下から上に」スクロールした場合とで、アクティブなセクションが切り替わるスクロール位置が異なります。
上のデモページで挙動を確認してもらうと分かると思います。

この実装でも違和感を覚える人は少ないと思うのですが（実際、Qiita の目次はこのような挙動になっています）、次の実装ではこの問題を改善してみます。

## 2. 「画面上部から `x%` の位置にある 『セクション』 をアクティブとする」実装

１つ目の実装で挙げた「スクロールの方向によってアクティブなセクションが切り替わる位置が変わる」問題点を改善します。

ここでは、見出し要素だけでなく、**セクションのコンテンツ要素を監視対象に含める**ことで改善しようと思います。

では実装に入ります。

### 実装

```js
// 監視対象を取得
const observedElements = document
  .querySelector("article")
  .querySelectorAll(
    "h1, h1 ~ *, h2, h2 ~ *, h3, h3 ~ *, h4, h4 ~ *, h5, h5 ~ *, h6, h6 ~ *"
  );
```

[後続兄弟結合子 - CSS: カスケーディングスタイルシート | MDN](https://developer.mozilla.org/ja/docs/Web/CSS/Subsequent-sibling_combinator) を使って、自分より前に見出し要素が存在する `p` タグなどを取得するようにしました。
次のようなマークアップの場合、`h2#heading-1`, `p#content-1`, `p#content-2` が取得されます。

```html
<article>
  <p>このpタグは前方に見出し要素が存在しないので一致しません。</p>
  <h2 id="heading-1">見出し1</h2>
  <p id="content-1">本文1</p>
  <p id="content-2">
    本文2<span>このspanタグは兄弟要素でないので一致しません</span>
  </p>
</article>
```

次に[Map - JavaScript | MDN](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Map)を使って、各要素と、その要素が含まれるセクションの見出し id を対応付けます。
`Object` と異なり、要素自体をキーとして利用できるのが便利ですね。

```ts
const idByObservedElement = new Map<Element, string>();

let currentHeadingId: string;
observedElements.forEach((element) => {
  const id = element.id;
  if (id) {
    currentHeadingId = id;
  }
  idByObservedElement.set(element, currentHeadingId);
});
```

[前提](#前提) のセクションで提示した HTML の場合、以下のような Map オブジェクトが作成されることになります。

| key（要素）                       | value(見出し id) |
| --------------------------------- | ---------------- |
| `<h2 id="heading-1">見出し1</h2>` | heading-1        |
| `<p>本文1</p>`                    | heading-1        |
| `<p>本文2</p>`                    | heading-1        |
| `<h3 id="heading-2">見出し2</h3>` | heading-2        |
| `<p>本文3</p>`                    | heading-2        |
| `<p>本文4</p>`                    | heading-2        |

ここまでで、各監視要素に見出し id が対応付けられたので、あとは [１つ目の実装](#実装) と同じ流れになります。

```js
const observer = new IntersectionObserver(
  (entries) => {
    const intersectingElement = entries.find(
      (heading) => heading.isIntersecting
    );
    if (!intersectingElement) return;

    // ここが変更箇所。要素自体をキーとして、見出しidを取得する
    activeSectionHeadingId =
      idByObservedElement.get(intersectingElement.target) ?? "";

    // 略
  },
  { rootMargin: "-10% 0px -90%" }
);
```

2 つ目の実装、完成です!

デモ: https://iwmy10.github.io/active-anchor-toc/2_percentage/
ソース: https://github.com/iwmy10/active-anchor-toc/blob/main/src/2_percentage/active-anchor.ts

### 【補足】 `querySelectorAll` で取得できる要素の順番について

ここで`querySelectorAll` の戻り値のリストの並び順について補足しておきます。

なぜかというと、 `Map` オブジェクトを使って、各要素とその要素が含まれるセクションの見出し id を対応付ける処理を書きましたが、 `querySelectorAll` で取得できる要素リストがしっかり上から順番にソートされていないとうまく機能しないからです。

結論としては、[ドキュメント順](https://www.w3.org/TR/selectors-api/#document-order)に取得できることが仕様で決まっていました。

> `querySelectorAll()`メソッドは、[コンテキスト ノード](https://www.w3.org/TR/selectors-api/#context-node)の[サブツリー](https://www.w3.org/TR/selectors-api/#subtrees)内の一致する[Element](https://www.w3.org/TR/selectors-api/#element)ノードをすべて含む[ノードリスト](https://www.w3.org/TR/selectors-api/#nodelist)を[ドキュメント順](https://www.w3.org/TR/selectors-api/#document-order)に返さなければなりません。
> \- https://www.w3.org/TR/selectors-api/#findelements を翻訳

ドキュメント順とは「行きがけ順深さ優先探索（depth-first pre-order traversal）」のことだそうです。
詳しくないのですが、html ファイルの 1 行目から、開始タグが出てきた順番で取り出すようなイメージと考えてよさそうです。
以上より、 `querySelectorAll` で要素を取得した後に自前でソートし直す必要はありません。

## 3. 「画面上部から `x px` の位置にあるセクションをアクティブとする」実装 1

ここからは、画面の上から `x %` の位置ではなく、 `x px` の位置に指定する実装をしていきます。
それ以外の機能は同じなのでここで読み終えてもらっても良いと思います笑
興味がある方はもう少しお付き合いいただけると幸いです。

さて `px` での位置指定ですが、画面上部に固定で表示されるヘッダーがあるサイトに最適だと思います。
`%` での位置指定ではウィンドウサイズによってヘッダに判定線が被ってしまうことがあります。

### `IntersectionObserver` で、上部から `x px` の位置に線状に領域を設定するのは難しい

ここまでの２つの実装では、 `rootMargin: "-10% 0px -90%"` を指定することで、画面の上部からちょうど 10%の位置にある要素を検出することができました。
今回は `px` で指定したいので次のようなイメージです。

```js
new IntersectionObserver(callback, {
  rootMargin: "-100px 0 calc(100px - 100vh)", // 上、左右、下
});
```

しかし、`rootMargin`は、 `px` または `%` での指定しか受け入れられないので上のコードはエラーになります。
（Google Chrome では、 `rootMargin must be specified in pixels or percent.` というメッセージが表示されました）

これをなんとかする必要があります。

### 実装

rootMargin で `calc` などが使えない以上、あらかじめ計算しておく必要があります。
以下では、rootMargin の bottom を計算する関数を作り、その実行結果を bottom に代入しています。

```ts
const rootMarginTop = 100;
const rootMarginBottom = () =>
  document.documentElement.clientHeight - rootMarginTop;

const observer = new IntersectionObserver(callback, {
  rootMargin: `-${rootMarginTop}px 0 -${rootMarginBottom()}px`, // 上、左右、下
});
observedElements.forEach((observedElement) => {
  observer.observe(observedElement);
});
```

注意しなければいけないのはウィンドウサイズの変更です。
ウィンドウのサイズを変更されたときに rootMargin がおかしくなってしまうので、resize イベントで `IntersectionObserver` を作り直すようにコードを変更します。

```ts
let observer: IntersectionObserver | undefined;

const observe = () => {
  if (observer) observer.disconnect(); // 監視を停止
  observer = new IntersectionObserver(callback, {
    rootMargin: `-${rootMarginTop}px 0px -${getRootMarginBottom()}px`,
  });
  observedElements.forEach((observedElement) => {
    observer!.observe(observedElement);
  });
};
observe();

window.addEventListener("resize", () => {
  observe();
});
```

3 つ目の実装完成です。
これでウィンドウサイズの変更にも対応できました。

ここでは省略していますが、resize イベントの発火頻度を考慮して observe 関数の実行回数を抑制する処理も書いた方が良いと思います。
以下のデモページとソースコードではその処理も含めています。

デモ: https://iwmy10.github.io/active-anchor-toc/3_px-starlight/
ソース: https://github.com/iwmy10/active-anchor-toc/blob/main/src/3_px-starlight/active-anchor.ts

### 参考

Astro のドキュメントサイト用フレームワーク Starlight の実装を参考にさせていただきました。

https://starlight.astro.build/

https://github.com/withastro/starlight/blob/0e4d04eaade69d6e5e35b1cec3d94063ee0c27ca/packages/starlight/components/TableOfContents/starlight-toc.ts

## 4. 「画面上部から `x px` の位置にあるセクションをアクティブとする」実装 2

おまけで、 「画面上部から `x px` の位置にあるセクションをアクティブとする」実装をもうひとつ紹介します。

`x px` の位置に線状に領域を設定するのではなく、別のアプローチを試します。
`` rootMargin: `-${rootMarginTop}px 0 0` `` として判定領域を面で取るようにします。
判定領域内に複数の監視要素が存在することになりますが、そのうち一番最初の要素を使ってアクティブなセクションを決めるという方法です。

### `IntersectionObserverCallback` では交差状態が変化した要素しか取得できない

この実装方法では、判定領域内にある最初の監視要素が分からなければならないのですが、ひとつ注意があります。
`IntersectionObserverCallback` の引数 `entries` には、まさにそのとき交差状態が変化した要素しか渡されません。
言い換えると、 「領域外 → 領域外」 「領域内 → 領域内」のように状態が変化していない要素は含まれないということです。
すべての監視要素の交差状態を知りたい場合は自前でその情報を保持しておく必要があります。

```ts
const observer = new IntersectionObserver((entries) => {
  console.log(entries.length); // -> 1 (まさに交差状態が変化した要素の数)
  console.log(observedElements.length); // -> 6 (監視要素の合計)
});
```

下のコードでは、 `Map` を使ってすべての監視要素の交差状態を保持するようにしました。

```ts
const observedElements = [
  ...article.querySelectorAll(
    "h1, h1 ~ *, h2, h2 ~ *, h3, h3 ~ *, h4, h4 ~ *, h5, h5 ~ *, h6, h6 ~ *"
  ),
];
// 監視対象の交差状態Map
const visibilityByElement = new Map<Element, boolean>(
  observedElements.map((observedElement) => [observedElement, false])
);

const observer = new IntersectionObserver((entries) => {
  // 交差状態が更新された要素について、visibilityByElementを更新
  entries.forEach((entry) => {
    visibilityByElement.set(entry.target, entry.isIntersecting);
  });
});
```

### 実装

```ts
const rootMarginTop = 100;

const observer = new IntersectionObserver(
  (entries) => {
    // 交差状態が更新された要素について、visibilityByElementを更新
    entries.forEach((entry) => {
      visibilityByElement.set(entry.target, entry.isIntersecting);
    });
    // 判定領域内にある最初の監視要素を取得する
    const firstVisibleElement = [...visibilityByElement]
      .filter(([, value]) => value)
      .map(([key]) => key)[0] as Element | undefined;

    const activeSectionHeadingId = firstVisibleElement
      ? idByObservedElement.get(firstVisibleElement) ?? ""
      : "";

    // 略
  },
  {
    rootMargin: `-${rootMarginTop}px 0px 0px`,
    threshold: [0.0, 1.0],
  }
);
```

最後の実装、完成です!

デモ: https://iwmy10.github.io/active-anchor-toc/4_px-mdn/
ソース: https://github.com/iwmy10/active-anchor-toc/blob/main/src/4_px-mdn/active-anchor.ts

### 参考

MDN の実装を参考にさせていただきました。

https://developer.mozilla.org/ja/docs/Web

https://github.com/mdn/yari/blob/13c468dc6d0dfde86ff67ce9d6cdeec1e2b94702/client/src/document/organisms/toc/index.tsx

## おわりに

初めての記事投稿です。
記事にまとめるの難しいなあとか、これ需要あるのか…?とか思いながらなんとか投稿ボタンを押すところまでたどり着きました。

少しでも参考になれば幸いです。
あと、「いいね」ボタン押していただけると嬉しいです!
ここまで見てくださった方、ありがとうございます!
