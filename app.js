'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* Storage may be unavailable; the guide still works for this session. */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* Ignore. */
    }
  }
};

/* --------------------------------------------------------------------------
   Visual atlas
   -------------------------------------------------------------------------- */
const stageData = {
  normal: {
    name: 'No apparent DR',
    kicker: 'Stage 0 · No apparent retinopathy',
    caption: 'No visible lesions. Annual screening if normal.',
    summary: 'No microaneurysms, hemorrhages, exudates, or neovascularization are visible.',
    points: [
      'Screen annually if no retinopathy.',
      'Optimize glucose, blood pressure, and lipids.',
      'If vision changes, check the macula even when the fundus looks quiet.'
    ],
    lesions: []
  },
  mild: {
    name: 'Mild NPDR',
    kicker: 'Stage 1 · Mild NPDR',
    caption: 'Microaneurysms only.',
    summary: 'The earliest visible stage: tiny red dots from capillary wall outpouchings.',
    points: [
      'Microaneurysms only.',
      'No 4-2-1 criteria.',
      'Typical follow-up: 9–12 months if no DME.'
    ],
    lesions: ['microaneurysm']
  },
  moderate: {
    name: 'Moderate NPDR',
    kicker: 'Stage 2 · Moderate NPDR',
    caption: 'More than mild, less than severe.',
    summary: 'Hemorrhages, hard exudates, and cotton-wool spots may appear, but the 4-2-1 threshold is not met.',
    points: [
      'Dot–blot hemorrhages, exudates, and cotton-wool spots may appear.',
      'Does not meet severe 4-2-1 criteria.',
      'Typical follow-up: about 6 months.'
    ],
    lesions: ['microaneurysm', 'hemorrhage', 'exudate', 'cotton']
  },
  severe: {
    name: 'Severe NPDR',
    kicker: 'Stage 3 · Severe NPDR',
    caption: 'Any one 4-2-1 criterion. Two or more = very severe.',
    summary: 'Widespread capillary closure and ischemia. The 4-2-1 rule is the staging shortcut.',
    points: [
      '4 quadrants: diffuse hemorrhages / microaneurysms.',
      '2+ quadrants: venous beading.',
      '1+ quadrant: IRMA.',
      'Any one = severe; two or more = very severe.'
    ],
    lesions: ['microaneurysm', 'hemorrhage', 'exudate', 'cotton', 'beading', 'irma']
  },
  pdr: {
    name: 'Proliferative DR',
    kicker: 'Stage 4 · PDR',
    caption: 'Neovascularization ± vitreous hemorrhage.',
    summary: 'VEGF-driven new vessels are fragile and can bleed or cause tractional detachment.',
    points: [
      'Neovascularization defines PDR.',
      'Complications: vitreous hemorrhage, tractional RD, neovascular glaucoma.',
      'PRP for high-risk PDR; anti-VEGF is an alternative; vitrectomy for VH/TRD.'
    ],
    lesions: ['microaneurysm', 'hemorrhage', 'exudate', 'cotton', 'nvd', 'nve', 'vh']
  }
};

const lesionData = {
  microaneurysm: {
    num: '1',
    title: 'Microaneurysm',
    tag: 'Earliest visible lesion',
    what: 'A balloon-like outpouching of a retinal capillary wall. It looks like a tiny red dot.',
    why: 'It is the first ophthalmoscopic sign of diabetic retinopathy. Mild NPDR is defined as microaneurysms only.',
    hook: 'Mild = microaneurysms only.'
  },
  hemorrhage: {
    num: '2',
    title: 'Dot–blot hemorrhage',
    tag: 'Leak / capillary damage',
    what: 'Rupture of a capillary or microaneurysm in the deeper retinal layers, producing round red dots or blots.',
    why: 'Diffuse hemorrhages in all four quadrants are one of the 4-2-1 criteria for severe NPDR.',
    hook: 'Four quadrants = severe.'
  },
  exudate: {
    num: '3',
    title: 'Hard exudate',
    tag: 'Chronic leakage',
    what: 'Yellow, waxy lipid deposits left behind by chronic vascular leakage.',
    why: 'Exudates near the macula raise the risk of vision loss and often accompany DME.',
    hook: 'Hard = lipid = leak.'
  },
  cotton: {
    num: '4',
    title: 'Cotton-wool spot',
    tag: 'Ischemia',
    what: 'A fluffy white patch caused by infarction of the retinal nerve fiber layer.',
    why: 'It signals capillary occlusion and retinal ischemia, but it is not one of the 4-2-1 criteria.',
    hook: 'Cotton = ischemia, not a 4-2-1 number.'
  },
  beading: {
    num: '5',
    title: 'Venous beading',
    tag: 'Ischemia',
    what: 'Irregular, sausage-like changes in venous caliber.',
    why: 'Beading in at least two quadrants is one 4-2-1 criterion for severe NPDR.',
    hook: 'Two beaded veins.'
  },
  irma: {
    num: '6',
    title: 'IRMA',
    tag: 'Ischemia',
    what: 'Intraretinal microvascular abnormalities: fine, irregular vessels within the retina.',
    why: 'IRMA in at least one quadrant is one 4-2-1 criterion for severe NPDR.',
    hook: 'One IRMA.'
  },
  nvd: {
    num: '7',
    title: 'Neovascularization at the disc',
    tag: 'PDR',
    what: 'New, fragile vessels growing on or near the optic disc in response to VEGF.',
    why: 'Neovascularization defines PDR. These vessels can bleed, fibrose, and cause tractional detachment.',
    hook: 'PDR = new vessels.'
  },
  nve: {
    num: '8',
    title: 'Neovascularization elsewhere',
    tag: 'PDR',
    what: 'New vessels growing elsewhere on the retina, often along the vascular arcades.',
    why: 'NVE also defines PDR and carries the same risks of vitreous hemorrhage and traction.',
    hook: 'New vessels anywhere = PDR.'
  },
  vh: {
    num: '9',
    title: 'Vitreous hemorrhage',
    tag: 'PDR complication',
    what: 'Bleeding from fragile new vessels into the vitreous.',
    why: 'It can cause sudden floaters or painless vision loss and may require vitrectomy if it does not clear.',
    hook: 'Sudden floaters in diabetes = think VH.'
  },
  dme: {
    num: 'D',
    title: 'Diabetic macular edema',
    tag: 'Any stage',
    what: 'Fluid and thickening in the macula from breakdown of the blood–retinal barrier.',
    why: 'It is a leading cause of vision loss in DR and is graded separately from NPDR and PDR.',
    hook: 'DME = leaky macula → anti-VEGF if center-involving.'
  }
};

const atlas = {
  stage: 'moderate',
  dme: false,
  selected: null,
  wrap: $('#fundusWrap'),
  caption: $('#stageCaption'),
  kicker: $('#stageKicker'),
  title: $('#stageTitle'),
  summary: $('#stageSummary'),
  points: $('#stagePoints'),
  chips: $('#lesionChips'),
  hint: $('#panelHint'),
  dmeNote: $('#dmeNote'),
  overview: $('#lesionOverview'),
  detail: $('#lesionDetail'),
  detailKicker: $('#detailKicker'),
  detailTitle: $('#detailTitle'),
  detailWhat: $('#detailWhat'),
  detailWhy: $('#detailWhy'),
  detailHook: $('#detailHook'),
  back: $('#backToStage'),
  stageButtons: $$('.stage-tab'),
  dmeToggle: $('#dmeToggle')
};

function resetLesionDetail() {
  atlas.selected = null;
  atlas.detail.hidden = true;
  atlas.overview.hidden = false;
  $$('#fundusSvg .lesion.is-selected').forEach((pin) => pin.classList.remove('is-selected'));
}

function renderChips(ids) {
  atlas.chips.innerHTML = '';
  const allIds = atlas.dme ? [...ids, 'dme'] : ids;

  if (!allIds.length) {
    atlas.hint.textContent = atlas.dme
      ? 'No retinal lesions are shown. Click the D pin to inspect the DME overlay.'
      : 'No lesions in this view. Choose another stage or turn on the DME overlay.';
    return;
  }

  allIds.forEach((id) => {
    const lesion = lesionData[id];
    if (!lesion) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lesion-chip';
    const badge = document.createElement('span');
    badge.textContent = lesion.num;
    button.appendChild(badge);
    button.appendChild(document.createTextNode(lesion.title));
    button.addEventListener('click', () => selectLesion(id));
    atlas.chips.appendChild(button);
  });

  atlas.hint.textContent = 'Click a numbered pin or chip to inspect the lesion.';
}

function renderStage(stage) {
  atlas.stage = stage;
  const data = stageData[stage];

  atlas.stageButtons.forEach((button) => {
    const isActive = button.dataset.stage === stage;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  atlas.wrap.className = `fundus-wrap stage-${stage}${atlas.dme ? ' dme-on' : ''}`;
  atlas.caption.textContent = data.caption;
  atlas.kicker.textContent = data.kicker;
  atlas.title.textContent = data.name;
  atlas.summary.textContent = data.summary;
  atlas.points.innerHTML = data.points.map((point) => `<li>${point}</li>`).join('');

  $$('#fundusSvg .lesion').forEach((pin) => {
    if (pin.dataset.id === 'dme') return;
    const visible = data.lesions.includes(pin.dataset.id);
    pin.classList.toggle('is-hidden', !visible);
    pin.setAttribute('tabindex', visible ? '0' : '-1');
    pin.setAttribute('aria-hidden', String(!visible));
  });

  const dmePin = $('#fundusSvg .dme-overlay');
  if (dmePin) {
    dmePin.setAttribute('tabindex', atlas.dme ? '0' : '-1');
    dmePin.setAttribute('aria-hidden', String(!atlas.dme));
  }

  atlas.dmeNote.hidden = !atlas.dme;
  renderChips(data.lesions);
  resetLesionDetail();
}

function selectLesion(id) {
  const lesion = lesionData[id];
  if (!lesion) return;
  atlas.selected = id;
  atlas.overview.hidden = true;
  atlas.detail.hidden = false;
  atlas.detailKicker.textContent = lesion.tag;
  atlas.detailTitle.textContent = lesion.title;
  atlas.detailWhat.textContent = lesion.what;
  atlas.detailWhy.textContent = lesion.why;
  atlas.detailHook.textContent = lesion.hook;

  $$('#fundusSvg .lesion').forEach((pin) => {
    pin.classList.toggle('is-selected', pin.dataset.id === id);
  });
}

atlas.stageButtons.forEach((button) => {
  button.addEventListener('click', () => renderStage(button.dataset.stage));
});

$$('#fundusSvg .lesion').forEach((pin) => {
  const id = pin.dataset.id;
  pin.addEventListener('click', () => selectLesion(id));
  pin.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectLesion(id);
    }
  });
});

atlas.back.addEventListener('click', resetLesionDetail);

atlas.dmeToggle.addEventListener('change', () => {
  atlas.dme = atlas.dmeToggle.checked;
  renderStage(atlas.stage);
});

renderStage('moderate');

/* --------------------------------------------------------------------------
   Pathway recall toggle
   -------------------------------------------------------------------------- */
const pathway = $('#pathway');
const pathToggle = $('#pathToggle');
const pathCards = $$('.path-card', pathway);

function setPathRecall(isRecall) {
  pathway.classList.toggle('recall', isRecall);
  pathToggle.textContent = isRecall ? 'Reveal all' : 'Hide labels';
  pathCards.forEach((card) => card.classList.toggle('revealed', !isRecall));
}

pathToggle.addEventListener('click', () => {
  setPathRecall(!pathway.classList.contains('recall'));
});

pathCards.forEach((card) => {
  const reveal = () => {
    if (!pathway.classList.contains('recall')) return;
    card.classList.toggle('revealed');
  };
  card.addEventListener('click', reveal);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      reveal();
    }
  });
});

/* --------------------------------------------------------------------------
   4-2-1 builder
   -------------------------------------------------------------------------- */
const ruleChecks = $$('[data-rule]');
const ruleResult = $('#ruleResult');
const ruleCount = $('#ruleCount');
const ruleStatus = $('#ruleStatus');
const ruleBar = $('#ruleBar');

function updateRule() {
  const count = ruleChecks.filter((checkbox) => checkbox.checked).length;
  ruleCount.textContent = `${count} / 3`;
  ruleBar.style.width = `${(count / 3) * 100}%`;
  ruleResult.classList.remove('is-severe', 'is-very');

  if (count === 0) {
    ruleStatus.textContent = 'Does not meet 4-2-1 severe criteria';
  } else if (count === 1) {
    ruleResult.classList.add('is-severe');
    ruleStatus.textContent = 'Severe NPDR · any one criterion';
  } else {
    ruleResult.classList.add('is-very');
    ruleStatus.textContent = 'Very severe NPDR · ≥2 criteria';
  }
}

ruleChecks.forEach((checkbox) => checkbox.addEventListener('change', updateRule));
$('#ruleReset').addEventListener('click', () => {
  ruleChecks.forEach((checkbox) => { checkbox.checked = false; });
  updateRule();
});
updateRule();

/* --------------------------------------------------------------------------
   OCT decision
   -------------------------------------------------------------------------- */
const dmeOutput = $('#dmeOutput');
const decisionButtons = $$('[data-dme]');

const dmeAnswers = {
  yes: {
    tag: 'Center-involving DME',
    title: 'Anti-VEGF first-line',
    text: 'Treat the macula with intravitreal anti-VEGF. Also optimize glucose, blood pressure, and lipids.',
    bullets: [
      'OCT confirms central thickening / fluid.',
      'Consider steroid if there is inadequate response or a contraindication.',
      'Do not forget systemic risk-factor control.'
    ]
  },
  no: {
    tag: 'Non-center-involving DME',
    title: 'Individualize',
    text: 'Observation or focal/grid laser are reasonable options. Consider anti-VEGF if vision is threatened or the edema progresses.',
    bullets: [
      'OCT shows thickening that does not involve the center.',
      'Treat systemic risk factors.',
      'Follow closely for progression toward the center.'
    ]
  }
};

decisionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const answer = dmeAnswers[button.dataset.dme];
    decisionButtons.forEach((item) => item.classList.toggle('active', item === button));
    dmeOutput.innerHTML = `
      <span class="output-tag">${answer.tag}</span>
      <h4>${answer.title}</h4>
      <p>${answer.text}</p>
      <ul>${answer.bullets.map((item) => `<li>${item}</li>`).join('')}</ul>
    `;
  });
});

/* --------------------------------------------------------------------------
   Section coverage progress
   -------------------------------------------------------------------------- */
const sections = $$('main section.section[id]');
const visited = new Set(store.get('drVisited', []));
const progressPct = $('#progressPct');
const progressRing = $('#progressRing');
const navLinks = $$('.nav-links a');

function updateProgress() {
  const percent = Math.round((visited.size / sections.length) * 100);
  progressPct.textContent = `${percent}%`;
  progressRing.style.setProperty('--progress', `${percent}%`);
}

function markVisited(id) {
  if (visited.has(id)) return;
  visited.add(id);
  store.set('drVisited', Array.from(visited));
  updateProgress();
}

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
    if (entry.intersectionRatio >= 0.2) markVisited(id);
  });
}, { threshold: [0.2, 0.5] });

sections.forEach((section) => sectionObserver.observe(section));
updateProgress();

/* --------------------------------------------------------------------------
   Flashcards with lightweight spaced repetition
   -------------------------------------------------------------------------- */
const flashcardData = [
  { id: 'c01', topic: 'Staging', q: 'What is the earliest visible lesion of diabetic retinopathy?', a: 'A microaneurysm.', hook: 'Mild NPDR = microaneurysms only.' },
  { id: 'c02', topic: 'Staging', q: 'How is mild NPDR defined?', a: 'Microaneurysms only — no hemorrhages, exudates, cotton-wool spots, venous beading, IRMA, or neovascularization.', hook: 'Mild = micro only.' },
  { id: 'c03', topic: 'Staging', q: 'State the 4-2-1 rule for severe NPDR.', a: '4 quadrants of hemorrhages/microaneurysms, 2+ quadrants of venous beading, or 1+ quadrant of IRMA.', hook: 'Four, two, one.' },
  { id: 'c04', topic: 'Staging', q: 'In the 4-2-1 rule, what is the difference between severe and very severe NPDR?', a: 'Any one criterion = severe NPDR. Two or more criteria = very severe NPDR.', hook: 'One = severe; two = very severe.' },
  { id: 'c05', topic: 'Staging', q: 'What defines proliferative diabetic retinopathy?', a: 'Neovascularization — new vessels at the disc (NVD) or elsewhere (NVE). Vitreous hemorrhage is a complication, not the defining feature.', hook: 'PDR = new vessels.' },
  { id: 'c06', topic: 'Staging', q: 'Which finding signals retinal ischemia but is not one of the 4-2-1 criteria?', a: 'A cotton-wool spot (nerve fiber layer infarct).', hook: 'Cotton = ischemia, not a number.' },
  { id: 'c07', topic: 'Pathology', q: 'What are the two final common pathways that threaten vision in DR?', a: 'Leakage into the macula (DME) and VEGF-driven neovascularization (PDR).', hook: 'Leak or grow.' },
  { id: 'c08', topic: 'Pathology', q: 'Why does retinal ischemia raise VEGF?', a: 'Hypoxia upregulates VEGF, which increases vascular permeability and stimulates new vessel growth.', hook: 'Hypoxia → VEGF → leak + grow.' },
  { id: 'c09', topic: 'Pathology', q: 'What causes a hard exudate?', a: 'Chronic leakage of lipid and protein from damaged retinal vessels.', hook: 'Hard = lipid = leak.' },
  { id: 'c10', topic: 'Treatment', q: 'What is first-line therapy for center-involving diabetic macular edema?', a: 'Anti-VEGF intravitreal injections.', hook: 'Leaky center → anti-VEGF.' },
  { id: 'c11', topic: 'Treatment', q: 'What are options for non-center-involving DME?', a: 'Observation or focal/grid laser, individualized; anti-VEGF may be considered if vision is threatened. Treat systemic risk factors.', hook: 'Not center? Individualize.' },
  { id: 'c12', topic: 'Treatment', q: 'What is the goal of panretinal photocoagulation (PRP)?', a: 'Ablate ischemic peripheral retina to reduce VEGF drive and prevent severe visual loss in high-risk PDR.', hook: 'Burn periphery to protect the center.' },
  { id: 'c13', topic: 'Treatment', q: 'When is vitrectomy considered in PDR?', a: 'Non-clearing vitreous hemorrhage, tractional retinal detachment, or severe fibrovascular proliferation.', hook: 'Blood or traction → vitrectomy.' },
  { id: 'c14', topic: 'Treatment', q: 'How does anti-VEGF treat diabetic eye disease?', a: 'It blocks VEGF-mediated permeability (reduces edema) and neovascularization.', hook: 'VEGF: Very Edematous Growth Factor.' },
  { id: 'c15', topic: 'Screening', q: 'When should screening start in type 1 diabetes?', a: 'Five years after diagnosis, then annually if no retinopathy.', hook: 'Type 1 waits five.' },
  { id: 'c16', topic: 'Screening', q: 'When should screening start in type 2 diabetes?', a: 'At the time of diagnosis, then annually if no retinopathy.', hook: 'Type 2 starts now.' },
  { id: 'c17', topic: 'Screening', q: 'How is screening handled in pregnancy with pregestational diabetes?', a: 'Screen before conception or in the first trimester, monitor during pregnancy, and recheck postpartum.', hook: 'Before or early — then monitor.' },
  { id: 'c18', topic: 'Screening', q: 'What systemic factors should be optimized in every patient with DR?', a: 'Glucose/HbA1c, blood pressure, lipids, smoking cessation, and management of nephropathy.', hook: 'Sugar, pressure, lipids, smoking, kidney.' },
  { id: 'c19', topic: 'Exam', q: 'A patient with PDR has sudden painless vision loss and new floaters. What is the likely cause?', a: 'Vitreous hemorrhage from fragile neovascularization.', hook: 'Sudden floaters = VH until proven otherwise.' },
  { id: 'c20', topic: 'Exam', q: 'A patient with diabetes reports distorted vision (metamorphopsia). What should you suspect?', a: 'Diabetic macular edema involving the center of the macula.', hook: 'Distortion = macular fluid.' }
];

const CARD_KEY = 'drCardProgressV1';
let cardProgress = store.get(CARD_KEY, {});
if (!cardProgress || typeof cardProgress !== 'object' || Array.isArray(cardProgress)) {
  cardProgress = {};
}

let currentTopic = 'all';
let session = [];
let sessionIndex = 0;
let sessionMode = 'due';
let isFlipped = false;

const flashcardEl = $('#flashcard');
const recallComplete = $('#recallComplete');
const completeCopy = $('#completeCopy');
const ratingRow = $('#ratingRow');
const ratingButtons = $$('.rating');
const dueStat = $('#dueStat');
const learnedStat = $('#learnedStat');
const deckMode = $('#deckMode');
const cardTopic = $('#cardTopic');
const cardBackTopic = $('#cardBackTopic');
const cardCounter = $('#cardCounter');
const cardQuestion = $('#cardQuestion');
const cardAnswer = $('#cardAnswer');
const cardHook = $('#cardHook');

function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getTopicCards(topic = currentTopic) {
  return flashcardData.filter((card) => topic === 'all' || card.topic === topic);
}

function getDueCards(topic = 'all') {
  const now = Date.now();
  return getTopicCards(topic).filter((card) => {
    const progress = cardProgress[card.id];
    return !progress || progress.due <= now;
  });
}

function updateStats() {
  const due = getDueCards('all').length;
  const learned = flashcardData.filter((card) => {
    const progress = cardProgress[card.id];
    return progress && progress.box >= 2;
  }).length;
  dueStat.textContent = due;
  learnedStat.textContent = learned;
}

function updateDeckMode() {
  if (!session.length) {
    deckMode.textContent = 'No cards';
    return;
  }
  const label = sessionMode === 'due' ? 'Due' : 'Practice';
  deckMode.textContent = `${label} · ${session.length} card${session.length === 1 ? '' : 's'}`;
}

function setFlipped(value) {
  isFlipped = value;
  flashcardEl.classList.toggle('is-flipped', value);
  flashcardEl.setAttribute('aria-label', value
    ? 'Flashcard answer shown. Activate to hide answer.'
    : 'Flashcard. Activate to reveal answer.');
  ratingButtons.forEach((button) => { button.disabled = !value; });
}

function renderCard() {
  if (sessionIndex >= session.length) {
    showComplete();
    return;
  }

  const card = session[sessionIndex];
  flashcardEl.hidden = false;
  recallComplete.hidden = true;
  ratingRow.hidden = false;
  cardTopic.textContent = card.topic;
  cardBackTopic.textContent = card.topic;
  cardCounter.textContent = `${sessionIndex + 1} / ${session.length}`;
  cardQuestion.textContent = card.q;
  cardAnswer.textContent = card.a;
  cardHook.textContent = card.hook;
  updateDeckMode();
  setFlipped(false);
}

function showComplete() {
  flashcardEl.hidden = true;
  recallComplete.hidden = false;
  ratingRow.hidden = true;

  const nextDue = flashcardData
    .map((card) => cardProgress[card.id] && cardProgress[card.id].due)
    .filter((time) => typeof time === 'number' && time > Date.now())
    .sort((a, b) => a - b)[0];

  const nextLabel = nextDue
    ? new Date(nextDue).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'later';

  completeCopy.textContent = sessionMode === 'due'
    ? `You cleared all due cards. Next review: ${nextLabel}.`
    : 'Practice pass complete. Your ratings updated the review schedule.';
}

function buildSession(forcePractice = false) {
  const topicCards = getTopicCards();
  const due = getDueCards();

  if (forcePractice || due.length === 0) {
    session = shuffle(topicCards);
    sessionMode = 'practice';
  } else {
    session = shuffle(due);
    sessionMode = 'due';
  }

  sessionIndex = 0;
  updateDeckMode();
  updateStats();
  renderCard();
}

function rateCard(rating) {
  if (!isFlipped || sessionIndex >= session.length) return;
  const card = session[sessionIndex];
  const old = cardProgress[card.id] || { seen: 0 };
  const choices = {
    again: { box: 0, delay: 10 * 60 * 1000 },
    hard: { box: 1, delay: 1 * 24 * 60 * 60 * 1000 },
    good: { box: 2, delay: 3 * 24 * 60 * 60 * 1000 },
    easy: { box: 3, delay: 7 * 24 * 60 * 60 * 1000 }
  };
  const choice = choices[rating];
  if (!choice) return;

  cardProgress[card.id] = {
    box: choice.box,
    due: Date.now() + choice.delay,
    seen: (old.seen || 0) + 1,
    last: Date.now()
  };
  store.set(CARD_KEY, cardProgress);

  sessionIndex += 1;
  setFlipped(false);
  renderCard();
  updateStats();
}

flashcardEl.addEventListener('click', () => {
  if (sessionIndex >= session.length) return;
  setFlipped(!isFlipped);
});

flashcardEl.addEventListener('keydown', (event) => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    setFlipped(!isFlipped);
  }
});

ratingButtons.forEach((button) => {
  button.addEventListener('click', () => rateCard(button.dataset.rating));
});

$$('.filter-chip').forEach((button) => {
  button.addEventListener('click', () => {
    currentTopic = button.dataset.topic;
    $$('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip === button));
    buildSession(false);
  });
});

$('#shuffleBtn').addEventListener('click', () => {
  if (sessionIndex >= session.length) {
    buildSession(true);
    return;
  }
  session = shuffle(session);
  sessionIndex = 0;
  setFlipped(false);
  renderCard();
});

$('#reviewAgain').addEventListener('click', () => buildSession(true));

$('#resetRecall').addEventListener('click', () => {
  const shouldReset = window.confirm('Reset all flashcard scheduling in this browser?');
  if (!shouldReset) return;
  cardProgress = {};
  store.remove(CARD_KEY);
  buildSession(false);
  updateStats();
});

document.addEventListener('keydown', (event) => {
  if (event.target.closest('input, textarea, select, button, a, summary')) return;
  if (!isFlipped || sessionIndex >= session.length) return;
  const recallSection = $('#recall');
  const rect = recallSection.getBoundingClientRect();
  if (rect.top > window.innerHeight * 0.8 || rect.bottom < window.innerHeight * 0.2) return;
  const map = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
  if (map[event.key]) {
    event.preventDefault();
    rateCard(map[event.key]);
  }
});

buildSession(false);
updateStats();

/* --------------------------------------------------------------------------
   Quiz
   -------------------------------------------------------------------------- */
const quizData = [
  {
    q: 'Which lesion is the earliest visible sign of diabetic retinopathy?',
    options: ['Hard exudate', 'Microaneurysm', 'Cotton-wool spot', 'Neovascularization'],
    correct: 1,
    explain: 'Microaneurysms are the first ophthalmoscopic lesion. Mild NPDR is defined as microaneurysms only.'
  },
  {
    q: 'Which finding defines proliferative diabetic retinopathy?',
    options: ['Dot–blot hemorrhages', 'Venous beading', 'Neovascularization', 'Hard exudates'],
    correct: 2,
    explain: 'PDR is defined by neovascularization (NVD or NVE). Vitreous hemorrhage is a complication, not the definition.'
  },
  {
    q: 'A fundus shows hemorrhages in all four quadrants but no other 4-2-1 criteria. What is the stage?',
    options: ['Moderate NPDR', 'Severe NPDR', 'Very severe NPDR', 'PDR'],
    correct: 1,
    explain: 'Any one 4-2-1 criterion = severe NPDR. Two or more criteria = very severe NPDR.'
  },
  {
    q: 'What is first-line treatment for center-involving diabetic macular edema?',
    options: ['Panretinal photocoagulation', 'Anti-VEGF injections', 'Vitrectomy', 'Observation only'],
    correct: 1,
    explain: 'Anti-VEGF is first-line for center-involving DME. Focal laser is an option for non-center-involving disease.'
  },
  {
    q: 'When should a patient with newly diagnosed type 2 diabetes be screened for retinopathy?',
    options: ['At diagnosis', 'After 1 year', 'After 5 years', 'Only if vision symptoms'],
    correct: 0,
    explain: 'Type 2 diabetes may be present for years before diagnosis, so screen at diagnosis.'
  },
  {
    q: 'When should screening begin in type 1 diabetes?',
    options: ['At diagnosis', 'After 1 year', 'After 5 years', 'At puberty only'],
    correct: 2,
    explain: 'Start 5 years after diagnosis in type 1 diabetes, then annually if normal.'
  },
  {
    q: 'A patient with PDR develops sudden painless vision loss and floaters. What is the most likely cause?',
    options: ['Central retinal artery occlusion', 'Vitreous hemorrhage', 'Optic neuritis', 'Cataract'],
    correct: 1,
    explain: 'Fragile new vessels can bleed into the vitreous, causing sudden floaters and vision loss.'
  },
  {
    q: 'Which is NOT a feature of nonproliferative diabetic retinopathy?',
    options: ['Microaneurysms', 'Cotton-wool spots', 'Venous beading', 'Neovascularization'],
    correct: 3,
    explain: 'Neovascularization defines proliferative disease.'
  },
  {
    q: 'What is the main goal of panretinal photocoagulation?',
    options: ['Improve central acuity', 'Reduce VEGF drive from ischemic retina', 'Remove vitreous blood', 'Treat macular edema directly'],
    correct: 1,
    explain: 'PRP ablates ischemic peripheral retina, lowering VEGF and reducing the risk of severe visual loss.'
  },
  {
    q: 'A pregnant patient with pregestational diabetes has no known retinopathy. When should she be screened?',
    options: ['Only after delivery', 'Before conception or in the first trimester', 'Only in the third trimester', 'Only if she has visual symptoms'],
    correct: 1,
    explain: 'Screen before conception or in the first trimester, monitor during pregnancy, and recheck postpartum.'
  }
];

const QUIZ_KEY = 'drQuizBestV1';
const quizBody = $('#quizBody');
const quizProgress = $('#quizProgress');
const quizBestLabel = $('#quizBest');
const quizBar = $('#quizBar');
const quizFooter = $('#quizFooter');
const quizLive = $('#quizLive');
const quizNext = $('#quizNext');
const fullQuizOrder = quizData.map((_, index) => index);

let quizOrder = fullQuizOrder.slice();
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let quizMissed = new Set();
let quizBest = store.get(QUIZ_KEY, null);

function updateQuizBest() {
  quizBestLabel.textContent = typeof quizBest === 'number'
    ? `Best: ${quizBest}/${quizData.length}`
    : 'Best: —';
}

function startQuiz(order = fullQuizOrder) {
  quizOrder = order.slice();
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;
  quizMissed = new Set();
  quizFooter.hidden = false;
  quizLive.textContent = '';
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const question = quizData[quizOrder[quizIndex]];
  quizAnswered = false;
  quizProgress.textContent = `Question ${quizIndex + 1} of ${quizOrder.length}`;
  quizBar.style.width = `${((quizIndex + 1) / quizOrder.length) * 100}%`;
  quizNext.disabled = true;
  quizNext.textContent = quizIndex === quizOrder.length - 1 ? 'See results' : 'Next question';
  quizLive.textContent = '';

  quizBody.innerHTML = `
    <h3 class="quiz-question">${question.q}</h3>
    <div class="quiz-options">
      ${question.options.map((option, index) => `
        <button class="quiz-option" type="button" data-option="${index}">
          <span class="letter">${'ABCD'[index]}</span>
          <span>${option}</span>
        </button>
      `).join('')}
    </div>
    <div class="quiz-explain" id="quizExplain" hidden></div>
  `;

  $$('.quiz-option', quizBody).forEach((button) => {
    button.addEventListener('click', () => answerQuiz(Number(button.dataset.option)));
  });
}

function answerQuiz(choice) {
  if (quizAnswered) return;
  quizAnswered = true;

  const question = quizData[quizOrder[quizIndex]];
  const correct = choice === question.correct;
  const options = $$('.quiz-option', quizBody);

  options.forEach((button, index) => {
    button.disabled = true;
    if (index === question.correct) button.classList.add('correct');
    if (index === choice && !correct) button.classList.add('wrong');
  });

  if (correct) {
    quizScore += 1;
    quizLive.textContent = 'Correct.';
  } else {
    quizMissed.add(quizOrder[quizIndex]);
    quizLive.textContent = `Not quite — the answer is ${'ABCD'[question.correct]}.`;
  }

  const explanation = $('#quizExplain');
  explanation.hidden = false;
  explanation.innerHTML = `<strong>${correct ? 'Correct.' : 'Why:'}</strong> ${question.explain}`;
  quizNext.disabled = false;
}

function showQuizResults() {
  const total = quizOrder.length;
  const isFullQuiz = total === quizData.length;
  const percent = total ? quizScore / total : 0;

  if (isFullQuiz && (typeof quizBest !== 'number' || quizScore > quizBest)) {
    quizBest = quizScore;
    store.set(QUIZ_KEY, quizBest);
    updateQuizBest();
  }

  let title = 'Keep going.';
  let copy = 'Revisit the staging and treatment sections, then try again.';
  if (percent >= 0.9) {
    title = 'Retina-ready.';
    copy = 'You have the core staging and management logic. Re-test in a few days to keep it automatic.';
  } else if (percent >= 0.7) {
    title = 'Strong pass.';
    copy = 'A few details are still slippery. Check the explanations for the missed questions, then retry.';
  }

  quizProgress.textContent = 'Session complete';
  quizBar.style.width = '100%';
  quizFooter.hidden = true;
  quizBody.innerHTML = `
    <div class="quiz-result">
      <span class="score">${quizScore}<small>/${total}</small></span>
      <h3>${title}</h3>
      <p>${copy}</p>
      <div class="quiz-actions">
        <button class="btn btn-small" type="button" id="retryAll">Retry all</button>
        ${quizMissed.size ? '<button class="btn btn-small btn-outline" type="button" id="retryMissed">Retry missed</button>' : ''}
      </div>
    </div>
  `;

  $('#retryAll').addEventListener('click', () => startQuiz(fullQuizOrder));
  const retryMissed = $('#retryMissed');
  if (retryMissed) {
    retryMissed.addEventListener('click', () => {
      const missed = Array.from(quizMissed);
      startQuiz(missed);
    });
  }
}

quizNext.addEventListener('click', () => {
  if (!quizAnswered) return;
  quizIndex += 1;
  if (quizIndex >= quizOrder.length) {
    showQuizResults();
  } else {
    renderQuizQuestion();
  }
});

updateQuizBest();
startQuiz();



