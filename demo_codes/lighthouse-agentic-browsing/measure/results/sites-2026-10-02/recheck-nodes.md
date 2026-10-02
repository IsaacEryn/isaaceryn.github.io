# 실패 요소 재확인 (검토 중 재측정, 2026-10-02)

원측정(`run1~3.json`)은 규칙 이름만 기록하고 실패한 요소를 남기지 않았습니다. 글의 「출처는 두 갈래」(슬라이드 라이브러리 기본값 / 탭·버튼에 직접 붙인 ARIA)와 05 절의 Previous slide 사례, 이 블로그의 숨은 실패 원인은 아래 값에 근거합니다.

- 측정: 같은 설정(Lighthouse 13.5.0, 데스크톱, 접근성·에이전트형 브라우징 카테고리)으로 원측정 약 50분 뒤 한 번 더 잰 결과에서 실패 요소의 선택자와 앞부분 스니펫만 옮겼습니다. 사이트마다 규칙별로 처음 두 개까지 적었습니다
- 시각: 아래 각 사이트 제목 옆(KST). 이 값은 원측정과 시각이 달라 요소가 바뀌었을 수 있습니다
- 정부24는 이때도 접속 차단 안내 페이지로 넘어가 뺐고, 네이버·11번가는 트리 감사에 걸린 규칙이 없어 뺐습니다

## 국민건강보험공단 (15:15, https://www.nhis.or.kr/nhis/index.do)

- `aria-allowed-attr` — 실패 요소 4개
  - `div.tab-area > div.tab > ul > li#newsTab01` · `<li id="newsTab01" aria-selected="true" aria-controls="newsTabpanel01" class="active">`
  - `div.tab-area > div.tab > ul > li#newsTab02` · `<li id="newsTab02" aria-selected="false" aria-controls="newsTabpanel02">`
- `aria-required-children` — 실패 요소 1개
  - `div.in > div.tab-area > div.tab > ul` · `<ul role="tablist">`
- `aria-required-parent` — 실패 요소 2개
  - `div.ui_tabbx > div.section > ul.ui_tab > li.active` · `<li class="active" role="tab" aria-selected="true">`
  - `div.ui_tabbx > div.section > ul.ui_tab > li` · `<li class="" role="tab" aria-selected="false">`

## 국세청 (15:15, https://www.nts.go.kr/)

- `aria-hidden-focus` — 실패 요소 6개
  - `div.bx-wrapper > div.bx-viewport > ul.lst > li` · `<li style="float: left; list-style: none; position: relative; width: 846.5px;" aria-hidden="true">`
  - `div.bx-wrapper > div.bx-viewport > ul.lst > li` · `<li style="float: left; list-style: none; position: relative; width: 846.5px;" aria-hidden="true">`
- `aria-input-field-name` — 실패 요소 1개
  - `div#bannerWrap > div.bannerLst > div.slick-list > div.slick-track` · `<div class="slick-track" role="listbox" style="opacity: 1; width: 0px; transform: translate3d(0px, 0px, 0px);">`

## 서울특별시 (15:15, https://www.seoul.go.kr/main/index.jsp)

- `aria-hidden-focus` — 실패 요소 36개
  - `div.bx-wrapper > div.bx-viewport > ul.hi_slide > li.bx-clone` · `<li style="float: left; list-style: none; position: relative; width: 690px;" class="bx-clone" aria-hidden="true">`
  - `div.bx-wrapper > div.bx-viewport > ul.hi_slide > li` · `<li style="float: left; list-style: none; position: relative; width: 690px;" aria-hidden="true">`

## 한국장애인고용공단 (15:16, https://www.kead.or.kr/)

- `link-name` — 실패 요소 1개
  - `div.body > div > strong > a` · `<a href="">`
- `label-content-name-mismatch` — 실패 요소 4개
  - `div.main-banner > div.banner-slider-nav > div.slider-controller > a.btn-prev` · `<a href="" class="btn-prev" tabindex="0" role="button" aria-label="Previous slide" aria-controls="swiper-wrapper-1e38adb7361df04b">`
  - `div.main-banner > div.banner-slider-nav > div.slider-controller > a.btn-next` · `<a href="" class="btn-next" tabindex="0" role="button" aria-label="Next slide" aria-controls="swiper-wrapper-1e38adb7361df04b">`

## 다음 (15:16, https://www.daum.net/)

- `aria-allowed-attr` — 실패 요소 1개
  - `div.swiper > div.swiper-wrapper > div.swiper-slide > a.link_opt` · `<a href="#none" class="link_opt" role="button" aria-selected="true" data-tiara-action-name="subtab_layeropen">`
- `aria-required-children` — 실패 요소 1개
  - `div.inner_side > div.box_g > div#rank_tabcont0 > div#box_ranking_265` · `<div role="list" data-tiara-action-kind="ClickContent" id="box_ranking_265" class="swiper list_thumb swiper-initialized swiper-horizontal sw`
- `aria-valid-attr-value` — 실패 요소 1개
  - `div.head_tit > div.list_tab > div.item_tab > a.link_item` · `<a href="#none" class="link_item" role="tab" aria-controls="spbox_tabcont1" aria-selected="true" data-tiara-action-name="여성">`
- `link-name` — 실패 요소 1개
  - `div.area_search > div.wrap_search > h1.doc-title > a.link_daum` · `<a class="link_daum" data-tiara-action-name="header_logo" data-tiara-layer="logo" href="https://www.daum.net">`
- `tabindex` — 실패 요소 3개
  - `fieldset > div.box_searchbar > div.inner_searchbar > input#q` · `<input type="text" id="q" name="q" class="tf_keyword" autocomplete="off" autocorrect="off" autocapitalize="off" size="55" tabindex="1" style`
  - `fieldset > div.box_searchbar > div.inner_searchbar > button#VKIBtn` · `<button type="button" id="VKIBtn" class="btn_key" tabindex="3" data-tiara-layer="keyboard">`

## G마켓 (15:18, https://www.gmarket.co.kr/)

- `aria-allowed-attr` — 실패 요소 5개
  - `ul.list__item-tab > li.list-item > div.box__item-header > a.link__tab` · `<a class="link__tab" href="#하나더" role="button" aria-selected="true" aria-controls="하나더" data-spm-anchor-id="gmktpc.home.emartmall.1">`
  - `ul.list__item-tab > li.list-item > div.box__item-header > a.link__tab` · `<a class="link__tab" href="#전단상품" role="button" aria-selected="false" aria-controls="전단상품" data-spm-anchor-id="gmktpc.home.emartmall.9">`
- `link-name` — 실패 요소 12개
  - `ul.swiper-wrapper > li.swiper-slide > div.jsx-7cf39dbc6e4a5007 > a.jsx-7cf39dbc6e4a5007` · `<a href="https://item.gmarket.co.kr/Item?goodsCode=4864876670&amp;utparam-url=%7B%22pvi…" data-montelena-acode="200003549" data-montelena-go`
  - `ul.swiper-wrapper > li.swiper-slide > div.jsx-7cf39dbc6e4a5007 > a.jsx-7cf39dbc6e4a5007` · `<a href="https://item.gmarket.co.kr/Item?goodsCode=4748826347&amp;utparam-url=%7B%22pvi…" data-montelena-acode="200003549" data-montelena-go`
- `label-content-name-mismatch` — 실패 요소 4개
  - `div.box__best > div.box__item > div.box__swiper-container > button.button__prev` · `<button type="button" class="button__prev" data-montelena-acode="200003532" data-montelena-type="left" tabindex="0" role="button" aria-label`
  - `div.box__best > div.box__item > div.box__swiper-container > button.button__next` · `<button type="button" class="button__next" data-montelena-acode="200003532" data-montelena-type="right" tabindex="0" role="button" aria-labe`

## 무신사 (15:18, https://www.musinsa.com/main/musinsa/recommend?gf=A)

- `label-content-name-mismatch` — 실패 요소 5개
  - `nav#commonLayoutGnb > div.gtm-impression-content > div._gnb__area_102dz_20 > a.gtm-click-button` · `<a href="https://www.musinsa.com/snap" aria-label="스냅 페이지로 이동" class="gtm-click-button _gnb__store_102dz_106 undefined" data-index="(not set`
  - `div > div > div > a.UIBannerBigPromotion__Anchor-sc-7eefil-0` · `<a href="https://www.musinsa.com/campaign/bigsale_26chuseok/0#signature_1" aria-label="캠페인 배너" target="_blank" rel="noreferrer" class="UIBan`

## 코드슬로그 (15:26, https://www.codeslog.com/)

- `label-content-name-mismatch` — 실패 요소 10개
  - `body#top > main#main-content > a.post-card-link` · `<a href="https://www.codeslog.com/posts/webaim-million-2026-page-complexity/" class="post-card-link" aria-label="글 이동: WebAIM Million 2026의 `
  - `body#top > main#main-content > a.post-card-link` · `<a href="https://www.codeslog.com/posts/form-ux-validation/" class="post-card-link" aria-label="글 이동: 폼 실시간 검증 제대로 하기: 타이밍부터 aria-invalid까지"`
