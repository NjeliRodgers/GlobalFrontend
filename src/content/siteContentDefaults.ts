
export type SiteContentPageKey = 'home' | 'about' | 'footer' | 'legal' | 'contact';

export interface TitledItem {
  title: string;
  description: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface AchievementItem {
  value: string;
  label: string;
  description: string;
}

export interface CtaContent {
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface HomeContent {
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    scrollLabel: string;
  };
  stats: StatItem[];
  values: { eyebrow: string; title: string; subtitle: string; items: TitledItem[] };
  benefits: { eyebrow: string; title: string; subtitle: string; items: TitledItem[] };
  cta: CtaContent;
}

export interface PillarItem {
  title: string;
  text: string;
}

export interface AboutContent {
  hero: { title: string; highlight: string; subtitle: string };
  story: {
    heading: string;
    paragraphs: string[];
    imageUrl: string;
    badgeValue: string;
    badgeLabel: string;
  };
  achievements: { title: string; subtitle: string; items: AchievementItem[] };
  values: { title: string; subtitle: string; items: TitledItem[] };
  vision: PillarItem;
  mission: PillarItem;
  purpose: PillarItem;
  cta: CtaContent;
}

export interface ContactContent {
  hero: { title: string; subtitle: string };
  phone: string[];
  email: string[];
  hours: string[];
  whatsappNumber: string;
  form: { heading: string; subtitle: string };
}

export interface FooterContent {
  tagline: string;
  description: string;
  copyright: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
}

export interface LegalDoc {
  title: string;
  subtitle: string;
  lastUpdated: string;
  body: string;
}

export interface LegalContent {
  terms: LegalDoc;
  privacy: LegalDoc;
  diversity: LegalDoc;
  accessibility: LegalDoc;
}

export interface SiteContent {
  home: HomeContent;
  about: AboutContent;
  footer: FooterContent;
  legal: LegalContent;
  contact: ContactContent;
}

const CORE_VALUES: TitledItem[] = [
  { title: 'Innovation', description: 'We constantly improve and adapt to change.' },
  { title: 'Global Mindset', description: 'We think beyond borders to deliver world-class solutions.' },
  { title: 'Sustainability', description: 'We build for the future with environmentally conscious practices.' },
  { title: 'Credibility', description: 'We uphold the highest standards of integrity and trust.' },
  { title: 'Collaboration', description: 'We work together to achieve shared goals.' },
  { title: 'Value Creation', description: 'We deliver tangible benefits to all our stakeholders.' },
  { title: 'Customer Obsession', description: "We prioritize our customers' needs above all else." },
];

const LIVE_STATS = {
  openPositions: { value: '{{openPositions}}', label: 'Open Positions' },
  countries: { value: '{{countries}}', label: 'Destination Countries' },
  categories: { value: '{{categories}}', label: 'Job Categories' },
  workTypes: { value: '{{workTypes}}', label: 'Work Types' },
};

export const DEFAULT_HOME: HomeContent = {
  hero: {
    badge: 'Your gateway to international careers',
    titleLine1: 'Build Your',
    titleLine2: 'Future With Us',
    subtitle:
      'Discover international job opportunities across Europe, the UAE and beyond. Apply, get certified and follow your progress in one place. Your career journey starts here.',
    primaryCta: 'Explore Opportunities',
    secondaryCta: 'Learn More About Us',
    scrollLabel: 'Scroll to explore',
  },
  stats: [
    { ...LIVE_STATS.openPositions },
    { ...LIVE_STATS.countries },
    { ...LIVE_STATS.categories },
    { ...LIVE_STATS.workTypes },
  ],
  values: {
    eyebrow: 'Our Foundation',
    title: 'Values That Drive Us',
    subtitle: 'These core values drive our culture and guide how we serve every candidate and partner.',
    items: CORE_VALUES.map((v) => ({ ...v })),
  },
  benefits: {
    eyebrow: 'Why Global Talent Plus?',
    title: 'Benefits of Using Global Talent Plus',
    subtitle: "We're committed to creating an environment where talent thrives and careers flourish.",
    items: [
      {
        title: 'International Opportunities',
        description: 'Browse roles across Europe, the UAE and other destinations, all listed in one place.',
      },
      {
        title: 'Certification and Training',
        description: 'Build job-ready skills with assessments, courses and certificates linked to the roles you want.',
      },
      {
        title: 'Guided Application',
        description: 'Follow a clear process from CV review to interview, with your progress visible at every stage.',
      },
      {
        title: 'Roles for Every Level',
        description: 'Opportunities for skilled and non-skilled professionals looking to work abroad.',
      },
      {
        title: 'Clear Sponsorship Process',
        description: 'Learn how sponsorship works and track your funding progress from your candidate account.',
      },
      {
        title: 'Support When You Need It',
        description: 'Reach our team by email or WhatsApp once you sign in.',
      },
    ],
  },
  cta: {
    title: 'Ready to Start Your Journey?',
    subtitle:
      'Join professionals who are building international careers with Global Talent Plus. Your next chapter begins here.',
    primaryCta: 'Get Started Today',
    secondaryCta: 'Browse Open Positions',
  },
};

export const DEFAULT_ABOUT: AboutContent = {
  hero: {
    title: 'About',
    highlight: 'Global Talent Plus',
    subtitle:
      'A recruitment platform connecting skilled and non-skilled professionals with international job opportunities across Europe, the UAE and beyond.',
  },
  story: {
    heading: 'Our Story',
    paragraphs: [
      'Global Talent Plus is a recruitment platform built to connect candidates with international job opportunities in Europe, the UAE and other destinations. We support both skilled and non-skilled professionals throughout the recruitment journey.',
      'Candidates browse open roles, apply online, complete assessments and certification where required, and follow their progress through every stage of the process in one place.',
      'Our commitment to clarity, fairness and support drives everything we do as we help more people turn international opportunity into real careers.',
    ],
    imageUrl: '',
    badgeValue: 'Global',
    badgeLabel: 'Opportunities',
  },
  achievements: {
    title: 'Our Achievements',
    subtitle: 'Numbers that reflect our commitment to excellence and growth',
    items: [
      { ...LIVE_STATS.openPositions, description: 'Roles currently open for applications' },
      { ...LIVE_STATS.countries, description: 'International destinations with active roles' },
      { ...LIVE_STATS.categories, description: 'Job families we recruit for' },
      { ...LIVE_STATS.workTypes, description: 'Working arrangements across our listings' },
    ],
  },
  values: {
    title: 'Our Values',
    subtitle: 'These core values drive our culture and guide how we serve every candidate and partner.',
    items: CORE_VALUES.map((v) => ({ ...v })),
  },
  vision: { title: 'Our Vision', text: 'To be the most trusted pathway to international careers.' },
  mission: {
    title: 'Our Mission',
    text: 'We connect qualified candidates with genuine international opportunities through a clear, supported and transparent recruitment process.',
  },
  purpose: {
    title: 'Our Purpose',
    text: 'To open doors to opportunity and create value for every candidate and partner we serve.',
  },
  cta: {
    title: 'Start Your International Career',
    subtitle: 'Browse current openings and take the first step toward your next opportunity abroad.',
    primaryCta: 'View Open Positions',
    secondaryCta: 'Sign In / Register',
  },
};

export const DEFAULT_CONTACT: ContactContent = {
  hero: {
    title: 'Contact Us',
    subtitle: "We'd love to hear from you. Get in touch with our team for any inquiries or support.",
  },
  phone: ['+254182326644'],
  email: ['Globaltalentplus@gmail.com'],
  hours: ['Monday - Friday: 8:00 AM - 6:00 PM', 'Saturday: 9:00 AM - 6:00 PM'],
  whatsappNumber: '254182326644',
  form: {
    heading: 'Send us a Message',
    subtitle: "Fill out the form below and we'll get back to you as soon as possible",
  },
};

export const DEFAULT_FOOTER: FooterContent = {
  tagline: 'Your pathway to international careers',
  description:
    'Global Talent Plus connects skilled and non-skilled professionals with international job opportunities across Europe, the UAE and beyond.',
  copyright: 'Global Talent Plus. All rights reserved.',
  facebook: '',
  twitter: '',
  linkedin: '',
  instagram: '',
};

// Legal text uses a tiny format so admins can edit it in a plain box:
//   "## Heading" starts a heading, "- item" starts a bullet, a blank line
//   starts a new paragraph.
export const DEFAULT_LEGAL: LegalContent = {
  terms: {
    title: 'Terms of Service',
    subtitle: 'Please read these terms carefully before using our platform.',
    lastUpdated: 'March 2, 2017',
    body: `## 1. Acceptance of Terms
By accessing and using the Global Talent Plus platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to all of the terms and conditions, you may not access the website or use any of its services.

## 2. User Accounts
When you create an account with us, you must provide information that is accurate, complete and current at all times. Failure to do so is a breach of these Terms and may result in immediate termination of your account.
- You are responsible for safeguarding the password that you use to access the Service.
- You agree not to disclose your password to any third party.
- You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.

## 3. Application Process
Any information and documents submitted during the application process must be truthful and accurate. Misrepresentation of qualifications, experience or identity may lead to immediate disqualification from the recruitment process. Submitting an application does not guarantee an interview, a job offer or a placement.

## 4. Fees and Payments
Where a fee applies to a service such as an assessment, training, certification or sponsorship package, the amount is shown before you pay. Please review it carefully and only make payments through the official payment options shown in your account.

## 5. International Employment
Job opportunities listed on the platform are with international employers. Decisions about visas, work permits and entry into a country are made by the relevant authorities and employers, and we cannot guarantee any outcome.

## 6. Intellectual Property
The Service and its original content, features and functionality are and will remain the exclusive property of Global Talent Plus and its licensors. The Service is protected by copyright, trademark and other applicable laws.

## 7. Limitation of Liability
In no event shall Global Talent Plus, nor its directors, employees, partners, agents, suppliers or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation loss of profits, data, use, goodwill or other intangible losses, resulting from your access to or use of, or inability to access or use, the Service.

## 8. Changes to These Terms
We may update these Terms from time to time. The date at the top of this page shows when they were last revised. Continued use of the Service after a change means you accept the updated Terms.

## Contact Us
If you have any questions about these Terms, please sign in and use the support options in your candidate account to reach our team by email or WhatsApp.`,
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'We are committed to protecting your personal information.',
    lastUpdated: 'March 2, 2018',
    body: `## 1. Introduction
Global Talent Plus ("us", "we" or "our") operates the Global Talent Plus recruitment platform. This page informs you of our policies regarding the collection, use and disclosure of personal data when you use our Service and the choices you have associated with that data.

## 2. Information Collection and Use
We collect several types of information to provide and improve our Service, with a focus on processing job applications efficiently and fairly.
- Personal Data: your name, email address, phone number and address, and other details that can be used to contact or identify you.
- Professional Data: your CV, employment history, educational background, certifications and references submitted during the application process.
- Supporting Documents: identification and other documents you choose to upload to support an application.
- Usage Data: information on how the Service is accessed and used, which helps us improve the user experience.

## 3. Use of Data
We use the collected data to:
- Provide and maintain the Service.
- Notify you about changes to the Service.
- Process and evaluate your job applications.
- Communicate with you about your application status, assessments and interviews.
- Detect, prevent and address technical issues.

## 4. Sharing of Data
We may share the information needed for an application with prospective employers and partners involved in the recruitment process. We may also use trusted service providers, such as email and payment providers, to help us run the Service. They have access to your data only to perform these tasks on our behalf and are obliged not to use it for any other purpose.

## 5. Security of Data
The security of your data is important to us. We use appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure or destruction. However, no method of transmission over the Internet or method of electronic storage is 100% secure.

## 6. Your Rights
You may ask to access, correct or delete the personal data we hold about you, subject to applicable law and to our need to keep certain records for recruitment purposes.

## Contacting Us About Your Data
If you have any questions about this Privacy Policy or wish to exercise your data rights, please sign in and use the support options in your candidate account to reach our team by email or WhatsApp.`,
  },
  diversity: {
    title: 'Diversity & Inclusion',
    subtitle: 'Building a platform where everyone belongs and thrives.',
    lastUpdated: 'March 2, 2018',
    body: `## Our Commitment
At Global Talent Plus, we believe that people are our greatest asset. We are committed to fostering a culture of diversity, equity and inclusion in every aspect of our business, from how we list opportunities to how we support candidates.

## Why Diversity Matters to Us
We embrace and encourage differences in age, color, disability, ethnicity, family or marital status, gender identity or expression, language, national origin, physical and mental ability, political affiliation, race, religion, sexual orientation, socio-economic status, veteran status and other characteristics that make each person unique.

These differences bring diverse perspectives and innovative ideas, and a deeper understanding of the candidates and employers we serve around the world.

## Our Principles
- Equal Opportunity: we ensure fair treatment, access, opportunity and advancement for all individuals involved with our recruitment processes.
- Inclusive Environment: we strive to create an environment that promotes dignity and respect for all. No form of intimidation, bullying or harassment is tolerated.
- Continuous Learning: we commit to ongoing education and training on bias, inclusivity and cultural competency for our team.
- Fair Access: we actively seek to remove barriers in our processes so that the widest pool of qualified candidates can take part.

## Accommodation Statement
Global Talent Plus is committed to providing reasonable accommodations to applicants with disabilities. If you require an accommodation at any stage of the application process, please let us know through the support options in your candidate account so we can assist you.`,
  },
  accessibility: {
    title: 'Accessibility Statement',
    subtitle: 'Ensuring digital access for all individuals.',
    lastUpdated: 'March 2, 2018',
    body: `## Our Commitment to Accessibility
Global Talent Plus is strongly committed to diversity, inclusion and digital accessibility for all users, including those with disabilities. We are continuously working to improve the user experience for everyone and to apply the relevant accessibility standards to our digital properties, including this platform.

## Standards We Follow
We aim to adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 level AA. These guidelines explain how to make web content more accessible to people with a wide range of disabilities, including visual, auditory, physical, speech, cognitive, language, learning and neurological disabilities.

## Ongoing Efforts
Accessibility is an ongoing effort. We regularly evaluate our website to identify areas for improvement. Some of our continuous practices include:
- Ensuring clear, logical heading structures and semantic HTML elements.
- Providing sufficient color contrast for text and interactive elements.
- Allowing scalable text and maintaining usability when zoomed in.
- Ensuring keyboard navigability for core workflows, including job applications.
- Using descriptive alternative text for meaningful images and hiding decorative elements from screen readers.

## Feedback and Assistance
If you encounter any accessibility barriers while using the platform, or if you require assistance with the application process, please do not hesitate to contact us. After you sign in, the support options in your candidate account let you reach our team by email or WhatsApp, and we will work with you to provide the information or service you need through an accessible alternative.`,
  },
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  home: DEFAULT_HOME,
  about: DEFAULT_ABOUT,
  footer: DEFAULT_FOOTER,
  legal: DEFAULT_LEGAL,
  contact: DEFAULT_CONTACT,
};

export function mergeWithDefaults<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) {
    if (!Array.isArray(override)) return base;
    const template = base[0];
    if (typeof template === 'string') {
      return override.filter((item) => typeof item === 'string') as unknown as T;
    }
    if (template && typeof template === 'object') {
      return override
        .filter((item) => item && typeof item === 'object')
        .map((item) => mergeWithDefaults(template, item)) as unknown as T;
    }
    return base;
  }

  if (base && typeof base === 'object') {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    if (override && typeof override === 'object' && !Array.isArray(override)) {
      for (const key of Object.keys(base as Record<string, unknown>)) {
        out[key] = mergeWithDefaults((base as Record<string, unknown>)[key], (override as Record<string, unknown>)[key]);
      }
    }
    return out as T;
  }

  return (typeof override === typeof base ? override : base) as T;
}

export function buildSiteContent(stored: Partial<Record<SiteContentPageKey, unknown>>): SiteContent {
  return {
    home: mergeWithDefaults(DEFAULT_HOME, stored.home),
    about: mergeWithDefaults(DEFAULT_ABOUT, stored.about),
    footer: mergeWithDefaults(DEFAULT_FOOTER, stored.footer),
    legal: mergeWithDefaults(DEFAULT_LEGAL, stored.legal),
    contact: mergeWithDefaults(DEFAULT_CONTACT, stored.contact),
  };
}