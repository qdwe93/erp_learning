/* ============================================================================
   정적 사이트 생성기 — ERP 운영 학습 가이드
   실행: node build.mjs      (html/ 폴더에서)
   배포에는 필요 없다. 생성된 .html 만 올리면 된다.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname);
const L = 'https://learning.sap.com';
const UPDATED = '2026-09-03';
const CATALOG_PATH = path.resolve(ROOT, '..', 'sap_private_cloud_training', 'catalogs', 'sap_learning_catalog_selected.csv');
const FULL_CATALOG_XML_PATH = path.resolve(ROOT, '..', 'sap_private_cloud_training', 'catalogs', 'sap_learning_catalog_full.xml');

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const clean = rows.filter(r => r.some(value => value !== ''));
  const headers = clean.shift() ?? [];
  return clean.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

const CATALOG = fs.existsSync(CATALOG_PATH) ? parseCsv(fs.readFileSync(CATALOG_PATH, 'utf8')) : [];

const decodeXml = value => String(value ?? '')
  .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
  .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const xmlTag = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1]) : '';
};

function parseFullCatalogXml(text) {
  const rows = [];
  for (const match of text.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const block = match[1];
    const id = xmlTag(block, 'Learning_object_ID');
    const localeMatch = id.match(/_([a-z]{2}-[A-Z]{2})$/);
    const sourceLocale = localeMatch?.[1] || 'en';
    const directBlock = block.match(/<Direct_link>([\s\S]*?)<\/Direct_link>/)?.[1] || '';
    rows.push({
      learning_type: xmlTag(block, 'Learning_type'),
      learning_object_id: id,
      source_locale: sourceLocale,
      language: sourceLocale === 'ko-KO' ? 'ko' : (sourceLocale === 'en' ? 'en' : 'other'),
      title: xmlTag(block, 'Title'),
      duration_hours: xmlTag(block, 'Duration_in_hours'),
      video_duration: xmlTag(block, 'Video_duration'),
      level: xmlTag(block, 'Level'),
      role: xmlTag(block, 'Role'),
      product: xmlTag(block, 'LSC_product'),
      product_category: xmlTag(block, 'LSC_product_category'),
      product_subcategory: xmlTag(block, 'LSC_product_subcategory'),
      direct_url: xmlTag(directBlock, 'hyperlink') || xmlTag(directBlock, 'text'),
    });
  }
  return rows;
}

const RAW_FULL_CATALOG = fs.existsSync(FULL_CATALOG_XML_PATH)
  ? parseFullCatalogXml(fs.readFileSync(FULL_CATALOG_XML_PATH, 'utf8'))
  : [];
const FULL_CATALOG = RAW_FULL_CATALOG
  .filter(row => row.language === 'en' || row.language === 'ko')
  .sort((a, b) => (a.language === b.language ? a.title.localeCompare(b.title, 'en') : (a.language === 'ko' ? -1 : 1)));
const FULL_CATALOG_STATS = {
  rows: RAW_FULL_CATALOG.length,
  urlRows: RAW_FULL_CATALOG.filter(row => row.direct_url.startsWith(`${L}/`)).length,
  selectedRows: CATALOG.length,
  enKoRows: FULL_CATALOG.length,
  englishRows: FULL_CATALOG.filter(row => row.language === 'en').length,
  koreanRows: FULL_CATALOG.filter(row => row.language === 'ko').length,
};

/* ---------------------------------------------------------------- 데이터 */
// ko: yes(한국어) | none(영어) | unknown(확인 안 함)
const MODULES = [
  {
    code: 'MM', slug: 'mm', ko: '자재 · 구매', sap: 'Sourcing and Procurement',
    tier: 'journey', mc: 'mm', koStatus: 'partial',
    journey: { id: 'LSC00991', title: 'Implementing SAP S/4HANA Cloud Private Edition, Sourcing and Procurement',
               url: `${L}/learning-journeys/implementing-sap-s-4hana-cloud-private-edition-sourcing-and-procurement`, min: 5592 },
    courses: [
      { id: 'S45000', title: 'Business Processes in SAP S/4HANA Sourcing and Procurement', min: 395, ko: 'none', url: `${L}/courses/business-processes-in-sap-s-4hana-sourcing-and-procurement` },
      { id: 'S4520', title: 'Purchasing in SAP S/4HANA', min: null, ko: 'yes', url: `${L}/courses/purchasing-in-sap-s-4hana` },
      { id: 'S4510', title: 'Inventory management and physical inventory in SAP S/4HANA', min: null, ko: 'unknown' },
      { id: 'S4515', title: 'Invoice Verification in SAP S/4HANA', min: null, ko: 'unknown' },
      { id: 'S45250', title: 'Consumption-based Planning and Forecasting in SAP Cloud ERP', min: 207, ko: 'unknown' },
      { id: 'S4550', title: 'Cross-Functional Customizing in SAP S/4HANA Materials Management', min: null, ko: 'unknown' }
    ],
    notes: ['`S45000` 개요 과정에는 한국어판이 없고 `S4520` 구매 과정에는 있다. 한국어로 시작하려면 `S4520`부터 보는 방법이 있다.']
  },
  {
    code: 'SD', slug: 'sd', ko: '영업', sap: 'Sales',
    tier: 'journey', mc: 'sd', koStatus: 'yes',
    journey: { id: 'LSC00994', title: 'Implementing Sales in SAP S/4HANA Cloud Private Edition',
               url: `${L}/learning-journeys/implementing-sales-in-sap-s-4hana-cloud-private-edition`, min: 4786 },
    courses: [
      { id: 'S46000', title: 'Exploring SAP S/4HANA Sales Essentials', min: 370, ko: 'yes', url: `${L}/courses/exploring-sap-s-4hana-sales-essentials` },
      { id: 'S46001', title: 'Performing the Availability Check', min: 185, ko: 'unknown' },
      { id: 'S46050', title: 'Fundamental customizing in SAP S/4HANA Sales', min: 420, ko: 'unknown' },
      { id: 'S46051', title: 'Defining Outline Agreements in SAP S/4HANA Sales', min: 187, ko: 'unknown' },
      { id: 'S46052', title: 'Configuring Incompletion Procedures in SAP S/4HANA Sales', min: 40, ko: 'unknown' },
      { id: 'S46055', title: 'Customizing Output Control in SAP S/4HANA Sales', min: 224, ko: 'unknown' },
      { id: 'S46056', title: 'Setting up Text Control in SAP S/4HANA Sales', min: 183, ko: 'unknown' },
      { id: 'S46100', title: 'Configuring Delivery Processing in SAP S/4HANA Sales', min: 718, ko: 'unknown' },
      { id: 'S46150', title: 'Configuring Billing in SAP S/4HANA Sales', min: 730, ko: 'unknown' },
      { id: 'S46200', title: 'Configuring Pricing in SAP S/4HANA Sales', min: 856, ko: 'yes', url: `${L}/courses/configuring-pricing-in-sap-s-4hana-sales` }
    ],
    notes: ['확인한 과정 두 개(`S46000`·`S46200`)가 모두 한국어판이 있다. 나머지는 확인하지 않았다.']
  },
  {
    code: 'PP', slug: 'pp', ko: '생산', sap: 'Manufacturing',
    tier: 'journey', mc: 'pp', koStatus: 'yes',
    journey: { id: 'LSC00993', title: 'Implementing Manufacturing in SAP S/4HANA Cloud Private Edition',
               url: `${L}/learning-journeys/implementing-manufacturing-in-sap-s-4hana-cloud-private-edition`, min: 4629 },
    courses: [
      { id: 'S42000', title: 'Discovering the Basics of SAP S/4HANA Manufacturing', min: 120, ko: 'unknown' },
      { id: 'S42010', title: 'Exploring Business Processes in SAP S/4HANA Production Planning', min: 140, ko: 'hub', url: `${L}/courses/exploring-business-processes-in-sap-s-4hana-production-planning` },
      { id: 'S42020', title: 'Exploring Business Processes in SAP S/4HANA Discrete Shopfloor Control', min: 390, ko: 'unknown' },
      { id: 'S42025', title: 'Exploring Business Processes in SAP S/4HANA Process Shopfloor Control', min: 415, ko: 'unknown' },
      { id: 'S42100', title: 'Exploring Basic Data for Manufacturing and Product Management', min: 722, ko: 'unknown' },
      { id: 'S42220', title: 'Exploring Production Planning in SAP S/4HANA', min: 408, ko: 'unknown' },
      { id: 'S42240', title: 'Exploring Advanced Production Planning with SAP S/4HANA PP/DS', min: 889, ko: 'unknown' },
      { id: 'S42300', title: 'Exploring Capacity Planning in SAP S/4HANA', min: 330, ko: 'unknown' },
      { id: 'S4260', title: 'Manage Production Orders in SAP S/4HANA Manufacturing', min: 380, ko: 'yes', url: `${L}/courses/manage-production-orders-in-sap-s-4hana-manufacturing` }
    ],
    notes: ['이산(Discrete)과 프로세스(Process) 생산이 별도 과정이다. 담당 공정에 맞는 쪽만 고르면 된다.']
  },
  {
    code: 'PM', slug: 'pm', ko: '설비보전', sap: 'Asset Management (EAM)',
    tier: 'journey', mc: 'pm', koStatus: 'hub',
    journey: { id: 'LSC00977', title: 'Implementing Asset Management in SAP S/4HANA Cloud Private Edition',
               url: `${L}/learning-journeys/implementing-asset-management-in-sap-s-4hana-cloud-private-edition`, min: 3392 },
    courses: [
      { id: 'S43000', title: 'Exploring Business Processes in SAP S/4HANA Asset Management', min: 560, ko: 'hub', url: `${L}/courses/exploring-business-processes-in-sap-s-4hana-asset-management` },
      { id: 'S43100', title: 'Managing Technical Objects in SAP S/4HANA Asset Management', min: 577, ko: 'unknown' },
      { id: 'S43200', title: 'Exploring Preventive Maintenance in SAP S/4HANA Asset Management', min: 455, ko: 'unknown' },
      { id: 'S43300', title: 'Customizing in SAP S/4HANA Asset Management', min: 670, ko: 'unknown' },
      { id: 'S43400', title: 'Exploring Advanced Functions in Maintenance Processing', min: 185, ko: 'unknown' },
      { id: 'S43410', title: 'Exploring Refurbishment of Spare Parts', min: 120, ko: 'unknown' }
    ],
    warn: '이름이 비슷한 <strong>Asset Accounting(자산회계, FI-AA)</strong>과 전혀 다르다. 설비·기계 유지보수는 여기, 고정자산 감가상각은 FI-AA다.',
    notes: []
  },
  {
    code: 'FI', slug: 'fi', ko: '재무회계', sap: 'Financial Accounting',
    tier: 'journey', mc: 'fi', koStatus: 'none',
    journey: { id: 'LSC00997', title: 'Implementing Financial Accounting in SAP S/4HANA',
               url: `${L}/learning-journeys/implementing-financial-accounting-in-sap-s-4hana`, min: 4677 },
    courses: [
      { id: 'S4F12', title: 'Customizing Core Settings in Financial Accounting in SAP S/4HANA', min: 808, ko: 'unknown' },
      { id: 'S4F13', title: 'Configuring Additional Settings in Financial Accounting in SAP S/4HANA', min: 888, ko: 'none', url: `${L}/courses/configuring-additional-settings-in-financial-accounting-in-sap-s-4hana` },
      { id: 'S4F15', title: 'Configuring the Financial Closing in SAP S/4HANA', min: 833, ko: 'none', url: `${L}/courses/configuring-the-financial-closing-in-sap-s-4hana` },
      { id: 'S4F17', title: 'Configuring Asset Accounting in SAP S/4HANA', min: 1323, ko: 'none', url: `${L}/courses/configuring-asset-accounting-in-sap-s4hana` }
    ],
    warn: '확인한 FI 과정 세 개가 모두 영어(일부 일본어)다. 다만 <strong>`S4F17`의 exercise 가이드에는 한국어판이 있다.</strong> 과정은 영어로 듣고 따라 하는 단계는 한국어 가이드를 쓰는 방법이 가능하다.',
    notes: ['`S4F17` 자산회계는 감가상각 실행·취득 전기·제각 전기를 과정 범위에서 다룬다.']
  },
  {
    code: 'FI-AA', slug: 'fi-aa', ko: '자산회계', sap: 'Asset Accounting',
    tier: 'course', mc: 'aa', koStatus: 'none', parent: 'FI',
    journey: null,
    courses: [
      { id: 'S4F17', title: 'Configuring Asset Accounting in SAP S/4HANA', min: 1323, ko: 'none', url: `${L}/courses/configuring-asset-accounting-in-sap-s4hana` }
    ],
    warn: '<strong>별도 모듈이 아니라 FI 하위다.</strong> 전용 journey가 없고, FI journey <code>LSC00997</code> 안에 과정으로 들어 있다. FI 담당자가 겸하는 경우 FI journey를 열면 이미 포함돼 있다.',
    notes: [
      '설비보전의 <strong>Asset Management(EAM)</strong>와 이름만 비슷하고 전혀 다르다. `LSC00977`로 가면 안 된다.',
      '자산회계만 담당한다면 `S4F17` 하나(1,323분)만 봐도 된다.'
    ]
  },
  {
    code: 'CO', slug: 'co', ko: '관리회계', sap: 'Management Accounting',
    tier: 'journey', mc: 'co', koStatus: 'partial',
    journey: { id: 'LSC00996', title: 'Implementing Management Accounting in SAP S/4HANA',
               url: `${L}/learning-journeys/implementing-management-accounting-in-sap-s-4hana`, min: 6382 },
    courses: [
      { id: 'S4F22', title: 'Cost Center and Internal Order Accounting in SAP S/4HANA', min: 963, ko: 'yes', url: `${L}/courses/cost-center-and-internal-order-accounting-in-sap-s-4hana` },
      { id: 'S4F23', title: 'Product Cost Planning in SAP S/4HANA', min: 1086, ko: 'unknown' },
      { id: 'S4F25', title: 'Cost Object Controlling in SAP S/4HANA', min: 2127, ko: 'unknown' },
      { id: 'S4F28', title: 'Profit Center Accounting in SAP S/4HANA', min: 304, ko: 'unknown' },
      { id: 'S4F29', title: 'Profitability Analysis in SAP S/4HANA', min: 1077, ko: 'unknown' }
    ],
    notes: ['journey 전체가 6,382분으로 가장 길다. 담당 영역(원가·수익성·손익센터)만 골라 듣는 것을 전제로 한다.']
  },
  {
    code: 'EWM', slug: 'ewm', ko: '창고', sap: 'Extended Warehouse Management',
    tier: 'journey', mc: 'ewm', koStatus: 'partial',
    journey: { id: 'LSC00978', title: 'Implementing Extended Warehouse Management in SAP S/4HANA Cloud',
               url: `${L}/learning-journeys/implementing-extended-warehouse-management-in-sap-s-4hana-cloud`, min: 1844 },
    courses: [
      { id: 'S48100', title: 'Exploring Business Processes in SAP EWM for SAP S/4HANA Cloud Private Edition', min: 911, ko: 'none', url: `${L}/courses/exploring-business-processes-in-sap-ewm-for-sap-s-4hana-cloud-private-edition` },
      { id: 'EWM110', title: 'Applying Basic Customizing in SAP S/4HANA EWM', min: 398, ko: 'yes', url: `${L}/courses/basic-customizing-in-sap-s-4hana-ewm` },
      { id: 'EWM115', title: 'Exploring Resource Management in SAP EWM', min: 214, ko: 'unknown' },
      { id: 'EWM120', title: 'Applying Advanced Customizing in SAP S/4HANA EWM', min: 226, ko: 'unknown' }
    ],
    notes: [
      '`S48100`은 Private Edition 전용 과정이고 <strong>임베디드 EWM</strong> 입고 처리를 다룬다. 영어·독일어만 제공한다.',
      '한국어가 필요하면 `EWM110`(기본 커스터마이징, 398분)에 한국어판이 있다.'
    ]
  },
  {
    code: 'TM', slug: 'tm', ko: '운송', sap: 'Transportation Management',
    tier: 'journey', mc: 'tm', koStatus: 'hub',
    journey: { id: 'LSC00982', title: 'Implementing Transportation Management in SAP S/4HANA Cloud',
               url: `${L}/learning-journeys/implementing-transportation-management-in-sap-s-4hana-cloud`, min: 2086 },
    courses: [
      { id: 'S48600', title: 'Exploring Business Processes in SAP S/4HANA, Transportation Management', min: 372, ko: 'hub', url: `${L}/courses/business-processes-in-sap-s-4hana-transportation-management` },
      { id: 'S4TM2', title: 'Applying Planning and Execution in SAP S/4HANA Transportation Management', min: 724, ko: 'unknown' },
      { id: 'S4TM3', title: 'Exploring Charges and Settlement in SAP S/4HANA Transportation Management', min: 710, ko: 'unknown' }
    ],
    notes: [
      '`S48600`의 표시명이 바뀌었다. 예전 이름은 <code>Business Processes in SAP S/4HANA Transportation Management</code>이고 같은 과정이다.',
      '운송 계획·실행·운임 정산이 과정 범위에 들어 있다.'
    ]
  },
  {
    code: 'HR', slug: 'hr', ko: '인사', sap: 'Human Capital Management',
    tier: 'course', mc: 'hr', koStatus: 'yes',
    journey: null,
    courses: [
      { id: 'S4HR05', title: 'Business Processes in SAP HCM on S/4HANA', min: 960, ko: 'yes', url: `${L}/courses/business-processes-in-sap-hcm-on-s-4hana` }
    ],
    warn: '전용 PCE journey가 없다. 온스택 솔루션명은 <code>SAP HCM for SAP S/4HANA</code>이고 과정은 하나뿐이다.',
    notes: [
      '인사정보 유지(PA30)·채용 조치·급여 시뮬레이션·급여 실행까지 과정 범위에서 다룬다.',
      '<strong>급여 결과의 Finance 전기(payroll posting)는 이 과정에 없다.</strong> 해당 업무를 맡는다면 공식 과정으로 채워지지 않는다.'
    ]
  },
  {
    code: 'TR', slug: 'tr', ko: '자금', sap: 'Treasury and working capital management',
    tier: 'course', mc: 'tr', koStatus: 'yes',
    journey: null,
    courses: [
      { id: 'F4011', title: 'Discovering Treasury Management in SAP S/4HANA', min: 100, ko: 'yes', url: `${L}/courses/discovering-treasury-management` }
    ],
    warn: '<strong>SAP 공식 자료가 100분짜리 개요 과정 하나뿐이다.</strong> Cash Management와 Treasury and Risk Management 각각의 구성·운영 과정이 learning.sap.com에 없다.',
    notes: [
      '해당 영역을 깊게 학습하려면 공식 과정과 함께 Help Portal 문서 등 추가 자료를 확인해야 한다.',
      '과정 다섯 개 lesson이 전부 "business benefits 설명" 수준이다. 조작 단계를 따라 하는 내용이 하나도 없다.'
    ]
  },
  {
    code: 'EC-CS', slug: 'group-reporting', ko: '연결결산', sap: 'Group Reporting',
    tier: 'course', mc: 'ec', koStatus: 'hub',
    journey: null,
    courses: [
      { id: 'F9611', title: 'Configuring Group Reporting', min: 895, ko: 'hub', url: `${L}/courses/configuring-group-reporting` },
      { id: 'F9111', title: 'Outlining Consolidation with Group Reporting', min: 87, ko: 'unknown', url: `${L}/courses/outlining-consolidation-with-group-reporting` }
    ],
    warn: '전용 PCE journey가 없다. 설정 중심 과정이며 <strong>내부거래 제거(elimination) 단원과 결산 사이클 리허설이 없다.</strong>',
    notes: [
      '연결단위·계층·재분류·데이터검증·통화환산은 과정 범위에서 다룬다.',
      '실제 연결 사이클을 순서대로 돌려 보는 내용은 공식 과정에 없다.'
    ]
  },
  {
    code: 'CFIN', slug: 'central-finance', ko: 'Central Finance', sap: 'Central Finance',
    tier: 'course', mc: 'tr', koStatus: 'unknown', journey: null,
    courses: [
      { id: 'ES_S4F030', title: 'Optimizing Project Experience with SAP S/4HANA for Central Finance', min: 240, ko: 'unknown' }
    ],
    warn: 'Catalog에서 확인된 과정은 <strong>프로젝트 경험 최적화</strong>를 다루는 4시간 과정 하나다. Central Finance 운영자 전체 경로나 source-system mapping·reconciliation 숙련을 대신하지 않는다.',
    notes: ['기존 Help Portal 자료와 함께 참고용으로만 사용한다. 현재 competency gap은 유지한다.']
  },
  {
    code: 'QM', slug: null, ko: '품질', sap: 'Quality Management',
    tier: 'excluded', mc: 'pp', koStatus: 'unknown', journey: null, courses: [], practice: null,
    reason: '공식 표준 journey LSC00990과 과정이 Catalog에 있지만, 이번 프로그램의 QM은 사내 커스텀 구축 범위라 자동 적용하지 않는다.'
  },
  {
    code: 'PS', slug: null, ko: '프로젝트', sap: 'Enterprise Portfolio and Project Management — Project System',
    tier: 'excluded', mc: 'co', koStatus: 'unknown', journey: null, courses: [], practice: null,
    reason: '공식 표준 journey LSC01042와 과정이 Catalog에 있지만, 이번 프로그램의 PS는 사내 커스텀 구축 범위라 자동 적용하지 않는다.'
  }
];

const ABAP_CHAIN = [
  { id: 'S4D400', title: 'Learning Basic ABAP Programming', min: 1049, ko: 'yes', url: `${L}/courses/basic-abap-programming`, what: 'ABAP 기본 문법, 로컬 클래스, 디버깅' },
  { id: 'S4D401', title: 'Deepening Your ABAP Programming Knowledge', min: 1397, ko: 'yes', url: `${L}/courses/intermediate-abap-programming`, what: 'Code Pushdown(ABAP SQL), 성능 측정, ABAP Unit, ATC' },
  { id: 'S4D430', title: 'Building Data Models with the ABAP Dictionary and ABAP CDS', min: 1257, ko: 'hub', url: `${L}/courses/data-modelling-in-abap-dictionary-and-abap-core-data-services`, what: 'CDS view, association, annotation' },
  { id: 'S4D426', title: 'Practicing Clean Core Extensibility', min: 478, ko: 'yes', url: `${L}/courses/practicing-clean-core-extensibility-for-sap-s-4hana-cloud`, what: 'Clean core, released API, 커스텀 코드 전환 판정' },
  { id: 'S4D437', title: 'Building Transactional Apps with RAP', min: 1222, ko: 'none', url: `${L}/courses/building-transactional-apps-with-the-abap-restful-application-programming-model`, what: 'RAP → OData 서비스 → Fiori Elements' }
];

const MODULE_CERTIFICATION_IDS = {
  MM: ['C_TS452'], SD: ['C_TS462'], PP: ['C_TS422'], PM: ['C_S43'],
  FI: ['C_TS4FI'], 'FI-AA': ['C_TS4FI'], CO: ['C_TS4CO'],
  EWM: ['C_S4EWM'], TM: ['C_S4TM'], HR: ['C_HCMP']
};

/* ------------------------------------------------- 과정 설명 한국어 번역
   SAP 공식 Catalog(sap_learning_catalog_selected.csv)의 영문 description을
   모듈 페이지에 한국어로 표시하기 위한 대응표다. 원문은 각 과정 링크에 있다.
   여기에 없는 ID는 Catalog 영문 설명을 그대로 쓴다. */
const KO_DESC = {
  // Learning Journey
  LSC00991: 'SAP S/4HANA Private Cloud에서 소싱·구매 업무 프로세스를 구축합니다.',
  LSC00994: 'SAP S/4HANA 영업(Sales)의 핵심 기능과 커스터마이징 설정을 다룹니다.',
  LSC00993: 'SAP S/4HANA Cloud Private Edition의 생산 프로세스를 다룹니다. 생산계획, PP/DS 고급 계획, 이산·프로세스 산업의 현장관리를 포함하며, 기준정보 설정부터 생산오더 생성·관리, 능력소요계획, PP/DS 기반 고급 계획까지 이어집니다.',
  LSC00977: 'SAP S/4HANA 설비관리(Asset Management)의 기본 프로세스부터 고급 프로세스까지 깊이 다룹니다.',
  LSC00997: 'SAP S/4HANA Cloud Private Edition의 재무회계 구축 방법을 배우고 인증(Certification)까지 준비합니다.',
  LSC00996: 'SAP S/4HANA Cloud Private Edition의 관리회계 구축 방법을 배우고 인증(Certification)까지 준비합니다.',
  LSC00978: 'SAP S/4HANA의 EWM(창고관리) 구축 방법을 배우고 인증(Certification)까지 준비합니다.',
  LSC00982: 'SAP S/4HANA의 운송관리(TM) 구축 방법을 배우고 인증(Certification)까지 준비합니다.',

  // MM 자재·구매
  S45000: 'SAP S/4HANA 구매 프로세스를 처음 접하는 사람을 위해 구매 사이클의 각 단계를 폭넓게 살펴봅니다. 기본 개념과 주요 업무 프로세스·기능을 다루며, Private Cloud와 On-Premise 배포에 모두 해당합니다.',
  S4520: 'SAP S/4HANA의 구매 처리를 폭넓게 다룹니다. 관련 기준정보와 구매 고유 기능을 설정하고 사용하는 방법을 배웁니다.',
  S4510: 'SAP S/4HANA의 재고관리와 재고실사를 전반적으로, 그리고 깊이 있게 다룹니다.',
  S4515: '외부조달 프로세스의 마지막 단계인 물류 송장검증을 다룹니다. 구매오더에 연결된 송장을 입력하고, 지급을 보류하거나 해제하는 방법을 배웁니다.',
  S45250: 'SAP Cloud ERP의 소비기반 계획(Consumption-Based Planning)을 살펴봅니다.',
  S4550: 'SAP S/4HANA 자재관리의 일반 설정, 조직단위, 기준정보를 구성하는 방법을 배웁니다. 평가·계정결정, 구매, 재고관리의 커스터마이징 설정도 함께 다룹니다.',

  // SD 영업
  S46000: 'SAP S/4HANA 영업의 핵심 프로세스 단계를 직접 수행할 수 있게 합니다.',
  S46001: 'SAP S/4HANA 영업의 핵심 프로세스 단계와 납기확약(ATP) 점검을 수행합니다.',
  S46050: '영업 기본 커스터마이징. 표준 기능과 설정을 회사 업무 요건에 맞게 조정하는 구성 작업을 배웁니다.',
  S46051: '개별계약(Outline Agreement) 정의. 표준 기능과 설정을 회사 업무 요건에 맞게 조정하는 구성 작업을 배웁니다.',
  S46052: '미완료 절차(Incompletion Procedure) 구성. 표준 기능과 설정을 회사 업무 요건에 맞게 조정하는 구성 작업을 배웁니다.',
  S46055: '출력 제어(Output Control) 커스터마이징. 표준 기능과 설정을 회사 업무 요건에 맞게 조정하는 구성 작업을 배웁니다.',
  S46056: '텍스트 제어(Text Control) 설정. 표준 기능과 설정을 회사 업무 요건에 맞게 조정하는 구성 작업을 배웁니다.',
  S46100: 'SAP S/4HANA 납품문서의 기본 구성 설정을 배웁니다. 입고와 출고 프로세스를 모두 다루고 SAP EWM 연계도 함께 살펴봅니다.',
  S46150: 'SAP S/4HANA 청구문서의 기본 구성 설정을 배웁니다. 청구문서를 만드는 여러 방식과 선수금·할부 같은 특수 프로세스도 다룹니다.',
  S46200: 'SAP S/4HANA 영업의 가격결정(Pricing) 기능과 커스터마이징 설정을 소개합니다.',

  // PP 생산
  S42000: 'SAP S/4HANA 생산의 기본 프로세스를 폭넓게 이해합니다.',
  S42010: 'SAP S/4HANA의 계획 기법을 다룹니다. 공급망 계획, 수요관리 전략, 자재소요계획(MRP), 능력 평가를 포함합니다.',
  S42020: 'SAP S/4HANA의 이산(Discrete) 생산 현장관리 핵심 프로세스를 처음 접하는 사람을 위한 과정입니다.',
  S42025: 'SAP S/4HANA에서 프로세스 산업의 현장관리 프로세스를 수행하는 방법을 처음 접하는 사람을 위한 과정입니다.',
  S42100: 'SAP S/4HANA에서 생산·제품 관리에 쓰는 기준정보를 생성하는 방법을 폭넓게 다룹니다.',
  S42220: 'SAP S/4HANA 생산계획의 핵심 기능과 요건을 다룹니다. 수요관리, 계획 전략, 수주생산(MTO)과 재고생산(MTS)을 포함합니다.',
  S42240: 'SAP S/4HANA의 PP/DS(생산계획·상세일정, 임베디드 PP/DS)를 이용한 고급 생산계획을 다룹니다.',
  S42300: '이산 생산의 계획오더·생산오더를 대상으로 하는 SAP S/4HANA 능력소요계획의 기능과 도구를 익힙니다.',
  S4260: 'SAP S/4HANA 생산의 생산오더 생애주기를 소개하고, 생산오더를 실행하는 방법을 설명합니다.',

  // PM 설비보전
  S43000: 'SAP S/4HANA 설비관리(Asset Management)의 핵심 업무 프로세스를 안내합니다.',
  S43100: '기술객체(Technical Object)의 구축과 커스터마이징을 폭넓게 다룹니다. 설비관리 영역에서 필요한 커스터마이징 설정을 수행할 수 있는 수준의 상세 지식을 목표로 하며, 특수 프로세스와 기능도 함께 다룹니다.',
  S43200: '예방보전(Preventive Maintenance)의 구축과 커스터마이징을 폭넓게 다룹니다. 설비관리 영역의 커스터마이징 설정을 수행할 수 있는 수준의 상세 지식을 목표로 합니다.',
  S43300: 'SAP S/4HANA 설비관리의 구축과 커스터마이징 전반을 다룹니다. 필요한 커스터마이징 설정을 수행할 수 있는 수준의 상세 지식을 목표로 합니다.',
  S43400: 'SAP S/4HANA 설비관리의 고급 보전 처리 프로세스를 깊이 다룹니다.',
  S43410: 'SAP S/4HANA 설비관리의 고급 프로세스 가운데 예비품 수리(Refurbishment)를 깊이 다룹니다.',

  // FI 재무회계 · FI-AA 자산회계
  S4F12: '재무회계 업무 프로세스를 설정하는 데 필요한 필수 기반 지식을 익힙니다. 총계정원장, 매입채무, 매출채권 영역의 업무 프로세스를 이해하고 설정할 수 있도록 SAP S/4HANA 재무회계 구축 방법을 다룹니다.',
  S4F13: 'SAP S/4HANA의 매입채무·매출채권 자동화 기능을 설정하고 사용하는 방법을 다룹니다. 자동지급, 자동독촉, 통지문 처리, 전표 예비등록, 특별원장(Special G/L), 데이터 아카이빙의 재무 부분, 검증과 대체를 포함합니다.',
  S4F15: 'SAP S/4HANA의 결산 절차를 사용하고 설정하는 방법을 배웁니다.',
  S4F17: '자산회계의 설정과 프로세스를 전반적으로 다룹니다(UPA 제외).',

  // CO 관리회계
  S4F22: '코스트센터와 내부오더 회계를 설정하고 사용하는 방법을 다룹니다(SAP 원문 기준 SAP S/4HANA Cloud Public Edition). 간접비 관리, 원가 배부, 계획 수립의 기반 지식을 SAP Analytics Cloud를 포함한 도구로 익힙니다.',
  S4F23: 'SAP S/4HANA Cloud Private Edition의 제품원가계획을 전반적으로 다룹니다. 자재 원가추정, 원가계획 설정, 고급 원가추정 기법, 연산품 원가추정과 혼합원가·원자재 원가추정·특별조달키 등 여러 평가 방식을 포함합니다.',
  S4F25: '기본 생산 시나리오와 원가대상 관리(Cost Object Controlling)의 연계를 전반적으로 다룹니다. 예비원가계산·동시원가계산·기말결산 관점에서 대상, 기준정보, 업무 프로세스를 분석합니다.',
  S4F28: '손익센터 회계의 기본 업무 프로세스와 작업을 익힙니다. 전역 설정과 기준정보를 관리하고, SAP S/4HANA Cloud Private Edition의 다른 컴포넌트에서 발생한 실제 전기가 손익센터에 어떻게 반영되는지 이해합니다.',
  S4F29: 'SAP S/4HANA Cloud Private Edition의 수익성분석을 설정하고 사용하는 방법을 다룹니다. 마진분석과 원가기반 CO-PA, 조직·데이터 구조, 기준정보 정합, CO-PA 라인아이템, 계획 연계, 리포트 작성을 포함합니다.',

  // EWM 창고
  S48100: 'SAP EWM(창고관리)의 기본 개념과 전체 구조를 탄탄하게 살펴봅니다.',
  EWM110: 'SAP EWM 구축에 반드시 필요한 필수 설정을 정의하고 지정하는 방법을 다룹니다.',
  EWM115: '웨이브 관리, 리소스와 모바일 기기 설정, 레이아웃 기반 창고 제어(Storage Control) 구성을 배웁니다.',
  EWM120: 'SAP EWM의 더 복잡한 프로세스와 그 설정을 다룹니다.',

  // TM 운송
  S48600: 'SAP TM 구축의 청사진(blueprint) 단계를 준비하거나, 현업 사용자로서 시스템을 사용할 수 있게 합니다.',
  S4TM2: '운송관리 프로젝트의 구축 단계를 준비하거나 컨설턴트로서 시스템을 설정할 수 있게 합니다. 운송 네트워크 구성, 오더·납품의 운송 대상 설정, 화물유닛과 포장, 대화식·자동 계획 시나리오, 외주와 적재 최적화, EWM 연계·출력관리·이벤트 추적을 포함한 운송 실행을 다룹니다.',
  S4TM3: '운송관리 프로젝트의 구축 단계를 준비하거나 컨설턴트로서 시스템을 설정할 수 있게 합니다. 운임 계산에 필요한 기준정보와 설정, 자재관리(MM) 연계 운임 정산, 원 납품 품목으로의 원가 배부, 전략적 운송 소싱 구성을 다룹니다.',

  // HR 인사
  S4HR05: 'SAP HCM for SAP S/4HANA의 대표적인 핵심 인사 업무 프로세스를 전반적으로 살펴봅니다.',

  // TR 자금
  F4011: '효율적인 자금(Treasury) 운영을 위한 기능 범위와 도입 효과를 살펴봅니다.',

  // EC-CS 연결결산
  F9611: '재무 연결결산을 수행하기 위해 Group Reporting을 설정하는 방법을 배웁니다.',
  F9111: 'SAP의 재무 연결결산 업무 프로세스를 처음 살펴보는 과정입니다.',

  // CFIN Central Finance
  ES_S4F030: 'Central Finance 아키텍처와 핵심 기능을 깊이 있게 이해합니다.',
};

const catalogRows = (id, type) => CATALOG.filter(row => row.base_object_id === id && (!type || row.learning_type === type));
const catalogEnglish = (id, type) => catalogRows(id, type).find(row => row.locale === 'en' && row.learning_object_id === id)
  ?? catalogRows(id, type).find(row => row.locale === 'en')
  ?? catalogRows(id, type)[0];
const catalogHasKorean = id => catalogRows(id, 'Standalone course').some(row => row.locale === 'ko-KR');
const minutesFromCatalog = row => row?.duration_hours ? Math.round(Number(row.duration_hours) * 60) : null;
const surfaceForUrl = url => String(url ?? '').startsWith(`${L}/`) ? 'learning' : 'hub';

function enrichCourse(course) {
  const row = catalogEnglish(course.id, 'Standalone course');
  const fallback = {
    ...course,
    description: KO_DESC[course.id] || '',
    ko: course.ko === 'hub' || course.ko === 'catalog' ? 'yes' : course.ko,
    surface: surfaceForUrl(course.url),
    materialDownload: true,
  };
  if (!row) return fallback;
  const hasKorean = catalogHasKorean(course.id);
  const durationRow = row.duration_hours ? row : catalogRows(course.id, 'Standalone course').find(candidate => candidate.duration_hours);
  return {
    ...fallback,
    title: row.title || course.title,
    min: minutesFromCatalog(durationRow) ?? course.min,
    url: row.direct_url || course.url,
    surface: surfaceForUrl(row.direct_url || course.url),
    level: row.level || '',
    description: KO_DESC[course.id] || row.description || '',
    objectives: row.learning_objectives || '',
    ko: hasKorean || course.ko === 'yes' || course.ko === 'hub' || course.ko === 'catalog' ? 'yes' : course.ko,
  };
}

for (const module of MODULES) {
  if (module.journey) {
    const journey = catalogEnglish(module.journey.id, 'Learning Journey');
    if (journey) {
      module.journey = {
        ...module.journey,
        title: journey.title || module.journey.title,
        url: journey.direct_url || module.journey.url,
        min: minutesFromCatalog(journey) ?? module.journey.min,
        level: journey.level || '',
        description: KO_DESC[module.journey.id] || journey.description || '',
        surface: surfaceForUrl(journey.direct_url || module.journey.url),
        materialDownload: true,
      };
    } else {
      module.journey = {
        ...module.journey,
        description: KO_DESC[module.journey.id] || '',
        surface: surfaceForUrl(module.journey.url),
        materialDownload: true,
      };
    }
  }
  module.courses = module.courses.map(enrichCourse);
  module.certifications = (MODULE_CERTIFICATION_IDS[module.code] ?? [])
    .map(id => catalogEnglish(id, 'Certification'))
    .filter(Boolean);
  const localized = module.courses.filter(course => course.ko === 'yes').length;
  if (module.courses.length && localized === module.courses.length) module.koStatus = 'yes';
  else if (localized > 0) module.koStatus = 'partial';
}

for (let i = 0; i < ABAP_CHAIN.length; i += 1) ABAP_CHAIN[i] = enrichCourse(ABAP_CHAIN[i]);

const COMMON_COURSES = [
  { id: 'S4C03', title: 'Implementing SAP S/4HANA Cloud Private Edition', min: 730, ko: 'unknown' },
  { id: 'SL_RISE419', title: 'Introducing RISE with SAP Methodology for SAP Partners and Customers', min: 145, ko: 'unknown' },
].map(enrichCourse);

const PROGRAMME_CERTIFICATIONS = ['C_S4PM2', 'E_S4CPE']
  .map(id => catalogEnglish(id, 'Certification'))
  .filter(Boolean);
const DEVELOPMENT_CERTIFICATIONS = ['C_ABAPD', 'C_FIOAD']
  .map(id => catalogEnglish(id, 'Certification'))
  .filter(Boolean);
const CONVERSION_CERTIFICATIONS = ['E_S4CON']
  .map(id => catalogEnglish(id, 'Certification'))
  .filter(Boolean);

/* ---------------------------------------------------------------- 헬퍼 */
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 백틱 코드만 허용하는 최소 인라인 마크업. 그 외 태그는 데이터에 직접 쓴 것만 통과시킨다.
const md = s => String(s ?? '').replace(/`([^`]+)`/g, '<code>$1</code>');
const mins = m => (m == null ? '—' : m.toLocaleString('en-US'));
const hours = m => { const h = Math.floor(m / 60), r = m % 60; return r ? `${h}시간 ${r}분` : `${h}시간`; };

const KO_LABEL = { yes: '한국어', hub: '한국어', catalog: '한국어', none: '영어', unknown: '미확인', partial: '한국어 일부' };
const KO_CLASS = { yes: 'badge-ko', hub: 'badge-ko', catalog: 'badge-ko', none: 'badge-en', unknown: 'badge-unknown', partial: 'badge-ko-hub' };
const koBadge = k => `<span class="badge ${KO_CLASS[k]}">${KO_LABEL[k]}</span>`;
const surfaceBadge = surface => surface === 'learning'
  ? '<span class="badge badge-learning">SAP Learning에서도 이용 가능</span>'
  : '<span class="badge badge-hub">SAP Learning Hub 전용</span>';
const materialBadge = () => '<span class="badge badge-download">교재 다운로드 가능</span>';
const shortText = (text, max = 180) => {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;
};

const NAV = [
  { href: 'index.html', label: '홈', key: 'home' },
  { href: 'index.html#modules', label: '모듈 과정', key: 'mod' },
  { href: 'custom-reports.html', label: 'ABAP · RAP 학습', key: 'reports' },
  { href: 'conversion.html', label: 'System Conversion', key: 'conv' },
  { href: 'access.html', label: '채널 · 한국어', key: 'access' },
  { href: 'catalog.html', label: '전체 카탈로그', key: 'catalog' }
];

function layout({ title, desc, key, body, prefix = '', bodyClass = '' }) {
  const nav = NAV.map(n =>
    `<a href="${prefix}${n.href}"${n.key === key ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n          ');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light">
<link rel="stylesheet" href="${prefix}assets/css/site.css?v=20260903">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230E306D'/%3E%3Ctext x='16' y='22' font-family='sans-serif' font-size='15' font-weight='bold' fill='white' text-anchor='middle'%3EL%3C/text%3E%3C/svg%3E">
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a href="#main" class="sr-only">본문으로 건너뛰기</a>

<header class="site-header">
  <div class="wrap">
    <nav class="nav" aria-label="주요">
      <a class="brand" href="${prefix}index.html">
        <span class="brand-mark" aria-hidden="true">L</span>
        <span class="brand-text"><b>ERP 운영 학습 가이드</b><span>SAP 공식 과정 &middot; 교재 &middot; 한국어 안내</span></span>
      </a>
      <button class="nav-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false" data-nav-toggle>
        <span></span><span></span><span></span>
      </button>
      <div class="nav-menu" data-nav-menu>
          ${nav}
      </div>
      <a class="btn btn-primary btn-sm nav-cta" href="${prefix}start.html">시작하기</a>
    </nav>
  </div>
</header>

<main id="main">
${body}
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a class="brand" href="${prefix}index.html">
          <span class="brand-mark" aria-hidden="true">L</span>
          <span class="brand-text"><b>ERP 운영 학습 가이드</b><span>SAP 공식 과정 &middot; 교재 &middot; 한국어 안내</span></span>
        </a>
        <p>SAP가 공식으로 제공하는 학습자료를 담당 모듈 기준으로 찾을 수 있게 정리한 참조 사이트입니다. 커리큘럼이 아니며, 필요한 것만 골라 쓰면 됩니다.</p>
      </div>
      <div class="foot-col">
        <b>찾기</b>
        <ul>
          <li><a href="${prefix}index.html#modules">모듈 과정</a></li>
          <li><a href="${prefix}custom-reports.html">ABAP · RAP 학습</a></li>
          <li><a href="${prefix}conversion.html">System Conversion</a></li>
          <li><a href="${prefix}catalog.html">전체 카탈로그</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <b>준비</b>
        <ul>
          <li><a href="${prefix}start.html">시작하기</a></li>
          <li><a href="${prefix}access.html">채널 · 한국어 안내</a></li>
          <li><a href="${prefix}access.html#korean">한국어 제공 현황</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <b>SAP 공식</b>
        <ul>
          <li><a href="${L}" target="_blank" rel="noopener">SAP Learning</a></li>
          <li><a href="https://help.sap.com" target="_blank" rel="noopener">SAP Help Portal</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <p>과정 정보는 <strong>${UPDATED}</strong> 기준 SAP 공식 페이지와 SAP Learning Hub에서 다운로드한 Catalog XML에서 확인했습니다. 확인하지 않은 항목은 &lsquo;미확인&rsquo;으로 표시했습니다.</p>
      <p>비공식 학습 링크 모음이며 SAP SE의 공식 사이트가 아닙니다. SAP 및 관련 제품명은 SAP SE 또는 계열사의 상표입니다.</p>
    </div>
  </div>
</footer>

<script src="${prefix}assets/js/site.js?v=20260903" defer></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- index */
function moduleCard(m) {
  const href = m.slug ? `modules/${m.slug}.html` : null;
  const tierClass = m.tier === 'journey' ? '' : (m.tier === 'course' ? ' tier-course' : ' tier-none');
  const style = `--mc: var(--m-${m.mc}); --mc-ink: var(--m-${m.mc}-ink); --mc-soft: color-mix(in srgb, var(--m-${m.mc}) 12%, white);`;
  const meta = [];
  if (m.tier === 'journey') {
    meta.push(`<span class="badge badge-time">${mins(m.journey.min)}분</span>`);
    meta.push(koBadge(m.koStatus));
  } else if (m.tier === 'course') {
    meta.push(`<span class="badge badge-tier">과정 단위</span>`);
    meta.push(koBadge(m.koStatus));
  } else if (m.tier === 'excluded') {
    meta.push(`<span class="badge badge-none">사내 커스텀 범위</span>`);
  } else {
    meta.push(`<span class="badge badge-none">확인된 과정 없음</span>`);
  }

  const inner = `
      <div class="mod-band" aria-hidden="true"></div>
      <div class="mod-body">
        <div class="mod-top">
          <span class="mod-ico" aria-hidden="true">${esc(m.code)}</span>
          <div>
            <h3>${esc(m.ko)}</h3>
            <span class="mod-code">${m.parent ? esc(m.parent) + ' 하위' : (m.tier === 'journey' ? 'Learning Journey' : (m.tier === 'course' ? '과정 단위' : (m.tier === 'excluded' ? '사내 커스텀 범위' : '공식 과정 미확인')))}</span>
          </div>
        </div>
        <p class="mod-sap">${m.sap ? esc(m.sap) : '<em>공식 과정 미확인</em>'}</p>
        ${!href && m.reason ? `<p style="font-size:12.5px;color:var(--ink-3);margin:0 0 10px">${esc(m.reason)}</p>` : ''}
        <div class="mod-meta">${meta.join('')}</div>
        ${href ? '<div class="mod-arrow">자세히 보기 <span aria-hidden="true">&rarr;</span></div>' : ''}
      </div>`;

  const search = `${m.code} ${m.ko} ${m.sap || ''}`.toLowerCase();
  return href
    ? `<a class="mod-card${tierClass}" style="${style}" href="${href}" data-search="${esc(search)}">${inner}</a>`
    : `<div class="mod-card${tierClass}" style="${style}" data-search="${esc(search)}">${inner}</div>`;
}

function buildIndex() {
  const journeyMods = MODULES.filter(m => m.tier === 'journey');
  const courseMods = MODULES.filter(m => m.tier === 'course');
  const noneMods = MODULES.filter(m => ['none', 'excluded'].includes(m.tier));

  const body = `
<section class="hero">
  <div class="wrap">
    <div class="hero-grid">
      <div>
        <span class="hero-eyebrow">SAP 공식 학습자료를 한곳에서</span>
        <h1>내 모듈에 맞는<br><span class="accent">SAP 공식 교육</span>을 찾습니다</h1>
        <p class="hero-lead">
          익숙한 모듈 코드로 SAP 현재 명칭과 공식 과정을 찾을 수 있게 정리했습니다.
          전체를 들으라는 뜻이 아닙니다. 지금 필요한 것만 골라 쓰면 됩니다.
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#modules">내 모듈 찾기 <span aria-hidden="true">&rarr;</span></a>
          <a class="btn btn-ghost" href="start.html">처음이라면 시작하기</a>
        </div>
      </div>
      <div class="hero-figure">
        <!-- IMAGE SLOT: hero. assets/img/NEEDED.md 참조 -->
        <img src="assets/img/hero.webp" alt="SAP 공식 학습 자료가 모듈, 과정, 교재로 연결되는 구조를 나타낸 일러스트" width="1200" height="900">
      </div>
    </div>

    <div class="strip">
      <div class="strip-item">
        <span class="strip-ico" style="background:rgba(0,114,198,.10);color:#005A9E" aria-hidden="true">1</span>
        <div><b>익숙한 모듈명으로 찾기</b><span>MM &rarr; Sourcing and Procurement처럼 모듈 코드와 SAP 현재 명칭을 함께 보여줍니다</span></div>
      </div>
      <div class="strip-item">
        <span class="strip-ico" style="background:rgba(0,154,147,.11);color:#00726D" aria-hidden="true">2</span>
        <div><b>한국어 제공 표시</b><span>과정마다 한국어판 유무를 표시합니다. 순서를 정하는 정보이지 제외 기준이 아닙니다</span></div>
      </div>
      <div class="strip-item">
        <span class="strip-ico" style="background:rgba(244,119,37,.11);color:#C4581A" aria-hidden="true">3</span>
        <div><b>이용 채널과 교재 확인</b><span>SAP Learning에서도 이용 가능한 과정과 SAP Learning Hub 전용 항목을 구분하고, 교재 다운로드 가능 여부를 표시합니다</span></div>
      </div>
      <div class="strip-item">
        <span class="strip-ico" style="background:rgba(234,0,44,.09);color:#B80023" aria-hidden="true">4</span>
        <div><b>확인 상태를 명시</b><span>아직 확인하지 못한 항목과 확인된 내용을 분명히 구분합니다</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="modules">
  <div class="wrap">
    <div class="sec-head">
      <span class="kicker">모듈 과정</span>
      <h2>담당 모듈을 고르세요</h2>
      <p>모듈 코드나 한글 이름으로 바로 검색할 수 있습니다.</p>
    </div>

    <div class="finder">
      <label class="sr-only" for="modsearch">모듈 검색</label>
      <input id="modsearch" type="search" placeholder="MM, 자재, Sourcing ... 무엇이든 입력" autocomplete="off" data-search-input>
      <span class="finder-ico" aria-hidden="true">&#9906;</span>
      <div class="finder-count" data-search-count aria-live="polite"></div>
    </div>

    <h3 class="sr-only">전용 Learning Journey가 있는 모듈</h3>
    <div class="mod-grid" data-search-scope>
      ${journeyMods.map(moduleCard).join('\n      ')}
    </div>

    <div class="sec-head left" style="margin:56px 0 20px">
      <h2 style="font-size:21px">과정 단위로만 제공되는 영역</h2>
      <p>전용 Learning Journey가 없습니다. 개별 과정으로 접근합니다.</p>
    </div>
    <div class="mod-grid" data-search-scope>
      ${courseMods.map(moduleCard).join('\n      ')}
    </div>

    <div class="sec-head left" style="margin:56px 0 20px">
      <h2 style="font-size:21px">이번 프로그램에서 바로 쓰지 않는 영역</h2>
      <p>표준 SAP 과정이 없거나, 사내 커스텀 구축과 달라 자동 적용하지 않는 영역입니다.</p>
    </div>
    <div class="mod-grid" data-search-scope>
      ${noneMods.map(moduleCard).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section-soft">
  <div class="wrap">
    <div class="banner">
      <div class="banner-inner">
        <div>
          <h2>ABAP · CDS · RAP 공식 학습경로</h2>
          <p>
            ABAP 기초부터 CDS 모델링, Clean Core, RAP 기반 OData 서비스까지
            SAP 공식 과정의 권장 순서를 정리했습니다.
          </p>
          <a class="btn btn-light" href="custom-reports.html">ABAP · RAP 학습경로 보기 <span aria-hidden="true">&rarr;</span></a>
        </div>
        <div class="banner-stats">
          <div class="banner-stat"><b>5개</b><span>ABAP 공식 과정</span></div>
          <div class="banner-stat"><b>4/5</b><span>한국어 제공</span></div>
          <div class="banner-stat"><b>${DEVELOPMENT_CERTIFICATIONS.length}개</b><span>관련 Certification</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head">
      <span class="kicker">다음</span>
      <h2>모듈 외에 확인할 것</h2>
    </div>
    <div class="rel-grid">
      <a class="rel-card" href="conversion.html"><b>System Conversion</b><span>공식 전환 학습경로, 커스터마이징 점검, Clean Core 학습</span></a>
      <a class="rel-card" href="access.html"><b>채널 · 교재 · 한국어</b><span>이용 채널, 교재 다운로드, 한국어 제공 현황</span></a>
      <a class="rel-card" href="catalog.html"><b>전체 카탈로그</b><span>영어·한국어 3,778개 항목 검색과 필터</span></a>
      <a class="rel-card" href="start.html"><b>시작하기</b><span>처음 왔을 때 무엇부터 볼지, 공통 기반 과정, 자기점검</span></a>
    </div>
  </div>
</section>
`;
  return layout({ title: 'SAP Private Cloud 운영 학습 가이드', desc: 'SAP Private Cloud 운영자가 담당 모듈의 SAP 공식 과정과 한국어 제공 여부를 찾는 참조 사이트', key: 'home', body });
}

/* ---------------------------------------------------------------- 모듈 페이지 */
function courseRow(c) {
  const title = c.url ? `<a href="${c.url}" target="_blank" rel="noopener">${esc(c.title)}</a>` : esc(c.title);
  const summary = shortText(c.description || c.objectives, 190);
  return `<tr>
          <td><code>${esc(c.id)}</code></td>
          <td>${title}${summary ? `<br><span style="font-size:12.5px;color:var(--ink-3)">${esc(summary)}</span>` : ''}</td>
          <td class="num">${mins(c.min)}</td>
          <td>${esc(c.level || '—')}</td>
          <td>${koBadge(c.ko)}</td>
          <td>${surfaceBadge(c.surface)}</td>
          <td>${materialBadge()}</td>
        </tr>`;
}

function certificationRow(certification) {
  return `<tr>
            <td><code>${esc(certification.base_object_id)}</code><br><code>${esc(certification.exam_code)}</code></td>
            <td><a href="${certification.direct_url}" target="_blank" rel="noopener">${esc(certification.title)}</a></td>
            <td>${esc(certification.role || '—')}</td>
          </tr>`;
}

function buildModule(m) {
  const style = `--mc: var(--m-${m.mc})`;
  const toc = [];
  if (m.journey) toc.push(['journey', 'Learning Journey']);
  if (m.courses.length) toc.push(['courses', '과정 목록']);
  if (m.certifications?.length) toc.push(['certification', '관련 Certification']);
  if (m.notes && m.notes.length) toc.push(['notes', '알아둘 것']);
  toc.push(['next', '다음']);

  const body = `
<div class="page-top" style="${style}">
  <div class="page-top-band" aria-hidden="true"></div>
  <div class="wrap page-top-inner">
    <div class="crumb"><a href="../index.html">홈</a><span>&rsaquo;</span><a href="../index.html#modules">모듈 과정</a><span>&rsaquo;</span>${esc(m.code)}</div>
    <h1>${esc(m.ko)} <span style="color:var(--ink-3);font-weight:600;font-size:.62em">${esc(m.code)}</span></h1>
    <p class="page-sub">SAP 현재 명칭은 <strong>${esc(m.sap || '해당 없음')}</strong>입니다.${m.parent ? ` ${esc(m.parent)} 하위 영역입니다.` : ''}</p>
    <div class="page-tags">
      ${m.tier === 'journey' ? `<span class="badge badge-time">journey ${mins(m.journey.min)}분 · ${hours(m.journey.min)}</span>` : ''}
      ${m.tier === 'course' ? `<span class="badge badge-tier">과정 단위 제공</span>` : ''}
      ${koBadge(m.koStatus)}
    </div>
  </div>
</div>

<div class="wrap doc">
  <div class="doc-grid">
    <nav class="toc" aria-label="이 페이지 목차">
      <b>이 페이지</b>
      <ul>${toc.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ul>
    </nav>
    <div>
      ${m.warn ? `<div class="note note-warn"><span class="note-title">주의</span>${md(m.warn)}</div>` : ''}

      ${m.journey ? `
      <h2 id="journey">Learning Journey</h2>
      <p>SAP가 이 모듈용으로 묶어 제공하는 공식 경로입니다. 전체를 다 들을 필요는 없습니다.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>공식 명칭</th><th class="num">시간(분)</th><th>레벨</th><th>이용 채널</th><th>교재</th></tr></thead>
          <tbody><tr>
            <td><code>${esc(m.journey.id)}</code></td>
            <td><a href="${m.journey.url}" target="_blank" rel="noopener">${esc(m.journey.title)}</a>${m.journey.description ? `<br><span style="font-size:12.5px;color:var(--ink-3)">${esc(shortText(m.journey.description, 220))}</span>` : ''}</td>
            <td class="num">${mins(m.journey.min)}</td>
            <td>${esc(m.journey.level || '—')}</td>
            <td>${surfaceBadge(m.journey.surface)}</td>
            <td>${materialBadge()}</td>
          </tr></tbody>
        </table>
      </div>
      <div class="note note-quiet">
        이 프로그램은 모듈 과정 전에 <code>${esc(COMMON_COURSES[0].id)}</code> ${esc(COMMON_COURSES[0].title)} (${mins(COMMON_COURSES[0].min)}분)과
        <code>${esc(COMMON_COURSES[1].id)}</code> ${esc(COMMON_COURSES[1].title)} (${mins(COMMON_COURSES[1].min)}분)을 공통 기반으로 사용합니다.
        여러 모듈을 볼 사람은 공통 과정을 한 번만 이수합니다.
      </div>` : ''}

      ${m.courses.length ? `
      <h2 id="courses">과정 목록</h2>
      <p>담당 범위에 해당하는 것만 고르십시오. 시간은 SAP 공식 표시값이고, 설명은 SAP 공식 Catalog 설명을 한국어로 옮긴 것입니다.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>코드</th><th>과정 · 설명</th><th class="num">시간(분)</th><th>레벨</th><th>언어</th><th>이용 채널</th><th>교재</th></tr></thead>
          <tbody>
        ${m.courses.map(courseRow).join('\n        ')}
          </tbody>
        </table>
      </div>
      <p style="font-size:13.5px;color:var(--ink-3)">
        &lsquo;미확인&rsquo;은 한국어가 없다는 뜻이 아니라 이번에 확인하지 않았다는 뜻입니다. 링크가 없는 과정은 공식 주소를 확인하지 못한 것입니다.
        설명 원문은 각 과정 링크에서 확인하십시오.
      </p>` : `
      <h2 id="courses">과정</h2>
      <div class="note note-quiet">${esc(m.reason || 'SAP 공식 과정이 없습니다.')}</div>`}

      ${m.notes && m.notes.length ? `
      <h2 id="notes">알아둘 것</h2>
      <ul>${m.notes.map(n => `<li>${md(n)}</li>`).join('')}</ul>` : ''}

      ${m.certifications?.length ? `
      <h2 id="certification">관련 Certification</h2>
      <p>Catalog에서 이 모듈과 직접 연결된 공식 Certification입니다. 과정 이수와 Certification 취득은 별개이며, 운영 권한이나 사내 자격을 자동으로 부여하지 않습니다.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID · Exam</th><th>공식 Certification</th><th>대상 역할</th></tr></thead>
          <tbody>${m.certifications.map(certificationRow).join('\n          ')}</tbody>
        </table>
      </div>` : ''}

      <h2 id="next">다음</h2>
      <div class="rel-grid">
        <a class="rel-card" href="../custom-reports.html"><b>ABAP · RAP 학습</b><span>CDS 모델링과 RAP 기반 OData 공식 학습경로</span></a>
        <a class="rel-card" href="../access.html"><b>채널 · 한국어</b><span>SAP Learning Hub 접근 방법과 한국어 제공 현황</span></a>
        <a class="rel-card" href="../index.html#modules"><b>다른 모듈</b><span>전체 모듈 목록으로 돌아가기</span></a>
      </div>
    </div>
  </div>
</div>
`;
  return layout({
    title: `${m.ko} (${m.code}) — ERP 운영 학습 가이드`,
    desc: `${m.code} ${m.ko} 담당자를 위한 SAP 공식 과정 목록과 한국어 제공 여부`,
    key: 'mod', body, prefix: '../'
  });
}

/* ---------------------------------------------------------------- 주제 페이지 */
function docPage({ title, sub, key, tags, toc, mc, sections, prefix = '' }) {
  const body = `
<div class="page-top" style="--mc: var(--m-${mc})">
  <div class="page-top-band" aria-hidden="true"></div>
  <div class="wrap page-top-inner">
    <div class="crumb"><a href="${prefix}index.html">홈</a><span>&rsaquo;</span>${esc(title)}</div>
    <h1>${esc(title)}</h1>
    <p class="page-sub">${sub}</p>
    ${tags ? `<div class="page-tags">${tags}</div>` : ''}
  </div>
</div>
<div class="wrap doc">
  <div class="doc-grid">
    <nav class="toc" aria-label="이 페이지 목차">
      <b>이 페이지</b>
      <ul>${toc.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ul>
    </nav>
    <div>${sections}</div>
  </div>
</div>`;
  return { body, key };
}

function buildCustomReports() {
  const chainRows = ABAP_CHAIN.map((c, i) => `<tr>
          <td class="num">${i + 1}</td>
          <td><code>${esc(c.id)}</code></td>
          <td><a href="${c.url}" target="_blank" rel="noopener">${esc(c.title)}</a><br><span style="font-size:13px;color:var(--ink-3)">${esc(c.what)}</span></td>
          <td class="num">${mins(c.min)}</td>
          <td>${koBadge(c.ko)}</td>
          <td>${surfaceBadge(c.surface)}</td>
          <td>${materialBadge()}</td>
        </tr>`).join('\n        ');

  const steps = ABAP_CHAIN.map(c => `<div class="step">
        <code>${esc(c.id)}</code>
        <b>${esc(c.title)}</b>
        <span>${esc(c.what)}</span>
        ${koBadge(c.ko)}
        ${surfaceBadge(c.surface)}
        ${materialBadge()}
      </div>`).join('\n      ');

  const total = ABAP_CHAIN.reduce((a, c) => a + c.min, 0);

  const sections = `
      <div class="note">
        <span class="note-title">이 페이지의 범위</span>
        ABAP 기초부터 <strong>CDS 데이터 모델</strong>, Clean Core, <strong>RAP 기반 OData 서비스</strong>까지
        개발 운영자가 활용할 SAP 공식 과정만 순서대로 정리합니다.
      </div>

      <h2 id="chain">공식 학습경로 5단계</h2>
      <p>
        <a href="${L}/learning-journeys/acquiring-core-abap-skills" target="_blank" rel="noopener">Acquiring Core ABAP Skills</a>
        <code>LSC00935</code> 한 journey 안에 순서대로 들어 있습니다. 총 ${mins(total)}분입니다.
        이미 역량을 갖춘 개발자는 앞 단계를 건너뛰면 됩니다.
      </p>
      <div class="steps" style="margin:24px 0 28px">
      ${steps}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th class="num">#</th><th>코드</th><th>과정</th><th class="num">시간(분)</th><th>언어</th><th>이용 채널</th><th>교재</th></tr></thead>
          <tbody>
        ${chainRows}
          </tbody>
        </table>
      </div>
      <div class="note note-quiet">
        1~4번은 한국어판이 있고 <code>S4D437</code>은 영어만 있습니다.
        <code>S4D437</code>에는 exercise 가이드가 있으므로 <strong>따라 하며 진행</strong>할 수 있습니다.
        한국어가 없다는 것이 제외 사유는 아닙니다.
      </div>

      <h2 id="certification">관련 Certification</h2>
      <p>Catalog에서 직접 확인된 ABAP Cloud 개발 및 Fiori 시스템 관리 Certification입니다. 학습경로 완료와 자격 취득은 별개입니다.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>ID · Exam</th><th>공식 Certification</th><th>대상 역할</th></tr></thead>
        <tbody>${DEVELOPMENT_CERTIFICATIONS.map(certificationRow).join('\n        ')}</tbody>
      </table></div>

      <h2 id="scope">SAP 공식 과정이 다루는 범위</h2>
      <p>공식 과정의 범위와 별도 기술 학습이 필요한 구간을 구분했습니다.</p>
      <figure class="scope-flow" aria-labelledby="scope-flow-title">
        <figcaption id="scope-flow-title">CDS에서 OData와 화면 연계로 이어지는 학습 범위</figcaption>
        <div class="scope-flow-grid">
          <div class="scope-flow-group scope-covered">
            <span class="scope-flow-label">SAP 공식 과정에서 다룸</span>
            <ol>
              <li><b>CDS 데이터 모델</b><code>S4D430</code></li>
              <li><b>RAP 비즈니스 오브젝트</b><code>S4D437</code></li>
              <li><b>OData 서비스 노출</b><code>S4D437</code></li>
            </ol>
          </div>
          <span class="scope-flow-arrow" aria-hidden="true">&rarr;</span>
          <div class="scope-flow-group scope-connected">
            <span class="scope-flow-label">화면 연계</span>
            <div class="scope-flow-target"><b>Fiori Elements</b><span>SAP 공식 과정에서 다룸</span></div>
            <div class="scope-flow-target"><b>기타 Web 프론트엔드</b><span>선택한 기술에 맞는 별도 학습</span></div>
          </div>
        </div>
      </figure>
      <div class="table-wrap">
        <table>
          <thead><tr><th>구간</th><th>내용</th><th>SAP 공식 과정</th></tr></thead>
          <tbody>
            <tr><td>데이터 모델</td><td>CDS view, association, annotation</td><td><span class="badge badge-ko">있음</span> <code>S4D430</code></td></tr>
            <tr><td>백엔드 로직</td><td>RAP 비즈니스 오브젝트, behavior</td><td><span class="badge badge-ko">있음</span> <code>S4D437</code></td></tr>
            <tr><td>서비스 노출</td><td>OData 서비스 정의 · 바인딩 · 게시</td><td><span class="badge badge-ko">있음</span> <code>S4D437</code></td></tr>
            <tr><td>Fiori 화면</td><td>annotation 기반 Fiori Elements</td><td><span class="badge badge-ko">있음</span> <code>S4D437</code> Unit 1·3</td></tr>
            <tr><td><strong>기타 Web 화면</strong></td><td><strong>OData를 별도 Web 프론트엔드에서 소비</strong></td><td><span class="badge badge-none">범위 밖</span> 선택한 기술에 맞는 학습 필요</td></tr>
          </tbody>
        </table>
      </div>
      <div class="note note-warn">
        <span class="note-title">Fiori 외 프론트엔드를 연결하는 경우</span>
        SAP 공식 과정은 Fiori Elements와 SAPUI5를 중심으로 다룹니다. <strong>RAP로 OData 서비스를 노출하는 데까지</strong>를 먼저 학습하고,
        이후 화면 구현은 선택한 프론트엔드 기술의 교육자료를 별도로 확인합니다.
      </div>

      <h2 id="judge">커스텀 코드 판정 도구</h2>
      <p><code>S4D426</code> Unit 1에 가이드 시뮬레이션으로 들어 있습니다. 실제로 사용하는 커스텀 코드를 식별하고 범위를 정하는 방법을 다룹니다.</p>
      <ul>
        <li><strong>ABAP Call Monitor(SCMON)</strong>로 사용량 수집 — 실제 호출되는 리포트만 남깁니다</li>
        <li><strong>Custom Code Migration 앱</strong>으로 전환 범위 지정</li>
        <li><strong>ATC check variant</strong> <code>ABAP_CLOUD_DEVELOPMENT_DEFAULT</code> / <code>ABAP_CLOUD_READINESS</code> — Unit 5에 설명만 있고 직접 실행해 보는 부분은 없습니다</li>
      </ul>

      <h2 id="fiori">Fiori Elements 연계</h2>
      <p><code>S4D437</code> 안에 annotation 기반 Fiori Elements 리스트·오브젝트 페이지를 직접 만들어 보는 단원이 있어 별도 과정이 필요 없습니다. Fiori 운영·관리가 필요하면 아래를 봅니다.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>코드</th><th>과정</th><th class="num">시간(분)</th><th>언어</th><th>이용 채널</th><th>교재</th></tr></thead>
          <tbody>
            <tr><td><code>UX100</code></td><td><a href="${L}/courses/learning-the-basics-of-sap-fiori" target="_blank" rel="noopener">Learning the Basics of SAP Fiori</a></td><td class="num">1,405</td><td>${koBadge('yes')}</td><td>${surfaceBadge('learning')}</td><td>${materialBadge()}</td></tr>
            <tr><td><code>UX200</code></td><td><a href="${L}/courses/sap-fiori-system-administration-1" target="_blank" rel="noopener">SAP Fiori System Administration</a></td><td class="num">928</td><td>${koBadge('none')}</td><td>${surfaceBadge('learning')}</td><td>${materialBadge()}</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="next">다음</h2>
      <div class="rel-grid">
        <a class="rel-card" href="access.html"><b>채널 · 한국어</b><span>이용 채널 구분과 한국어 제공 현황</span></a>
        <a class="rel-card" href="conversion.html"><b>System Conversion</b><span>기술 전환 절차와 전환 후 점검</span></a>
        <a class="rel-card" href="index.html#modules"><b>모듈 과정</b><span>업무 모듈 목록으로 돌아가기</span></a>
      </div>`;

  const p = docPage({
    title: 'ABAP · RAP 학습',
    sub: 'ABAP 기초부터 CDS, Clean Core, RAP 기반 OData까지 이어지는 SAP 공식 학습경로입니다.',
    key: 'reports', mc: 'abap',
    tags: `<span class="badge badge-time">5개 과정 · ${mins(total)}분</span><span class="badge badge-ko">4개 한국어</span>`,
    toc: [['chain', '공식 학습경로 5단계'], ['certification', '관련 Certification'], ['scope', '공식 과정 범위'], ['judge', '커스텀 코드 판정'], ['fiori', 'Fiori Elements'], ['next', '다음']],
    sections
  });
  return layout({ title: 'ABAP · RAP 학습 — ERP 운영 학습 가이드', desc: 'ABAP, CDS, Clean Core, RAP 기반 OData를 위한 SAP 공식 학습경로', key: p.key, body: p.body });
}

function buildConversion() {
  const conversionJourney = catalogEnglish('LSC00878', 'Learning Journey');
  const cleanCoreCourse = ABAP_CHAIN.find(course => course.id === 'S4D426');
  const sections = `
      <div class="note">
        <span class="note-title">이 페이지의 범위</span>
        SAP S/4HANA <strong>system conversion과 upgrade</strong>를 학습할 수 있는 공식 자료입니다.
        업무 모듈 과정은 <a href="index.html#modules">모듈 과정</a>에 있습니다.
      </div>

      <h2 id="materials">공식 자료</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>대상</th><th>자료</th><th class="num">시간(분)</th><th>이용 채널</th><th>교재</th></tr></thead>
          <tbody>
            <tr>
              <td>전환 전체 절차</td>
              <td><a href="${conversionJourney?.direct_url || `${L}/learning-journeys/converting-and-upgrading-sap-s-4hana-systems`}" target="_blank" rel="noopener">${esc(conversionJourney?.title || 'Converting and Upgrading SAP S/4HANA Systems')}</a> <code>LSC00878</code> <span class="badge badge-en">${esc(conversionJourney?.level || 'Advanced')}</span></td>
              <td class="num">${mins(minutesFromCatalog(conversionJourney) ?? 2400)}</td>
              <td>${surfaceBadge(surfaceForUrl(conversionJourney?.direct_url || `${L}/learning-journeys/converting-and-upgrading-sap-s-4hana-systems`))}</td>
              <td>${materialBadge()}</td>
            </tr>
            <tr>
              <td>전환 준비 · 후속 활동</td>
              <td><a href="${COMMON_COURSES[0].url}" target="_blank" rel="noopener">${esc(COMMON_COURSES[0].title)}</a> <code>S4C03</code> 내 conversion lesson</td>
              <td class="num">${mins(COMMON_COURSES[0].min)}</td>
              <td>${surfaceBadge(COMMON_COURSES[0].surface)}</td>
              <td>${materialBadge()}</td>
            </tr>
            <tr>
              <td>전환 후 커스터마이징 점검</td>
              <td><a href="${L}/courses/implementing-sap-s-4hana-cloud-private-edition/analyzing-customizations-after-system-conversion_b9083e6d-e207-4578-8aa6-6c85cb42974a" target="_blank" rel="noopener">Analyzing Customizations after System Conversion</a> lesson</td>
              <td class="num">—</td>
              <td>${surfaceBadge('learning')}</td>
              <td>${materialBadge()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="font-size:13.5px;color:var(--ink-3)"><code>LSC00878</code> 안의 본 과정은 로그인 후에 열립니다.</p>

      <h2 id="custom">커스텀 코드 학습</h2>
      <p>
        System Conversion 과정은 <strong>커스텀 코드 판정과 Clean Core 원칙</strong>을 함께 이해해야 합니다.
        관련 도구와 학습경로는 별도 페이지에 정리했습니다.
      </p>
      <div class="rel-grid" style="margin-top:14px">
        <a class="rel-card" href="custom-reports.html"><b>ABAP · RAP 학습</b><span>ABAP + CDS + RAP 학습경로와 커스텀 코드 판정 도구</span></a>
      </div>

      <h2 id="cleancore">Clean Core 판정</h2>
      <p>
        <a href="${cleanCoreCourse.url}" target="_blank" rel="noopener">${esc(cleanCoreCourse.title)}</a>
        <code>S4D426</code> (${mins(cleanCoreCourse.min)}분, ${koBadge(cleanCoreCourse.ko)})의 Unit 1이 커스텀 코드 검토를 다룹니다.
      </p>
      <ul>
        <li>사용량 데이터 수집 (ABAP Call Monitor)</li>
        <li>레거시 수정 · 복사 · 확장 검토</li>
        <li>Custom Code Migration 앱으로 전환 범위 지정</li>
        <li>시스템 전환과 신규 구축 비교</li>
      </ul>
      <p>Unit 5는 Private Edition 시스템의 개발 환경 설정을 다룹니다 — 소프트웨어 컴포넌트, 개발자 권한, ABAP 언어 버전 배정.</p>

      <h2 id="certification">관련 Certification</h2>
      <p>Catalog에서 확인된 SAP S/4HANA Conversion 및 System Upgrade Certification입니다. 이 페이지의 자료 완료만으로 시험 준비가 끝나는 것은 아닙니다.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>ID · Exam</th><th>공식 Certification</th><th>대상 역할</th></tr></thead>
        <tbody>${CONVERSION_CERTIFICATIONS.map(certificationRow).join('\n        ')}</tbody>
      </table></div>

      <h2 id="next">다음</h2>
      <div class="rel-grid">
        <a class="rel-card" href="custom-reports.html"><b>ABAP · RAP 학습</b><span>개발 운영자를 위한 공식 학습경로</span></a>
        <a class="rel-card" href="access.html"><b>채널 · 한국어</b><span>이용 채널과 한국어 제공 현황</span></a>
        <a class="rel-card" href="index.html#modules"><b>모듈 과정</b><span>업무 모듈의 SAP 공식 과정</span></a>
      </div>`;

  const p = docPage({
    title: 'System Conversion',
    sub: 'SAP S/4HANA System Conversion과 관련된 공식 학습자료입니다.',
    key: 'conv', mc: 'fi',
    tags: `<span class="badge badge-time">LSC00878 · ${mins(minutesFromCatalog(conversionJourney) ?? 2400)}분</span><span class="badge badge-en">${esc(conversionJourney?.level || 'Advanced')}</span>`,
    toc: [['materials', '공식 자료'], ['custom', '커스텀 코드'], ['cleancore', 'Clean Core 판정'], ['certification', '관련 Certification'], ['next', '다음']],
    sections
  });
  return layout({ title: 'System Conversion — ERP 운영 학습 가이드', desc: 'SAP S/4HANA System Conversion 관련 SAP 공식 학습자료', key: p.key, body: p.body });
}

function buildAccess() {
  const koRows = [];
  for (const m of MODULES) {
    if (!m.courses.length) continue;
    for (const c of m.courses) {
      koRows.push({ mod: m.code, modKo: m.ko, ...c });
    }
  }
  const known = koRows.filter(c => c.ko !== 'unknown');
  const byStatus = s => known.filter(c => c.ko === s);
  const uniqueCourses = [...new Map([...koRows, ...ABAP_CHAIN, ...COMMON_COURSES].map(course => [course.id, course])).values()];
  const learningCourses = uniqueCourses.filter(course => course.surface === 'learning');
  const hubOnlyCourses = uniqueCourses.filter(course => course.surface === 'hub');

  const sections = `
      <h2 id="account">이용 채널 구분</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>표시</th><th>분류 기준</th><th class="num">현재 선별 과정</th></tr></thead>
          <tbody>
            <tr><td>${surfaceBadge('learning')}</td><td><code>learning.sap.com</code> 공식 Direct Link가 있는 과정</td><td class="num">${learningCourses.length}개</td></tr>
            <tr><td>${surfaceBadge('hub')}</td><td>SAP Learning 공식 Direct Link 없이 SAP Learning Hub에서만 확인되는 과정</td><td class="num">${hubOnlyCourses.length}개</td></tr>
          </tbody>
        </table>
      </div>

      <div class="note note-quiet">
        이용 채널과 언어는 별도 정보입니다. 예를 들어 한국어 과정이라도 SAP Learning Direct Link가 있으면
        <strong>SAP Learning에서도 이용 가능</strong>으로 표시합니다. 실제 수강 이력 저장에는 로그인이 필요할 수 있습니다.
      </div>

      <h2 id="material">교재 다운로드</h2>
      <p>사용자가 SAP Learning Hub에서 확인한 결과, 이 사이트에 정리한 <strong>모든 교육과정의 교재를 다운로드할 수 있습니다.</strong> 과정 표에서는 ${materialBadge()}로 표시했습니다.</p>
      <div class="note note-warn">다운로드한 교재의 보관·공유 범위는 조직의 SAP 계약과 내부 정책을 따릅니다.</div>

      <h2 id="catalog">다운로드 Catalog 반영</h2>
      <p>2026-09-02에 SAP Learning Hub에서 내려받은 공식 XML Catalog를 기준으로 과정 코드, 제목, 시간, 레벨, URL, 한국어 variant와 Certification을 갱신했습니다.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>항목</th><th class="num">건수</th><th>해석</th></tr></thead>
          <tbody>
            <tr><td>Catalog 전체 항목</td><td class="num">${FULL_CATALOG_STATS.rows.toLocaleString('en-US')}</td><td>Course·Journey·Practice System·Video·Certification 전체</td></tr>
            <tr><td>공식 URL이 있는 항목</td><td class="num">${FULL_CATALOG_STATS.urlRows.toLocaleString('en-US')}</td><td>Direct_link의 공식 링크</td></tr>
            <tr><td>전체 카탈로그 페이지</td><td class="num">${FULL_CATALOG_STATS.enKoRows.toLocaleString('en-US')}</td><td>영어 기본 ${FULL_CATALOG_STATS.englishRows.toLocaleString('en-US')}건 + 한국어 variant ${FULL_CATALOG_STATS.koreanRows.toLocaleString('en-US')}건</td></tr>
            <tr><td>이 사이트에 선별 반영한 행</td><td class="num">${FULL_CATALOG_STATS.selectedRows.toLocaleString('en-US')}</td><td>현재 과정과 locale variant, 관련 Certification</td></tr>
          </tbody>
        </table>
      </div>
      <p><a class="btn btn-ghost" href="catalog.html">영어·한국어 전체 카탈로그 열기</a></p>

      <h2 id="korean">한국어 제공 현황</h2>
      <p>
        확인한 과정 기준입니다. <strong>한국어 여부는 학습 순서를 정하는 정보이지 제외 기준이 아닙니다.</strong>
        영어만 있는 과정도 그대로 씁니다.
      </p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>표시</th><th>의미</th><th>확인된 과정</th></tr></thead>
          <tbody>
            <tr><td>${koBadge('yes')}</td><td>공식 Catalog에 한국어 variant가 있음</td><td class="num">${byStatus('yes').length}개</td></tr>
            <tr><td>${koBadge('none')}</td><td>영어(일부 일본어)만 제공</td><td class="num">${byStatus('none').length}개</td></tr>
            <tr><td>${koBadge('unknown')}</td><td>이번에 확인하지 않음. 없다는 뜻이 아님</td><td class="num">${koRows.length - known.length}개</td></tr>
          </tbody>
        </table>
      </div>

      <h3>영어만 확인된 과정</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>모듈</th><th>코드</th><th>과정</th></tr></thead>
          <tbody>
            ${byStatus('none').map(c => `<tr><td>${esc(c.mod)} ${esc(c.modKo)}</td><td><code>${esc(c.id)}</code></td><td>${esc(c.title)}</td></tr>`).join('\n            ')}
            <tr><td>커스텀 리포트</td><td><code>S4D437</code></td><td>Building Transactional Apps with the ABAP RESTful Application Programming Model</td></tr>
            <tr><td>Fiori</td><td><code>UX200</code></td><td>SAP Fiori System Administration</td></tr>
          </tbody>
        </table>
      </div>
      <div class="note note-quiet">
        <code>S4F17</code>(자산회계)은 과정 자체는 영어지만 <strong>exercise 가이드에 한국어판이 있습니다.</strong>
        과정은 영어로 듣고 따라 하는 단계는 한국어 가이드를 쓰는 방법이 가능합니다. <code>F9611</code>·<code>S48600</code>도 같습니다.
      </div>

      <h2 id="next">다음</h2>
      <div class="rel-grid">
        <a class="rel-card" href="start.html"><b>시작하기</b><span>무엇부터 볼지</span></a>
        <a class="rel-card" href="index.html#modules"><b>모듈 과정</b><span>담당 모듈의 SAP 공식 과정</span></a>
        <a class="rel-card" href="catalog.html"><b>전체 카탈로그</b><span>영어·한국어 과정 검색</span></a>
        <a class="rel-card" href="custom-reports.html"><b>ABAP · RAP 학습</b><span>공식 학습경로</span></a>
      </div>`;

  const p = docPage({
    title: '채널 · 교재 · 한국어',
    sub: 'SAP Learning과 SAP Learning Hub 이용 구분, 교재 다운로드, 한국어 제공 현황입니다.',
    key: 'access', mc: 'ewm',
    tags: `<span class="badge badge-learning">이용 채널 구분</span>${materialBadge()}<span class="badge badge-ko">한국어 제공 현황</span>`,
    toc: [['account', '이용 채널'], ['material', '교재 다운로드'], ['catalog', 'Catalog 반영'], ['korean', '한국어 제공 현황'], ['next', '다음']],
    sections
  });
  return layout({ title: '채널 · 교재 · 한국어 — ERP 운영 학습 가이드', desc: 'SAP Learning과 SAP Learning Hub 이용 채널, 교재 다운로드, 한국어 제공 현황', key: p.key, body: p.body });
}

function buildCatalog() {
  const typeCount = type => FULL_CATALOG.filter(row => row.learning_type === type).length;
  const learningCount = FULL_CATALOG.filter(row => surfaceForUrl(row.direct_url) === 'learning').length;
  const hubOnlyCount = FULL_CATALOG.length - learningCount;
  const body = `
<div class="page-top" style="--mc: var(--brand-blue)">
  <div class="page-top-band" aria-hidden="true"></div>
  <div class="wrap page-top-inner">
    <div class="crumb"><a href="index.html">홈</a><span>&rsaquo;</span>전체 카탈로그</div>
    <h1>SAP Learning 전체 카탈로그 <span style="color:var(--ink-3);font-weight:600;font-size:.55em">SAP Learning Catalog</span></h1>
    <p class="page-sub">다운로드한 공식 XML에서 영어 기본 항목과 한국어 variant만 모았습니다. 제목·ID·제품·유형으로 검색할 수 있습니다.</p>
    <div class="page-tags"><span class="badge badge-learning">${FULL_CATALOG_STATS.enKoRows.toLocaleString('en-US')}개 항목</span><span class="badge badge-ko">한국어 ${FULL_CATALOG_STATS.koreanRows.toLocaleString('en-US')}</span><span class="badge badge-en">영어 ${FULL_CATALOG_STATS.englishRows.toLocaleString('en-US')}</span></div>
  </div>
</div>

<div class="wrap catalog-shell">
  <div class="note note-quiet">
    <span class="note-title">선별·분류 기준</span>
    전체 ${FULL_CATALOG_STATS.rows.toLocaleString('en-US')}건 중 locale 접미사가 없는 영어 기본 항목과 <code>_ko-KO</code> 한국어 variant를 포함했습니다.
    한국어 variant의 공식 제목은 영어 제목 뒤에 <code>| KO</code>가 붙는 형식이어서 언어 배지로 구분합니다.
    <code>learning.sap.com</code> Direct Link가 있으면 <strong>SAP Learning에서도 이용 가능</strong>, 없으면 <strong>SAP Learning Hub 전용</strong>입니다.
  </div>

  <div class="catalog-summary" aria-label="Catalog 요약">
    <div class="catalog-kpi"><b>${FULL_CATALOG_STATS.enKoRows.toLocaleString('en-US')}</b><span>영어·한국어 전체 항목</span></div>
    <div class="catalog-kpi"><b>${typeCount('Standalone course').toLocaleString('en-US')}</b><span>개별 교육과정</span></div>
    <div class="catalog-kpi"><b>${learningCount.toLocaleString('en-US')}</b><span>SAP Learning에서도 이용 가능</span></div>
    <div class="catalog-kpi"><b>${hubOnlyCount.toLocaleString('en-US')}</b><span>SAP Learning Hub 전용</span></div>
  </div>

  <div class="note">
    교육과정과 Learning Journey의 과정 교재는 SAP Learning Hub에서 모두 다운로드 가능한 것으로 확인했습니다.
    Video·Practice System·Certification은 과정 교재 대상이 아니므로 표에서 별도로 표시합니다.
  </div>

  <div class="catalog-controls" role="search" aria-label="Catalog 검색과 필터">
    <div class="catalog-control">
      <label for="catalog-search">검색</label>
      <input id="catalog-search" type="search" placeholder="과정명, 코드, 제품, 역할…" autocomplete="off" data-catalog-search>
    </div>
    <div class="catalog-control">
      <label for="catalog-type">유형</label>
      <select id="catalog-type" data-catalog-type><option value="">전체 유형</option></select>
    </div>
    <div class="catalog-control">
      <label for="catalog-language">언어</label>
      <select id="catalog-language" data-catalog-language><option value="">한국어 + 영어</option><option value="ko">한국어</option><option value="en">영어</option></select>
    </div>
    <div class="catalog-control">
      <label for="catalog-category">제품 영역</label>
      <select id="catalog-category" data-catalog-category><option value="">전체 제품 영역</option></select>
    </div>
    <div class="catalog-control">
      <label for="catalog-surface">이용 채널</label>
      <select id="catalog-surface" data-catalog-surface><option value="">전체 채널</option><option value="learning">SAP Learning에서도 이용 가능</option><option value="hub">SAP Learning Hub 전용</option></select>
    </div>
  </div>

  <div class="catalog-status">
    <strong data-catalog-count aria-live="polite">${FULL_CATALOG_STATS.enKoRows.toLocaleString('en-US')}개 항목</strong>
    <button class="btn btn-ghost btn-sm" type="button" data-catalog-reset>필터 초기화</button>
  </div>

  <div class="table-wrap">
    <table class="catalog-table">
      <thead><tr><th>언어</th><th>유형</th><th>과정 ID</th><th>제목 · 제품</th><th>제품 영역</th><th class="num">시간</th><th>레벨</th><th>이용 채널</th><th>교재</th></tr></thead>
      <tbody data-catalog-body></tbody>
    </table>
  </div>
  <div class="catalog-empty" data-catalog-empty>조건에 맞는 항목이 없습니다.</div>
  <div class="catalog-pagination" aria-label="Catalog 페이지 이동">
    <button class="btn btn-ghost btn-sm" type="button" data-catalog-prev>이전</button>
    <span class="catalog-page-label" data-catalog-page aria-live="polite">1 / 1 페이지</span>
    <button class="btn btn-ghost btn-sm" type="button" data-catalog-next>다음</button>
  </div>
  <noscript><div class="note note-warn">전체 Catalog 검색과 표시는 JavaScript가 필요합니다.</div></noscript>
</div>
<script src="assets/js/catalog-data.js"></script>
<script src="assets/js/catalog.js"></script>
`;
  return layout({
    title: 'SAP Learning 전체 카탈로그 — ERP 운영 학습 가이드',
    desc: 'SAP Learning 공식 Catalog의 영어·한국어 과정, Learning Journey, 영상, 실습 시스템, Certification 검색',
    key: 'catalog', body, bodyClass: 'catalog-body'
  });
}

function buildStart() {
  const sections = `
      <div class="note">
        <span class="note-title">이 사이트를 쓰는 법</span>
        <ol style="margin:6px 0 0">
          <li><a href="index.html#modules">모듈 과정</a>에서 담당 모듈명이나 코드를 찾습니다.</li>
          <li>모듈 페이지에서 담당 범위에 해당하는 과정만 고릅니다. 한국어 표시를 보고 순서를 정합니다.</li>
          <li>ABAP · CDS · RAP를 학습하려면 <a href="custom-reports.html">ABAP · RAP 학습</a>을 봅니다.</li>
          <li>&lsquo;미확인&rsquo;과 &lsquo;확인된 과정 없음&rsquo;은 서로 다른 상태이므로 표시를 구분해서 봅니다.</li>
        </ol>
      </div>

      <h2 id="common">모든 모듈에 공통인 것</h2>
      <p>모듈 journey 대부분에 아래 두 과정이 공통으로 들어 있습니다. 여러 모듈을 볼 사람은 <strong>한 번만</strong> 들으면 됩니다.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>코드</th><th>과정</th><th class="num">시간(분)</th><th>이용 채널</th><th>교재</th></tr></thead>
          <tbody>
            ${COMMON_COURSES.map(course => `<tr><td><code>${esc(course.id)}</code></td><td><a href="${course.url}" target="_blank" rel="noopener">${esc(course.title)}</a></td><td class="num">${mins(course.min)}</td><td>${surfaceBadge(course.surface)}</td><td>${materialBadge()}</td></tr>`).join('\n            ')}
          </tbody>
        </table>
      </div>

      <h2 id="certification">PCE 관련 Certification</h2>
      <p>Catalog에서 PCE 프로젝트·구현과 직접 연결된 Certification입니다. 이 사이트의 학습경로는 시험 대비 전체 경로가 아니며 Certification은 선택 참고입니다.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID · Exam</th><th>공식 Certification</th><th>대상 역할</th></tr></thead>
          <tbody>${PROGRAMME_CERTIFICATIONS.map(certificationRow).join('\n          ')}</tbody>
        </table>
      </div>

      <h2 id="check">시작 전 자기점검</h2>
      <p>아래에 &lsquo;설명할 수 있다&rsquo;로 답할 수 있으면 해당 부분을 건너뛰어도 됩니다. 시험이 아닙니다.</p>
      <ul>
        <li>PCE를 Public Edition이나 단순 on-premise 호스팅과 구분해 설명할 수 있는가?</li>
        <li>SAP가 기술 작업을 수행해도 고객에게 계획 · 승인 · 테스트 · 업무검증 책임이 남는 이유를 설명할 수 있는가?</li>
        <li>Clean core가 모든 커스텀 코드를 금지한다는 뜻이 아닌 이유를 설명할 수 있는가?</li>
        <li>CDS 데이터 모델, RAP 비즈니스 오브젝트, OData 서비스의 역할을 구분할 수 있는가?</li>
      </ul>

      <h2 id="order">권장 순서</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th class="num">#</th><th>대상</th><th>무엇을</th></tr></thead>
          <tbody>
            <tr><td class="num">1</td><td>전원</td><td>자기 모듈 페이지를 열어 담당 범위 과정을 확인합니다</td></tr>
            <tr><td class="num">2</td><td>전원</td><td><a href="access.html">채널 · 한국어</a>에서 이용 채널과 교재 다운로드 방법을 확인합니다</td></tr>
            <tr><td class="num">3</td><td>업무 담당</td><td>모듈 journey에서 담당 범위 과정만 골라 진행합니다</td></tr>
            <tr><td class="num">4</td><td>개발 담당</td><td><a href="custom-reports.html">ABAP · RAP 학습</a> 5단계를 역량에 맞춰 진행합니다</td></tr>
            <tr><td class="num">5</td><td>기술 담당</td><td><a href="conversion.html">System Conversion</a> 자료를 확인합니다</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="limits">이 사이트가 보장하지 않는 것</h2>
      <ul>
        <li>과정 이수는 <strong>운영 자격이나 Production 권한을 뜻하지 않습니다.</strong></li>
        <li>과정에서 다루는 화면과 데이터는 <strong>SAP 훈련용</strong>입니다. 실제 운영 환경의 설정과 다를 수 있습니다.</li>
        <li>&lsquo;미확인&rsquo; 표시는 없다는 뜻이 아니라 <strong>이번에 확인하지 않았다</strong>는 뜻입니다.</li>
      </ul>

      <h2 id="next">다음</h2>
      <div class="rel-grid">
        <a class="rel-card" href="index.html#modules"><b>모듈 과정</b><span>내 모듈부터 시작</span></a>
        <a class="rel-card" href="access.html"><b>채널 · 한국어</b><span>이용 채널과 교재 다운로드</span></a>
        <a class="rel-card" href="custom-reports.html"><b>ABAP · RAP 학습</b><span>개발 운영자를 위한 공식 과정</span></a>
      </div>`;

  const p = docPage({
    title: '시작하기',
    sub: '처음 왔을 때 무엇부터 보면 되는지 정리했습니다.',
    key: 'start', mc: 'sd',
    toc: [['common', '공통 과정'], ['certification', '관련 Certification'], ['check', '자기점검'], ['order', '권장 순서'], ['limits', '보장하지 않는 것'], ['next', '다음']],
    sections
  });
  return layout({ title: '시작하기 — ERP 운영 학습 가이드', desc: 'SAP 공식 운영 학습자료 안내를 처음 사용할 때의 가이드', key: p.key, body: p.body });
}

/* ---------------------------------------------------------------- 실행 */
const write = (rel, content) => {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content.replace(/[ \t]+$/gm, ''), 'utf8');
  return rel;
};

const out = [];
out.push(write('index.html', buildIndex()));
for (const m of MODULES) {
  if (!m.slug) continue;
  out.push(write(`modules/${m.slug}.html`, buildModule(m)));
}
out.push(write('custom-reports.html', buildCustomReports()));
out.push(write('conversion.html', buildConversion()));
out.push(write('access.html', buildAccess()));
out.push(write('start.html', buildStart()));
out.push(write('assets/js/catalog-data.js', `window.SAP_LEARNING_CATALOG = ${JSON.stringify(FULL_CATALOG)};\n`));
out.push(write('catalog.html', buildCatalog()));

console.log(`생성 완료: ${out.length}개 파일`);
out.forEach(f => console.log('  ' + f));
