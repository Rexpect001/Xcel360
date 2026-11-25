/**
 * Topic landing pages: /scholarships/{slug}.
 *
 * Each topic is a curated search people actually make ("fully funded masters
 * scholarships in the UK"), matched against live listings with tolerant rules,
 * because listing data is written by hand ("USA" vs "United States",
 * "Masters" vs "Master's", most field values are just "STEM").
 *
 * Guidance text sticks to facts that hold year to year (programme names, typical
 * course length, how funding usually works). Deadlines and amounts change every
 * cycle, so they come from the live listings, never from this file.
 *
 * A topic with fewer than MIN_TOPIC_LISTINGS live listings is noindexed, left out
 * of the sitemap and not linked from the hub, so Google never sees thin pages.
 */

export const MIN_TOPIC_LISTINGS = 3

/** The listing fields topic matching needs. */
export interface TopicListing {
  title: string
  hostOrg: string
  country: string
  fundingType: string
  field: string
  fieldTags: string[]
  programLevel: string[]
}

export type TopicKind = 'level' | 'country' | 'field'

export interface ScholarshipTopic {
  slug: string
  kind: TopicKind
  /** Short name for links and chips. */
  label: string
  h1: string
  /** <title>; the layout appends " - Xcel360", so keep this under ~48 characters. */
  title: string
  /** Meta description, under ~155 characters. */
  description: string
  intro: string[]
  tips: string[]
  match: (o: TopicListing) => boolean
  related: string[]
}

// ── Matching helpers ─────────────────────────────────────────────────────────

const LEVEL = {
  masters: /master|\bmsc\b|\bma\b|\bmba\b|\bllm\b/i,
  phd: /ph\.?d|doctora/i,
  undergrad: /undergrad|bachelor/i,
  postdoc: /postdoc/i,
}
// Levels can be one value per entry ("PhD") or several in one ("Master's/PhD").
// "Postdoctoral" contains "doctora", so it never counts as a PhD on its own.
const hasLevel = (o: TopicListing, level: keyof typeof LEVEL) =>
  o.programLevel.some((entry) => entry.split(/[/,&]|\band\b/i).some((l) => LEVEL[level].test(l) && !(level === 'phd' && LEVEL.postdoc.test(l))))

const COUNTRY = {
  uk: /united kingdom|\bu\.?k\.?\b|england|scotland|wales|britain/i,
  usa: /united states|\bu\.?s\.?a?\b|\bamerica\b/i,
  canada: /canada/i,
  germany: /germany|deutschland/i,
  australia: /australia/i,
  china: /\bchina\b|hong kong/i,
  japan: /japan/i,
  netherlands: /netherlands|holland/i,
}
const inCountry = (o: TopicListing, c: keyof typeof COUNTRY) => COUNTRY[c].test(o.country)

const EUROPE_COUNTRIES = /europe|germany|france|italy|spain|portugal|netherlands|belgium|sweden|denmark|norway|finland|ireland|austria|switzerland|poland|greece|czech|hungary|lithuania|latvia|estonia|slovakia|slovenia|croatia|serbia|romania|bulgaria|iceland|luxembourg|malta|cyprus/i
/** Study in Europe, including joint master's that rotate between European universities. */
const inEurope = (o: TopicListing) =>
  EUROPE_COUNTRIES.test(o.country) ||
  /mobility (route|semester)/i.test(o.country) ||
  /erasmus|consortium/i.test(`${o.title} ${o.hostOrg}`)

const fullyFunded = (o: TopicListing) => /full/i.test(o.fundingType)
const text = (o: TopicListing) => `${o.title} ${o.field} ${o.fieldTags.join(' ')}`
const about = (o: TopicListing, re: RegExp) => re.test(text(o))

// ── Shared guidance ──────────────────────────────────────────────────────────

const CHECK_ELIGIBILITY = 'Read the eligibility section of every listing before you apply. Nationality, age, work experience and language rules differ from one scholarship to the next.'
const START_EARLY = 'Start three to six months before a deadline. References, transcripts and language test results take the longest to arrive.'
const TAILOR = 'Tailor your CV and statement of purpose to each scholarship. Our free writing tools can draft them from your own details.'

// ── Topics ───────────────────────────────────────────────────────────────────

export const SCHOLARSHIP_TOPICS: ScholarshipTopic[] = [
  // Levels
  {
    slug: 'fully-funded-masters-scholarships',
    kind: 'level',
    label: "Fully funded master's",
    h1: "Fully Funded Master's Scholarships",
    title: "Fully Funded Master's Scholarships",
    description: "Open fully funded master's scholarships for African students, with tuition and living costs covered. Updated daily with live deadlines.",
    intro: [
      "A fully funded master's scholarship normally covers tuition and a monthly living allowance, and many also pay for travel, insurance and visa costs. What counts as \"fully funded\" still varies, so check the coverage section of each listing.",
      "Most of the master's funding on Xcel360 comes from government programmes, universities and joint European master's that move students between partner universities. Every listing below is open now.",
    ],
    tips: [
      'Joint European master\'s programmes often take applications months before the September start, so look early.',
      'Many funders want a clear link between the degree and your plans after graduation. Say what you will do and where.',
      TAILOR,
      CHECK_ELIGIBILITY,
    ],
    match: (o) => hasLevel(o, 'masters') && fullyFunded(o),
    related: ['scholarships-in-europe', 'masters-scholarships-in-uk', 'fully-funded-phd-scholarships', 'engineering-scholarships'],
  },
  {
    slug: 'fully-funded-phd-scholarships',
    kind: 'level',
    label: 'Fully funded PhD',
    h1: 'Fully Funded PhD Scholarships',
    title: 'Fully Funded PhD Scholarships',
    description: 'Open fully funded PhD scholarships and doctoral positions for African students, with tuition and a stipend covered. Live deadlines, updated daily.',
    intro: [
      'Fully funded PhD places usually cover tuition and pay a stipend for the length of the programme. In many countries the funding is attached to a specific project or supervisor rather than awarded separately.',
      'That means your research fit matters as much as your grades. The listings below are open now; many expect you to contact a potential supervisor before applying.',
    ],
    tips: [
      'Read the supervisor\'s recent papers and write a short, specific email before you apply. Our cold email tool can help.',
      'Prepare a research proposal you can adapt: a clear question, why it matters, and the methods you would use.',
      'A research master\'s or a published thesis strengthens a PhD application more than extra coursework.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => hasLevel(o, 'phd') && fullyFunded(o),
    related: ['phd-scholarships-in-uk', 'phd-scholarships-in-usa', 'postdoctoral-fellowships', 'fully-funded-masters-scholarships'],
  },
  {
    slug: 'undergraduate-scholarships',
    kind: 'level',
    label: 'Undergraduate',
    h1: 'Undergraduate Scholarships for African Students',
    title: 'Undergraduate Scholarships Abroad',
    description: 'Open undergraduate and bachelor\'s scholarships for African students to study abroad. See what each covers and apply before the deadline.',
    intro: [
      'Undergraduate scholarships for international students are fewer than postgraduate ones, and competition is strong. Government programmes and individual universities offer most of them.',
      'Some cover everything; others reduce tuition only. The listings below show the funding type, so you can see at a glance what each one pays for.',
    ],
    tips: [
      'Your secondary school results, a strong personal statement and teacher references carry most of the weight.',
      'Check whether the university needs a foundation year or extra exams for your school certificate.',
      'Apply to several schemes at once; undergraduate awards are very competitive.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => hasLevel(o, 'undergrad'),
    related: ['scholarships-in-uk', 'scholarships-in-usa', 'scholarships-in-china', 'fully-funded-masters-scholarships'],
  },
  {
    slug: 'postdoctoral-fellowships',
    kind: 'level',
    label: 'Postdoctoral',
    h1: 'Postdoctoral Fellowships',
    title: 'Postdoctoral Fellowships',
    description: 'Open postdoctoral fellowships and research positions for early-career researchers from Africa. Live deadlines, updated daily.',
    intro: [
      'Postdoctoral fellowships fund early-career researchers, usually within a few years of finishing a PhD, to lead their own research at a host institution.',
      'Most ask for a research proposal and a letter of support from the host. The fellowships below are open now.',
    ],
    tips: [
      'Agree a project with your host before you apply; many funders ask for the host\'s letter.',
      'Show what you will publish during the fellowship and how it builds on your PhD.',
      'Check the eligibility window: many fellowships count the years since your PhD was awarded.',
    ],
    match: (o) => hasLevel(o, 'postdoc'),
    related: ['fully-funded-phd-scholarships', 'scholarships-in-europe', 'scholarships-in-uk'],
  },

  // Countries
  {
    slug: 'scholarships-in-uk',
    kind: 'country',
    label: 'United Kingdom',
    h1: 'Scholarships to Study in the UK',
    title: 'Scholarships in the UK for Africans',
    description: 'Open scholarships to study in the United Kingdom, from government awards to university funding. Master\'s, PhD and undergraduate, live deadlines.',
    intro: [
      'The UK is one of the most popular study destinations for African students. Taught master\'s degrees usually last one year, which keeps living costs lower than in many countries.',
      'Major schemes include Chevening (the UK government\'s master\'s scholarship) and Commonwealth Scholarships for citizens of eligible Commonwealth countries. Many universities also run their own awards. Listings below include programmes with a UK stay.',
    ],
    tips: [
      'Most UK courses need an English test such as IELTS, unless your previous degree was taught in English. Check each course.',
      'Some awards need an offer of admission before you apply for funding; others let you apply in parallel.',
      TAILOR,
      CHECK_ELIGIBILITY,
    ],
    match: (o) => inCountry(o, 'uk'),
    related: ['masters-scholarships-in-uk', 'phd-scholarships-in-uk', 'scholarships-in-europe', 'scholarships-in-usa'],
  },
  {
    slug: 'scholarships-in-usa',
    kind: 'country',
    label: 'United States',
    h1: 'Scholarships to Study in the USA',
    title: 'Scholarships in the USA for Africans',
    description: 'Open scholarships to study in the United States for African students: graduate funding, fellowships and university awards with live deadlines.',
    intro: [
      'In the United States, graduate funding often comes through the university: PhD students are commonly funded by teaching or research assistantships that cover tuition and pay a stipend.',
      'The Fulbright Foreign Student Program, run through US embassies and commissions, funds graduate study for students from many countries. The listings below are open now.',
    ],
    tips: [
      'Check whether each programme needs the GRE or GMAT; many have dropped it, but not all.',
      'US applications usually ask for a statement of purpose and three recommendation letters.',
      'For PhDs, ask the department how students are funded before you apply.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => inCountry(o, 'usa'),
    related: ['masters-scholarships-in-usa', 'phd-scholarships-in-usa', 'scholarships-in-canada', 'scholarships-in-uk'],
  },
  {
    slug: 'scholarships-in-canada',
    kind: 'country',
    label: 'Canada',
    h1: 'Scholarships to Study in Canada',
    title: 'Scholarships in Canada for Africans',
    description: 'Open scholarships to study in Canada for African students: master\'s, PhD and university awards with live deadlines, updated daily.',
    intro: [
      'In Canada, research master\'s and PhD students are often funded by their supervisor\'s grants, teaching assistantships and university awards combined into one package.',
      'Finding a supervisor who has funding is often the first step. The listings below are open now.',
    ],
    tips: [
      'Email potential supervisors with a short, specific note about their research before the application deadline.',
      'Ask what the funding package includes and for how many years.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => inCountry(o, 'canada'),
    related: ['scholarships-in-usa', 'fully-funded-phd-scholarships', 'scholarships-in-uk'],
  },
  {
    slug: 'scholarships-in-germany',
    kind: 'country',
    label: 'Germany',
    h1: 'Scholarships to Study in Germany',
    title: 'Scholarships in Germany for Africans',
    description: 'Open scholarships to study in Germany, including DAAD and university funding for master\'s and PhD students from Africa. Live deadlines.',
    intro: [
      'Most public universities in Germany charge little or no tuition, though some states charge international students fees and every student pays a semester contribution. Scholarships mainly help with living costs.',
      'The DAAD (German Academic Exchange Service) is the largest funder of international students in Germany. The listings below are open now.',
    ],
    tips: [
      'Check the language of instruction: many master\'s programmes are taught in English, but not all.',
      'You may need to show proof of funds for your visa, often through a blocked bank account, unless a scholarship covers it.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => inCountry(o, 'germany'),
    related: ['scholarships-in-europe', 'scholarships-in-netherlands', 'fully-funded-phd-scholarships'],
  },
  {
    slug: 'scholarships-in-australia',
    kind: 'country',
    label: 'Australia',
    h1: 'Scholarships to Study in Australia',
    title: 'Scholarships in Australia for Africans',
    description: 'Open scholarships to study in Australia for African students, from government awards to university research scholarships. Live deadlines.',
    intro: [
      'Australia Awards scholarships, funded by the Australian government, support students from selected developing countries. Universities also offer research scholarships for master\'s by research and PhD students.',
      'The listings below are open now and show what each one covers.',
    ],
    tips: [
      'For research degrees, contact a potential supervisor before you apply.',
      'Check which Australia Awards countries and fields are open in the current round.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => inCountry(o, 'australia'),
    related: ['fully-funded-phd-scholarships', 'scholarships-in-uk', 'scholarships-in-canada'],
  },
  {
    slug: 'scholarships-in-china',
    kind: 'country',
    label: 'China',
    h1: 'Scholarships to Study in China',
    title: 'Scholarships in China for Africans',
    description: 'Open scholarships to study in China for African students: government and university awards for bachelor\'s, master\'s and PhD. Live deadlines.',
    intro: [
      'The Chinese Government Scholarship is the best-known route, and many universities and provinces run their own awards. Funding often covers tuition, accommodation and a monthly stipend.',
      'Many programmes are taught in English; Chinese-taught programmes usually ask for an HSK language certificate. The listings below are open now.',
    ],
    tips: [
      'Check whether you apply through the university, the embassy, or both.',
      'Some programmes need a pre-admission letter from a supervisor; ask early.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => inCountry(o, 'china'),
    related: ['scholarships-in-japan', 'undergraduate-scholarships', 'fully-funded-masters-scholarships'],
  },
  {
    slug: 'scholarships-in-japan',
    kind: 'country',
    label: 'Japan',
    h1: 'Scholarships to Study in Japan',
    title: 'Scholarships in Japan for Africans',
    description: 'Open scholarships to study in Japan for African students, including MEXT and university awards. Bachelor\'s, master\'s and PhD, live deadlines.',
    intro: [
      'The Japanese government\'s MEXT scholarship is offered through embassies and through university recommendation, and covers tuition, a monthly allowance and travel.',
      'Many graduate programmes are taught in English. The listings below are open now.',
    ],
    tips: [
      'For the embassy route, watch your local Japanese embassy\'s announcements; the timing differs by country.',
      'Research students should identify a supervisor and a research plan early.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => inCountry(o, 'japan'),
    related: ['scholarships-in-china', 'fully-funded-masters-scholarships', 'fully-funded-phd-scholarships'],
  },
  {
    slug: 'scholarships-in-netherlands',
    kind: 'country',
    label: 'Netherlands',
    h1: 'Scholarships to Study in the Netherlands',
    title: 'Scholarships in the Netherlands',
    description: 'Open scholarships to study in the Netherlands for African students, from university excellence awards to joint programmes. Live deadlines.',
    intro: [
      'Dutch universities teach many master\'s programmes in English. Much of the funding is university-based, and some awards cover tuition only, so check what each one pays for.',
      'The listings below are open now.',
    ],
    tips: [
      'Look at the funding type on each listing: partial awards are common.',
      'Apply for admission early; some scholarships need you to be admitted first.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => inCountry(o, 'netherlands'),
    related: ['scholarships-in-europe', 'scholarships-in-germany', 'fully-funded-masters-scholarships'],
  },
  {
    slug: 'scholarships-in-europe',
    kind: 'country',
    label: 'Europe',
    h1: "Scholarships to Study in Europe, Including Joint Master's",
    title: "Scholarships in Europe & Joint Master's",
    description: "Open scholarships across Europe, including fully funded joint master's that move you between universities in two or more countries. Live deadlines.",
    intro: [
      "Many of the scholarships on Xcel360 are joint master's programmes run by groups of European universities. Students spend semesters at two or more partner universities and graduate with a joint or multiple degree. Erasmus Mundus Joint Masters are the best-known example.",
      'Scholarships for these programmes are often fully funded, with tuition, travel and a monthly allowance. The listings below are open now, along with single-country awards across Europe.',
    ],
    tips: [
      'You apply directly to the programme consortium, and one application often covers both admission and the scholarship.',
      "Joint master's usually take applications months before a September start, so start early.",
      'Explain why the specific mobility route and partner universities fit your goals.',
      CHECK_ELIGIBILITY,
    ],
    match: inEurope,
    related: ['fully-funded-masters-scholarships', 'scholarships-in-germany', 'scholarships-in-uk', 'environment-and-climate-scholarships'],
  },

  // Level x country
  {
    slug: 'masters-scholarships-in-uk',
    kind: 'country',
    label: "Master's in the UK",
    h1: "Master's Scholarships in the UK",
    title: "Master's Scholarships in the UK",
    description: "Open master's scholarships to study in the UK for African students, including fully funded government and university awards. Live deadlines.",
    intro: [
      "UK taught master's degrees usually last one year, so a scholarship covers a shorter, more affordable programme than in many countries.",
      'Chevening and Commonwealth Scholarships are major routes for African applicants, alongside university awards. The listings below are open now.',
    ],
    tips: [
      'Chevening asks about leadership and networking; prepare specific examples.',
      'Check whether you need an offer of admission before the scholarship deadline.',
      TAILOR,
      CHECK_ELIGIBILITY,
    ],
    match: (o) => hasLevel(o, 'masters') && inCountry(o, 'uk'),
    related: ['scholarships-in-uk', 'phd-scholarships-in-uk', 'fully-funded-masters-scholarships'],
  },
  {
    slug: 'phd-scholarships-in-uk',
    kind: 'country',
    label: 'PhD in the UK',
    h1: 'PhD Scholarships in the UK',
    title: 'PhD Scholarships in the UK',
    description: 'Open PhD scholarships and funded doctoral positions in the UK for African students, with tuition and stipend. Live deadlines, updated daily.',
    intro: [
      'A UK PhD usually takes three to four years. Many funded places are tied to a specific project, while others let you propose your own research.',
      'Commonwealth PhD Scholarships and university studentships are common routes. The listings below are open now.',
    ],
    tips: [
      'For project-based PhDs, read the project description closely and match your experience to it.',
      'For open PhDs, contact a supervisor with a short research proposal first.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => hasLevel(o, 'phd') && inCountry(o, 'uk'),
    related: ['scholarships-in-uk', 'masters-scholarships-in-uk', 'fully-funded-phd-scholarships'],
  },
  {
    slug: 'masters-scholarships-in-usa',
    kind: 'country',
    label: "Master's in the USA",
    h1: "Master's Scholarships in the USA",
    title: "Master's Scholarships in the USA",
    description: "Open master's scholarships to study in the United States for African students: fellowships and university awards with live deadlines.",
    intro: [
      "US master's degrees usually take two years. Full funding is rarer at master's level than for PhDs, so look closely at what each scholarship covers.",
      'The Fulbright Foreign Student Program is a major route for graduate study. The listings below are open now.',
    ],
    tips: [
      'Compare the full cost of attendance (tuition plus living costs) with what the scholarship pays.',
      'Ask departments about assistantships, which can cover tuition for some master\'s students.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => hasLevel(o, 'masters') && inCountry(o, 'usa'),
    related: ['scholarships-in-usa', 'phd-scholarships-in-usa', 'fully-funded-masters-scholarships'],
  },
  {
    slug: 'phd-scholarships-in-usa',
    kind: 'country',
    label: 'PhD in the USA',
    h1: 'PhD Scholarships in the USA',
    title: 'PhD Scholarships in the USA',
    description: 'Open PhD scholarships and funded doctoral programmes in the United States for African students, with tuition and stipend. Live deadlines.',
    intro: [
      'Most US PhD programmes admit students with a full funding package: tuition is waived and a stipend is paid in return for teaching or research work.',
      'US PhDs usually last five years or more and include coursework before the research stage. The listings below are open now.',
    ],
    tips: [
      'Your statement of purpose should name the faculty you want to work with and why.',
      'Ask current students about funding and support; departments differ a lot.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => hasLevel(o, 'phd') && inCountry(o, 'usa'),
    related: ['scholarships-in-usa', 'masters-scholarships-in-usa', 'fully-funded-phd-scholarships'],
  },

  // Fields
  {
    slug: 'engineering-scholarships',
    kind: 'field',
    label: 'Engineering',
    h1: 'Engineering Scholarships',
    title: 'Engineering Scholarships for Africans',
    description: 'Open engineering scholarships for African students: civil, mechanical, electrical, energy and more, at master\'s and PhD level. Live deadlines.',
    intro: [
      'Engineering is one of the best-funded fields for international students, especially at master\'s and PhD level, where many places are linked to research projects.',
      'The listings below are open now and match engineering in the title or field.',
    ],
    tips: [
      'Describe projects by what you built or analysed, the tools you used and the result.',
      'Accreditation matters if you plan to register as an engineer; check it for professional programmes.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => about(o, /engineer/i),
    related: ['computer-science-and-ai-scholarships', 'environment-and-climate-scholarships', 'fully-funded-masters-scholarships'],
  },
  {
    slug: 'computer-science-and-ai-scholarships',
    kind: 'field',
    label: 'Computer science & AI',
    h1: 'Computer Science, Data and AI Scholarships',
    title: 'Computer Science & AI Scholarships',
    description: 'Open scholarships in computer science, data science, artificial intelligence and cybersecurity for African students. Live deadlines.',
    intro: [
      'Funding for computing, data science and artificial intelligence has grown quickly, from university awards to industry-backed programmes aimed at African talent.',
      'The listings below are open now and match computing, data or AI in the title or field.',
    ],
    tips: [
      'Link to a portfolio, GitHub profile or project write-up that shows what you have built.',
      'For research programmes, name the specific problem you want to work on.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => about(o, /computer|computing|informatics|data science|\bdata\b|artificial intelligence|\bAI\b|machine learning|software|cyber|robotic/i),
    related: ['engineering-scholarships', 'fully-funded-masters-scholarships', 'fully-funded-phd-scholarships'],
  },
  {
    slug: 'public-health-and-medicine-scholarships',
    kind: 'field',
    label: 'Health & medicine',
    h1: 'Public Health and Medicine Scholarships',
    title: 'Public Health & Medicine Scholarships',
    description: 'Open scholarships in public health, medicine, nursing and health sciences for African students and professionals. Live deadlines.',
    intro: [
      'Health scholarships range from public health and epidemiology master\'s to clinical and biomedical research. Many funders look for a clear plan to improve health services or research at home.',
      'The listings below are open now and match health or medicine in the title or field.',
    ],
    tips: [
      'Use concrete examples from clinical work, community health or research to show your motivation.',
      'Check whether a programme needs professional registration or clinical experience.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => about(o, /medic|health|nurs|pharm|clinical|epidemiolog|biomedic|neurosci|physiolog/i),
    related: ['fully-funded-masters-scholarships', 'scholarships-in-uk', 'scholarships-in-europe'],
  },
  {
    slug: 'agriculture-scholarships',
    kind: 'field',
    label: 'Agriculture & food',
    h1: 'Agriculture and Food Science Scholarships',
    title: 'Agriculture & Food Science Scholarships',
    description: 'Open scholarships in agriculture, food science, soil science, aquaculture and fisheries for African students. Live deadlines, updated daily.',
    intro: [
      'Agriculture and food security are priority areas for many international funders, with scholarships covering crop and soil science, aquaculture, fisheries and food systems.',
      'The listings below are open now and match agriculture or food in the title or field.',
    ],
    tips: [
      'Link your study plan to a real agricultural or food challenge in your country.',
      'Fieldwork and lab experience count; describe the methods you used.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => about(o, /agri|food|soil|aquacult|fisher|crop|forestr|veterin|livestock|horticult/i),
    related: ['environment-and-climate-scholarships', 'scholarships-in-europe', 'fully-funded-masters-scholarships'],
  },
  {
    slug: 'environment-and-climate-scholarships',
    kind: 'field',
    label: 'Environment & climate',
    h1: 'Environment and Climate Scholarships',
    title: 'Environment & Climate Scholarships',
    description: 'Open scholarships in environmental science, climate change, ecology, energy and sustainability for African students. Live deadlines.',
    intro: [
      'Climate, ecology, water and energy programmes attract funding from governments, universities and joint European master\'s alike.',
      'The listings below are open now and match environment or climate in the title or field.',
    ],
    tips: [
      'Show the environmental problem you care about and how this programme helps you work on it.',
      'GIS, data analysis and field skills are worth naming explicitly.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => about(o, /environment|climate|ecolog|sustainab|biodivers|energy|water|ocean|marine|conservation|global change/i),
    related: ['agriculture-scholarships', 'scholarships-in-europe', 'engineering-scholarships'],
  },
  {
    slug: 'business-and-economics-scholarships',
    kind: 'field',
    label: 'Business & economics',
    h1: 'Business, Economics and MBA Scholarships',
    title: 'Business & Economics Scholarships',
    description: 'Open scholarships in business, economics, finance, management and MBA programmes for African students. Live deadlines, updated daily.',
    intro: [
      'Business and economics scholarships include MBA awards, economics and finance master\'s, and management programmes. MBA funding often favours applicants with work experience.',
      'The listings below are open now and match business or economics in the title or field.',
    ],
    tips: [
      'Quantify your work results where you can: budgets managed, revenue, people led.',
      'Check whether the programme needs the GMAT or GRE.',
      CHECK_ELIGIBILITY,
    ],
    // Not plain "management": it also matches "Biodiversity Management" and similar.
    match: (o) => about(o, /business|\bmba\b|econom|financ|accounting|entrepreneur|marketing/i),
    related: ['law-and-policy-scholarships', 'fully-funded-masters-scholarships', 'scholarships-in-uk'],
  },
  {
    slug: 'law-and-policy-scholarships',
    kind: 'field',
    label: 'Law & policy',
    h1: 'Law, Policy and International Relations Scholarships',
    title: 'Law & Public Policy Scholarships',
    description: 'Open scholarships in law, public policy, governance, human rights and international relations for African students. Live deadlines.',
    intro: [
      'Law and policy scholarships include LLM programmes, public policy and governance master\'s, and international relations degrees. Many funders look for future leaders in public service.',
      'The listings below are open now and match law or policy in the title or field.',
    ],
    tips: [
      'Show the policy or legal problem you want to work on, and your experience with it so far.',
      'Leadership and public service examples carry weight; be specific about your role.',
      CHECK_ELIGIBILITY,
    ],
    match: (o) => about(o, /\blaw\b|\bllm\b|legal|polic|governance|international relations|human rights|diplomac|public administration/i),
    related: ['business-and-economics-scholarships', 'scholarships-in-uk', 'fully-funded-masters-scholarships'],
  },
]

/** An application link specific enough to identify one programme: it must have a page path. */
function programmeLink(url: string | null | undefined): string | null {
  const u = (url ?? '').trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '')
  // Bare domains (e.g. a funder's home page) are shared by genuinely different schemes.
  return u.includes('/') ? u : null
}

/**
 * Joint master's are stored once per specialisation, written either as
 * "ACES-STAR: … — Fisheries" or "Folklore: Choreomundus – …", all with the same
 * application page. Keep the first variant of each programme so a topic page lists
 * programmes, not eight near-identical cards. Run this after topic filtering so
 * the kept variant is the one that matched the topic.
 */
export function collapseVariants<T extends { title: string; applicationLink?: string | null }>(list: T[]): T[] {
  const seen = new Set<string>()
  return list.filter((o) => {
    const keys = [`t:${o.title.split(/\s+[—–]\s+/)[0].trim().toLowerCase()}`]
    const link = programmeLink(o.applicationLink)
    if (link) keys.push(`l:${link}`)
    if (keys.some((k) => seen.has(k))) return false
    keys.forEach((k) => seen.add(k))
    return true
  })
}

const BY_SLUG = new Map(SCHOLARSHIP_TOPICS.map((t) => [t.slug, t]))

export function getTopic(slug: string): ScholarshipTopic | undefined {
  return BY_SLUG.get(slug)
}

/** Level x country topics ("masters-scholarships-in-uk") are the most specific. */
const isLevelInCountry = (t: ScholarshipTopic) => /^(masters|phd)-scholarships-in-/.test(t.slug)
const SPECIFICITY: Record<TopicKind, number> = { country: 1, field: 2, level: 3 }

/** Topics a listing belongs to, most specific first: level x country, country, field, then level. */
export function topicsForListing(o: TopicListing): ScholarshipTopic[] {
  const rank = (t: ScholarshipTopic) => (isLevelInCountry(t) ? 0 : SPECIFICITY[t.kind])
  return SCHOLARSHIP_TOPICS.filter((t) => t.match(o)).sort((a, b) => rank(a) - rank(b))
}

export const TOPIC_KIND_LABEL: Record<TopicKind, string> = {
  level: 'By level',
  country: 'By destination',
  field: 'By field',
}
