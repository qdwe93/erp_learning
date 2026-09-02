# ERP 운영 학습 가이드 — 작성용 소스

SAP Private Cloud 운영자가 **자기 모듈의 SAP 공식 교육을 찾는** 참조 사이트다.
커리큘럼이 아니다. 필요한 것만 골라 쓰는 용도다.

HTML에는 회사의 프로젝트 현황, 대상 릴리스, 물량, 계정 수, 내부 시스템 구성, 적용 범위, 의사결정 내용을 넣지 않는다.

## 구성

```
/
├─ index.html              정문. 모듈 카드 + 검색
├─ modules/*.html          모듈별 상세 14개
├─ custom-reports.html     ABAP · CDS · RAP 공식 학습경로
├─ conversion.html         System Conversion 공식 학습자료
├─ access.html             이용 채널 · 교재 · 실습 · 한국어 안내
├─ catalog.html            영어·한국어 전체 Catalog 검색
├─ start.html              시작하기
├─ assets/css/site.css     스타일 1개
├─ assets/js/site.js       모바일 내비 + 모듈 검색 (초성 검색 지원)
├─ assets/js/catalog.js    전체 Catalog 검색·필터
├─ assets/js/catalog-data.js  XML에서 생성되는 Catalog 데이터
├─ assets/img/NEEDED.md    필요한 이미지 명세
├─ design.md               색상 · 타이포 · 레이아웃 규정
└─ build.mjs               HTML 생성기 (배포에는 불필요)
```

배포된 HTML에는 프레임워크·CDN 의존성이 **없다.** 폰트는 시스템 폰트만 쓴다.
모든 경로가 상대경로라 하위 경로 배포에서도 그대로 동작한다.

## 내용 수정

HTML을 직접 고치지 말고 `build.mjs`의 데이터를 고친 뒤 다시 생성한다.

```bash
node build.mjs
```

모듈 구성은 `build.mjs` 상단의 `MODULES` / `ABAP_CHAIN` 배열에 있다. 과정 코드와 연결된 최신 제목·시간·레벨·설명·공식 URL·locale variant·Practice System·Certification은 빌드 시 `../sap_private_cloud_training/catalogs/sap_learning_catalog_selected.csv`에서 읽는다. 전체 Catalog 페이지는 `../sap_private_cloud_training/catalogs/sap_learning_catalog_full.xml`의 영어 기본 항목과 한국어 variant를 사용한다.

## 배포

공개 배포 저장소는 <https://github.com/qdwe93/erp_learning> 이다.
**사이트 내용이 저장소 루트에 있다.** (`html/` 폴더를 그대로 올린 것이 아니라 그 안의 파일을 루트로 올렸다.)

> **private 저장소이므로 GitHub Pages는 무료 플랜에서 동작하지 않는다.**
> GitHub Pages는 private 저장소에서 Pro / Team / Enterprise 플랜을 요구한다.
> 무료 플랜이라면 아래 **Cloudflare Pages**를 쓴다. Cloudflare Pages는 private 저장소를 무료로 지원한다.

### Cloudflare Pages (private 저장소 권장)

Workers &amp; Pages → Create → Pages → Connect to Git 에서 이 저장소를 연결한 뒤:

| 설정 | 값 |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Build command | *(비움)* |
| Build output directory | `/` |

빌드 단계가 없으므로 배포가 즉시 끝난다. 이후 `git push`할 때마다 자동 재배포된다.

### GitHub Pages (유료 플랜이거나 public으로 전환한 경우)

저장소 **Settings → Pages** 에서:

| 설정 | 값 |
|---|---|
| Source | `Deploy from a branch` |
| Branch | `main` |
| Folder | `/ (root)` |

GitHub Pages는 임의 폴더를 지원하지 않는다. `/ (root)` 또는 `/docs` 둘 중 하나다.
그래서 사이트 파일을 루트에 두었다. `.nojekyll`이 있어 Jekyll 처리를 건너뛴다.

배포 주소: `https://qdwe93.github.io/next_erp_learning_path/`

### 갱신

```bash
node build.mjs
git add -A && git commit -m "내용 갱신" && git push
```

### 로컬 확인

```bash
npx serve html
```

`file://`로 직접 열어도 대부분 동작하지만, 상대경로 확인은 서버로 하는 편이 정확하다.

## 데이터 기준

과정 정보는 **2026-09-02** 기준 `learning.sap.com` 공식 페이지와 SAP Learning Hub에서 내려받은 공식 Catalog XML을 사용했다.

- `learning.sap.com` Direct Link가 있으면 `SAP Learning에서도 이용 가능`, 없으면 `SAP Learning Hub 전용`으로 분류한다.
- 이 사이트에 정리한 모든 교육과정의 교재는 SAP Learning Hub에서 다운로드 가능한 것으로 사용자가 확인했다.
- Catalog의 실습 링크 존재와 실제 등록 성공은 구분한다. 확인하지 않은 항목은 `미확인`, 없는 것은 `해당 없음`으로 표시한다.

원본 데이터와 근거는 저장소의 `sap_private_cloud_training/` 아래에 있다.
