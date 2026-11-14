/**
 * Seed Course 31 — Caring for a Resident with a Joint Replacement (DRAFT).
 *
 * Usage:
 *   pnpm --filter @calace/db db:seed-course-31-joint-replacement
 *
 * Idempotent upserts by slug. Does not seed the final quiz (pending owner approval).
 * Lesson slugs follow the 12-lesson structure (s01-introduction … s12-conclusion).
 */
import {
  LESSON_CONTENT_SCHEMA_VERSION,
  ONE_HOUR_CNA_CEU_BLUEPRINT,
  type ContentBlock,
  type LessonContentDocument,
} from '@calace/content-blocks';
import {
  ContentPublishStatus,
  CourseStatus,
  CourseVersionStatus,
  DeliveryMode,
  Prisma,
  PrismaClient,
} from '@prisma/client';

import { DEFAULT_LAUNCH_CEU_HOURS } from '../src/ceu-defaults';
import { mergeLaunchCatalogData } from '../src/launch-catalog';

const TENANT_SLUG = 'cal-ace';
const CATEGORY_SLUG = 'professional-development';
const PROFESSION_CODE = 'CNA';
const COURSE_SLUG = 'joint-replacement';
const COURSE_TITLE = 'After Joint Replacement: Safe Mobility and Recovery Support';
const COURSE_SUMMARY =
  'Learn to support a resident recovering from a hip or knee joint replacement — following movement precautions, supporting safe mobility and rehab, preventing the dangerous complications (clots, infection, dislocation), and recognizing emergencies. CNAs do not diagnose, give or adjust medications, perform therapy, or set movement restrictions.';

const ASSET_BASE = `/assets/courses/joint-replacement`;

/** Package sections s01–s12 (excluding final quiz). */
const PACKAGE_SECTION_LESSON_SLUGS = [
  's01-introduction',
  's02-terms',
  's03-statistics',
  's04-fundamentals',
  's05-signs',
  's06-causes',
  's07-role',
  's08-prevention',
  's09-scenario',
  's10-cna-role',
  's11-case-study',
  's12-conclusion',
] as const;

const BLUEPRINT_DURATION_BY_SLUG = new Map(
  ONE_HOUR_CNA_CEU_BLUEPRINT.modules.flatMap((module) =>
    module.lessons.map((lesson) => [lesson.slug, lesson.estimatedActiveMinutes]),
  ),
);

/** Package-aligned lessons not in the standard blueprint use package section runtime (5 min). */
const PACKAGE_SECTION_DURATION_MINUTES = 5;

function durationMinutesForLesson(slug: string): number {
  return BLUEPRINT_DURATION_BY_SLUG.get(slug) ?? PACKAGE_SECTION_DURATION_MINUTES;
}

const DEFAULT_CATALOG = {
  price: 3.75,
  durationMinutes: 60,
  difficulty: 'intermediate',
  instructor: 'CAL ACE Faculty',
  featured: false,
  hasFreePreview: false,
  subscriptionEligible: true,
};

const DEFAULT_CONTENT_META = {
  overview: COURSE_SUMMARY,
  learningObjectives: [
    'Explain what a joint replacement is and why recovery matters',
    'Follow and protect hip and knee movement precautions',
    'Prevent and recognize the dangerous complications',
    'Support rehabilitation',
    'Know your scope — what a CNA does, and what a CNA must never do',
  ],
  faq: [] as { question: string; answer: string }[],
  compliance: {
    providerName: 'CAL ACE Nursing Academy',
    cdphApprovalStatus: 'placeholder' as const,
    targetAudience: 'California certified nursing assistants',
    requiredSeatTimeMinutes: 50,
    onlineDeliveryDesignation: 'online' as const,
  },
  imageAccent: 'teal',
  heroImage: '/assets/courses/joint-replacement/hero-banner.png',
  versioning: { immutableAfterPublish: true },
};

type LessonSeed = {
  slug: string;
  title: string;
  sortOrder: number;
  buildContent: () => LessonContentDocument;
};

type ModuleSeed = {
  slug: string;
  title: string;
  sortOrder: number;
  lessons: LessonSeed[];
};

function doc(title: string, blocks: ContentBlock[]): LessonContentDocument {
  return {
    schemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
    title,
    generation: { source: 'hybrid' },
    blocks,
  };
}

function pendingAudio(
  id: string,
  title: string,
  assetPath: string,
  narrationScript: string,
  audioUrl?: string,
): ContentBlock {
  return {
    id,
    type: 'audio',
    title,
    narrationScript,
    placeholderNote: `Pending upload: ${assetPath}`,
    ...(audioUrl ? { audioUrl } : {}),
  };
}

const MODULES: ModuleSeed[] = [
  {
    slug: 'module-1',
    title: 'Understanding Joint Replacement',
    sortOrder: 0,
    lessons: [
      {
        slug: 's01-introduction',
        title: "Introduction",
        sortOrder: 0,
        buildContent: () => doc("Welcome", [
                        { id: 'jr-s01-heading', type: 'heading', level: 1, text: "Welcome" },
                        {
                id: 'jr-s01-video',
                type: 'video',
                title: 'Introduction',
                videoUrl: `${ASSET_BASE}/s01-intro.mp4`,
                placeholderNote: `Pending upload: ${ASSET_BASE}/s01-intro.mp4`,
              },
                        {
                id: 'jr-s01-image',
                type: 'image',
                src: `${ASSET_BASE}/s01-hero.jpg`,
                caption: 'Joint replacement — helping a resident recover safely after a new hip or knee.',
              },
                        {
                id: 'jr-s01-narration',
                type: 'text',
                body: "Welcome to CAL ACE Nursing Academy.\n\nThis course is about caring for a resident who has had a joint replacement — most often a hip or a knee — and helping them recover safely and well.\n\nA joint replacement is a surgery where a damaged, worn-out joint is removed and replaced with an artificial one made of metal, plastic, or ceramic. It's one of the most common and most successful surgeries in older adults. After years of pain from severe arthritis or a fracture, a new hip or knee can give a resident back their mobility and free them from pain. It's often a wonderful thing.\n\nBut the surgery is only half the story. The recovery is the other half — and that's where the CNA lives. In the weeks and months after a joint replacement, how the resident is moved, positioned, and helped to walk directly affects whether the new joint heals well, stays in place, and lasts. The surgeon builds the joint; the CNA, alongside the therapists and nurses, protects it through recovery.\n\nThis course centers on a few things you must get right. First, movement precautions — especially after a hip replacement, there are specific positions and movements the resident must avoid to keep the new hip from dislocating, from popping out of place. You'll learn what they are and how to protect them. Second, the dangerous complications recovery can bring: blood clots, infection, and dislocation — all of which a watchful CNA helps prevent and catch early. And third, supporting the rehabilitation that turns a new joint into a working one.\n\nYour scope is clear. A CNA follows and protects the resident's movement precautions, supports safe mobility and rehab, prevents and watches for complications, and reports faithfully. A CNA does not diagnose, does not give or adjust medications, does not perform therapy, and does not set or change the movement restrictions — those come from the surgeon and the team.\n\nBy the end of this course, you will be able to: explain what a joint replacement is and why recovery matters. Follow and protect hip and knee movement precautions. Prevent and recognize the dangerous complications. Support rehabilitation. And know your scope.\n\nThere is a ten-question knowledge check at the end. Everything on it is covered here. Let's begin.",
              },
                        {
                id: 'jr-s01-ci-text',
                type: 'text',
                body: "This course teaches the CNA's role in supporting a resident recovering from a hip or knee joint replacement — protecting the new joint by following movement precautions, supporting safe mobility and rehab, preventing the dangerous complications (clots, infection, dislocation), and recognizing emergencies.\n\nLet's be clear about your role. A CNA follows and protects the resident's movement precautions, supports safe mobility and rehab, prevents and watches for complications, and reports faithfully. A CNA does not diagnose, does not give or adjust medications, does not perform therapy, and does not set or change the movement restrictions — those come from the surgeon and the team. Those are nursing and physician tasks. But none of them can happen without your careful observation and faithful reporting first.",
              },
                        {
                id: 'jr-s01-ci-callout',
                type: 'callout',
                variant: 'clinical',
                title: "Scope of this course",
                body: "CNAs FOLLOW PRECAUTIONS, SUPPORT, WATCH, and REPORT. CNAs do not diagnose, give or adjust medications, perform therapy, or set movement restrictions.",
              },
                        {
                id: 'jr-s01-lo-text',
                type: 'text',
                body: "By the end of this course, you will be able to:",
              },
                        {
                id: 'jr-s01-lo-summary',
                type: 'summary',
                title: "Learning objectives",
                items: [
                  "Explain what a joint replacement is and why recovery matters.",
                  "Follow and protect hip and knee movement precautions.",
                  "Prevent and recognize the dangerous complications.",
                  "Support rehabilitation.",
                  "Know your scope — what a CNA does, and what a CNA must never do.",
                ],
              },
                        {
                id: 'jr-s01-ii-text',
                type: 'text',
                body: "This course is presented by CAL ACE Nursing Academy — an approved CDPH continuing education provider, NAC number 7384.",
                meta: {"flaggedFiller":true},
              },
          ]),
      },
      {
        slug: 's02-terms',
        title: "Terms & Definitions",
        sortOrder: 1,
        buildContent: () => doc("Key terms", [
                        { id: 'jr-s02-heading', type: 'heading', level: 1, text: "Key terms" },
                        {
                id: 'jr-s02-image',
                type: 'image',
                src: `${ASSET_BASE}/s02-hero.jpg`,
                caption: 'Key terms — arthroplasty, hip precautions, weight-bearing status, dislocation, DVT.',
              },
                        {
                id: 'jr-s02-reveal-joint-replacement',
                type: 'reveal_card',
                frontTitle: "Joint Replacement (Arthroplasty)",
                frontBody: "Arth-roh-PLAS-tee",
                backTitle: "Joint Replacement (Arthroplasty)",
                backBody: "Surgery to remove a damaged joint and replace it with an artificial one. The most common are hip and knee replacements. It relieves pain and restores movement after severe arthritis or fracture.",
              },
                        {
                id: 'jr-s02-reveal-prosthesis',
                type: 'reveal_card',
                frontTitle: "Prosthesis",
                frontBody: "Pros-THEE-sis",
                backTitle: "Prosthesis",
                backBody: "The artificial joint itself — the new hip or knee made of metal, plastic, or ceramic. It replaces the worn-out joint. Protecting the prosthesis as it heals into place is the goal of recovery care.",
              },
                        {
                id: 'jr-s02-reveal-hip-precautions',
                type: 'reveal_card',
                frontTitle: "Hip Precautions",
                frontBody: "Hip precautions",
                backTitle: "Hip Precautions",
                backBody: "Specific movements and positions a resident must avoid after a hip replacement, to keep the new hip from dislocating. The classic ones: don't bend the hip too far, don't cross the legs, and don't turn the leg inward. The exact precautions come from the surgeon.",
              },
                        {
                id: 'jr-s02-reveal-dislocation',
                type: 'reveal_card',
                frontTitle: "Dislocation",
                frontBody: "Dis-loh-KAY-shun",
                backTitle: "Dislocation",
                backBody: "When the new joint pops out of its proper position — most concerning with hip replacements, especially early in recovery. It's a painful emergency. Following movement precautions is exactly how dislocation is prevented.",
              },
                        {
                id: 'jr-s02-reveal-dvt',
                type: 'reveal_card',
                frontTitle: "DVT (Deep Vein Thrombosis)",
                frontBody: "D-V-T, throm-BOH-sis",
                backTitle: "DVT (Deep Vein Thrombosis)",
                backBody: "A blood clot, usually in the leg, that can form after surgery because of reduced movement. Signs include calf or leg pain, swelling, warmth, and redness. A clot can break loose and travel to the lungs — a life-threatening emergency.",
              },
                        {
                id: 'jr-s02-reveal-pulmonary-embolism',
                type: 'reveal_card',
                frontTitle: "Pulmonary Embolism",
                frontBody: "PUL-mon-air-ee EM-bo-lizm",
                backTitle: "Pulmonary Embolism",
                backBody: "When a blood clot travels to the lungs — a life-threatening emergency. Sudden shortness of breath, chest pain, and rapid breathing are warning signs. Preventing clots and catching DVT early prevents this.",
              },
                        {
                id: 'jr-s02-reveal-weight-bearing',
                type: 'reveal_card',
                frontTitle: "Weight-Bearing Status",
                frontBody: "Weight-bearing status",
                backTitle: "Weight-Bearing Status",
                backBody: "How much weight the resident is allowed to put on the operated leg — set by the surgeon. It ranges from full weight-bearing to none at all. The CNA must know and follow each resident's exact status during transfers and walking.",
              },
                        {
                id: 'jr-s02-reveal-rehabilitation',
                type: 'reveal_card',
                frontTitle: "Rehabilitation",
                frontBody: "Rehabilitation",
                backTitle: "Rehabilitation",
                backBody: "The therapy and progressive activity that rebuild strength and movement in the new joint. Physical therapy is central. The CNA reinforces rehab by encouraging the prescribed exercises and safe activity, helping the new joint become a working joint.",
              },
                        {
                id: 'jr-s02-kc1-check-hip-precautions',
                type: 'knowledge_check',
                question: "Match the term: movements to avoid so the new hip doesn't dislocate",
                options: [
                  { id: 'hip-precautions', label: "Hip precautions" },
                  { id: 'dvt', label: "DVT" },
                  { id: 'weight-bearing-status', label: "Weight-bearing status" },
                ],
                correctOptionId: 'hip-precautions',
                explanation: "Hip precautions. Specific movements and positions a resident must avoid after a hip replacement, to keep the new hip from dislocating. The classic ones: don't bend the hip too far, don't cross the legs, and don't turn the leg inward.",
                requiredForCompletion: true,
              },
                        {
                id: 'jr-s02-kc1-check-dvt',
                type: 'knowledge_check',
                question: "Match the term: a blood clot, usually in the leg, after surgery",
                options: [
                  { id: 'hip-precautions', label: "Hip precautions" },
                  { id: 'dvt', label: "DVT" },
                  { id: 'weight-bearing-status', label: "Weight-bearing status" },
                ],
                correctOptionId: 'dvt',
                explanation: "DVT. A blood clot, usually in the leg, that can form after surgery because of reduced movement. Signs include calf or leg pain, swelling, warmth, and redness. A clot can break loose and travel to the lungs — a life-threatening emergency.",
                requiredForCompletion: true,
              },
                        {
                id: 'jr-s02-kc1-check-weight-bearing',
                type: 'knowledge_check',
                question: "Match the term: how much weight is allowed on the operated leg",
                options: [
                  { id: 'hip-precautions', label: "Hip precautions" },
                  { id: 'dvt', label: "DVT" },
                  { id: 'weight-bearing-status', label: "Weight-bearing status" },
                ],
                correctOptionId: 'weight-bearing-status',
                explanation: "Weight-bearing status. How much weight the resident is allowed to put on the operated leg — set by the surgeon. It ranges from full weight-bearing to none at all. The CNA must know and follow each resident's exact status during transfers and walking.",
                requiredForCompletion: true,
              },
          ]),
      },
      {
        slug: 's03-statistics',
        title: "Statistics",
        sortOrder: 2,
        buildContent: () => doc("Statistics", [
                        { id: 'jr-s03-heading', type: 'heading', level: 1, text: "Statistics" },
                        pendingAudio(
                'jr-s03-audio',
                "Joint Replacement: Common, Successful — and Recovery Is Where the CNA Matters Most",
                `/assets/courses/joint-replacement/s03-stats-podcast.mp3`,
                "Joint Replacement: Common, Successful — and Recovery Is Where the CNA Matters Most\n\nJoint replacement is one of the most common and most successful surgeries performed today. More than a million hip and knee replacements are done each year in the United States, and the numbers keep rising as the population ages. For a resident who has lived with the grinding pain of severe arthritis or who has fractured a hip, a joint replacement can be life-changing — restoring movement and ending years of pain. The great majority of these surgeries succeed.\n\nBut the surgery itself is only the beginning. The recovery period — the weeks and months afterward, much of it spent in long-term care or rehabilitation — is where success is either protected or lost. And it's where the CNA's role is greatest.\n\nThree dangerous complications shadow this recovery, and a watchful CNA helps prevent and catch all three. First, blood clots: after surgery, reduced movement lets clots form in the legs — a deep vein thrombosis — and if one travels to the lungs, it becomes a life-threatening pulmonary embolism. Early movement, prescribed exercises, and watching for clot signs prevent this. Second, infection: any surgery carries infection risk, and an infection in or around a new joint is serious. Wound care, hygiene, and watching for infection signs matter. Third, dislocation: especially with hip replacements, the new joint can pop out of place if certain movements are made before it heals — which is exactly why movement precautions exist.\n\nThere's also the rehabilitation story. A joint replacement only becomes a working joint through therapy and progressive activity. Early, safe movement and faithful rehabilitation rebuild strength and restore function. Residents who move safely and follow their rehab recover far better than those who stay immobile. The CNA, encouraging and supporting that safe activity every day, is central to the outcome.\n\nHere's the empowering bottom line for the CNA: the surgery is the surgeon's; the recovery belongs to the team — and the CNA is with the resident more than anyone. Following movement precautions, supporting safe mobility and rehab, preventing clots and infection, and catching complications early — the CNA's daily work determines whether a successful surgery becomes a successful recovery.",
                '/assets/courses/joint-replacement/s03-stats-podcast.mp3',
              ),
                        {
                id: 'jr-s03-image',
                type: 'image',
                src: `${ASSET_BASE}/s03-hero.jpg`,
                caption: 'Joint replacements are common and successful — safe recovery depends on daily care.',
              },
          ]),
      },
      {
        slug: 's04-fundamentals',
        title: "Fundamentals",
        sortOrder: 3,
        buildContent: () => doc("Fundamentals", [
                        { id: 'jr-s04-heading', type: 'heading', level: 1, text: "Fundamentals" },
                        {
                id: 'jr-s04-narration',
                type: 'text',
                body: "**What a joint replacement is**\n\nA joint is where two bones meet and move. When a joint — most often a hip or knee — is destroyed by severe arthritis or a fracture, it can be surgically replaced with an artificial joint, a prosthesis, made of metal, plastic, or ceramic. The new joint takes over the work of the old, worn-out one.\n\n**Why people get them**\n\nMost joint replacements are done for one of two reasons. Severe arthritis, where years of joint damage have caused constant pain and lost movement — the new joint relieves the pain and restores function. Or a fracture, especially a broken hip, where replacing the joint is the best repair. Either way, the goal is a resident who can move again, with far less pain.\n\n**The new joint must heal into place**\n\nHere's the key to recovery care. The artificial joint is placed surgically, but the body needs time — weeks to months — to heal around it, building strong tissue that holds it securely in place. During that healing window, the joint is more vulnerable: it can dislocate, the wound can get infected, and the surgery's stillness can cause clots. Recovery care is about protecting the joint through that vulnerable window.\n\n**Why movement precautions exist**\n\nEspecially for a new hip, certain movements can pop the joint out of place before it has healed — a dislocation. So the surgeon sets movement precautions: positions and motions the resident must avoid for a period. These aren't arbitrary rules; each one prevents a specific way the joint could dislocate. Following them faithfully is how the new hip stays in place while it heals.\n\n**Why early, safe movement matters too**\n\nIt might seem like the safest thing is to keep the resident perfectly still. It isn't. Staying immobile after surgery is dangerous — it causes blood clots, weakness, stiffness, and other complications. So recovery is a balance: avoid the forbidden movements that risk dislocation, but encourage the safe, prescribed movement and exercises that prevent clots and rebuild the joint. Safe movement is medicine; forbidden movement is danger.\n\n**The three big complications**\n\nThree complications define the risk of recovery. Blood clots — from reduced movement, dangerous if they travel to the lungs. Infection — in the wound or around the new joint, serious and needing prompt treatment. Dislocation — the joint popping out, especially the hip, prevented by movement precautions. Much of recovery care is preventing and watching for these three.\n\n**Recovery is a team effort, led by the plan**\n\nA successful recovery is a team effort. The surgeon sets the precautions and weight-bearing rules. The therapists guide the exercises and rebuild strength. The nurse manages medications and wound care. And the CNA, with the resident every day, follows the plan, supports safe activity, and watches closely. Everyone protects the same new joint — and the CNA is the constant presence making it happen.",
              },
                        {
                id: 'jr-s04-balance-callout',
                type: 'callout',
                variant: 'clinical',
                title: "Safe movement = medicine. Forbidden movement = danger.",
                body: "Avoid the forbidden movements that risk dislocation, but encourage the safe, prescribed movement and exercises that prevent clots and rebuild the joint. Both matter.",
              },
                        {
                id: 'jr-s04-video',
                type: 'video',
                title: 'Fundamentals',
                videoUrl: `${ASSET_BASE}/s04-fundamentals.mp4`,
                placeholderNote: `Pending upload: ${ASSET_BASE}/s04-fundamentals.mp4`,
              },
                        {
                id: 'jr-s04-image',
                type: 'image',
                src: `${ASSET_BASE}/s04-hero.jpg`,
                caption: 'How a replaced joint heals, and the movements that can dislocate it early on.',
              },
          ]),
      },
    ],
  },
  {
    slug: 'module-2',
    title: 'Recognition, Prevention, and CNA Role',
    sortOrder: 1,
    lessons: [
      {
        slug: 's05-signs',
        title: "Signs & Symptoms",
        sortOrder: 0,
        buildContent: () => doc("Signs & Symptoms", [
                        { id: 'jr-s05-heading', type: 'heading', level: 1, text: "Signs & Symptoms" },
                        {
                id: 'jr-s05-image',
                type: 'image',
                src: `${ASSET_BASE}/s05-hero.jpg`,
                caption: 'Recognizing trouble — signs of dislocation, infection, or a blood clot.',
              },
                        {
                id: 'jr-s05-narration',
                type: 'text',
                body: "In joint replacement recovery, your watchfulness catches the three dangerous complications early. Let's learn what normal recovery looks like, and the warning signs of each complication.\n\n**Blood clot in the leg: DVT**\n\nA blood clot in the leg — deep vein thrombosis — is a top danger after surgery. Watch the operated leg, and both legs, for: pain or tenderness, often in the calf. Swelling, especially if one leg is more swollen than the other. Warmth and redness over an area. The resident may say their calf aches or feels tight. These signs mean a possible clot — report them promptly, because a clot in the leg can become deadly if it travels.\n\n**Infection: at the wound and beyond**\n\nInfection is the second danger. At the surgical wound, watch for: increasing redness, warmth, and swelling around it; drainage, especially if it's thick, cloudy, or foul-smelling; the wound opening or looking worse. And body-wide signs of infection: fever, chills, increasing pain rather than improving pain, and feeling unwell. Recovery pain should gradually improve — pain that's worsening, or a wound looking angrier, is reported promptly.\n\n**Dislocation: the hip popping out**\n\nDislocation is the third danger, most concerning with hips. Signs that a hip has dislocated: sudden severe pain in the hip or groin. The operated leg suddenly looking different — shortened, and turned inward or outward. Inability to move the leg or bear weight. The resident may feel or hear a pop, and be in obvious distress. A suspected dislocation is an emergency — keep the resident still and get help immediately. This is exactly what movement precautions prevent.\n\n**The clot that reached the lungs: an emergency**\n\nThe most dangerous complication is a clot that breaks loose and travels to the lungs — a pulmonary embolism. The signs are sudden and frightening: sudden shortness of breath, chest pain that may worsen with breathing, rapid breathing and heart rate, coughing, anxiety, sometimes bluish lips. This is a life-threatening emergency — activate emergency help immediately. Preventing clots and catching a leg DVT early is how we stop it from ever reaching this point.\n\n**Summary**\n\nTwo pictures. Normal recovery: pain that gradually improves, a wound that gradually heals, growing strength and mobility with rehab. Complications to catch: a swollen, warm, painful calf (clot); a red, draining, worsening wound or fever (infection); sudden severe hip pain with a leg that looks wrong (dislocation); and sudden shortness of breath and chest pain (clot to the lungs — emergency).\n\nThe rule underneath it all: recovery should steadily improve — so worsening pain, a worsening wound, a swollen painful leg, or sudden breathing trouble all get reported, and a suspected dislocation or clot-to-the-lungs is an emergency.",
              },
                        {
                id: 'jr-s05-emergency-callout',
                type: 'callout',
                variant: 'warning',
                title: "Recovery should steadily improve",
                body: "Worsening pain, a worsening wound, a swollen painful leg, or sudden breathing trouble all get reported. A suspected dislocation or clot-to-the-lungs is an emergency.",
              },
          ]),
      },
      {
        slug: 's06-causes',
        title: "Causes",
        sortOrder: 1,
        buildContent: () => doc("Causes", [
                        { id: 'jr-s06-heading', type: 'heading', level: 1, text: "Causes" },
                        pendingAudio(
                'jr-s06-audio',
                "Why Complications Happen After Joint Replacement — and How CNAs Prevent Them",
                `/assets/courses/joint-replacement/s06-causes-podcast.mp3`,
                "Why Complications Happen After Joint Replacement — and How CNAs Prevent Them\n\nThe three big complications of joint replacement recovery — clots, infection, and dislocation — each have understandable causes, and understanding them shows exactly how a CNA prevents them.\n\nBlood clots happen because of reduced movement. After surgery, a resident moves less, and blood flow in the legs slows. Slow-moving blood is prone to clotting, so a clot can form in a deep leg vein. The biggest risk factor is immobility — lying still for long periods. This is precisely why early, safe movement, the prescribed leg exercises, and getting residents up and walking as the plan directs are so important: movement keeps the blood flowing and prevents clots. CNAs who encourage and support that safe activity directly prevent clots. Special stockings or compression devices, and clot-preventing medications managed by the nurse, also help.\n\nInfection happens because surgery creates a wound and introduces a foreign object — the artificial joint — that bacteria could potentially infect. Risk rises with poor wound hygiene, with general infections elsewhere in the body that could spread, and in residents with conditions like diabetes that slow healing. CNAs prevent infection through good hand hygiene, careful and clean wound care within their role, keeping the area clean and dry, and watching for and reporting early infection signs so treatment starts fast.\n\nDislocation happens, especially with hips, when the new joint is moved into a position it can't yet tolerate before it has healed into place. Certain movements — bending the hip too far, crossing the legs, turning the leg inward — can lever the new hip out of its socket. The risk is highest in the early weeks. This is the entire reason movement precautions exist, and following them faithfully is how a CNA prevents dislocation. Improper transfers and positioning are a common way dislocations happen, so correct technique matters enormously.\n\nHere's what this all means for the CNA. Each complication is largely preventable, and the prevention is daily, hands-on CNA work: support safe movement to prevent clots, maintain hygiene and watch the wound to prevent and catch infection, and follow movement precautions and use correct technique to prevent dislocation. You can't control that a resident had surgery — but you have enormous influence over whether their recovery stays complication-free.",
                '/assets/courses/joint-replacement/s06-causes-podcast.mp3',
              ),
                        {
                id: 'jr-s06-image',
                type: 'image',
                src: `${ASSET_BASE}/s06-hero.jpg`,
                caption: "What shapes recovery — the surgery, the resident's health, and consistent precautions.",
              },
          ]),
      },
      {
        slug: 's07-role',
        title: "CNA Role & Best Practices",
        sortOrder: 2,
        buildContent: () => doc("Medications & Treatment", [
                        { id: 'jr-s07-heading', type: 'heading', level: 1, text: "Medications & Treatment" },
                        {
                id: 'jr-s07-image',
                type: 'image',
                src: `${ASSET_BASE}/s07-hero.jpg`,
                caption: 'CNA scope — safe transfers, hip precautions, watching and reporting; never adjust the plan or meds.',
              },
                        {
                id: 'jr-s07-scope-callout',
                type: 'callout',
                variant: 'clinical',
                title: "Scope of practice",
                body: "CNAs never SET precautions or weight-bearing limits — but must KNOW and FOLLOW each resident's exactly. When in doubt, ask before moving.",
              },
                        {
                id: 'jr-s07-narration',
                type: 'text',
                body: "Joint replacement recovery is managed by the surgeon, nurse, and therapists — and the CNA carries it out daily, protecting the new joint without ever setting a rule or touching a dose. Let's walk through it, starting as always with the rule that never bends. A CNA does not give or adjust medications, does not perform therapy, and does not set or change the movement precautions or weight-bearing limits — those come from the surgeon and team. The CNA's job is to know them and follow them precisely.\n\n**Know and follow the precautions and weight-bearing status.** This is the core of your role. Every resident has specific movement precautions, especially after a hip — commonly: don't bend the hip beyond ninety degrees, don't cross the legs or ankles, don't turn the operated leg inward. And every resident has a weight-bearing status — how much weight they may put on the operated leg, from full to none. You must know each resident's exact precautions and weight-bearing status, follow them in every transfer and movement, and use the equipment that supports them — like an abduction pillow between the legs to keep a hip in safe position. When in doubt, ask the nurse before you move them.\n\n**Clot-prevention measures.** The nurse manages clot-preventing medications. You support the non-drug measures: applying compression stockings or sequential compression devices as directed, encouraging the prescribed leg exercises and ankle pumps, and getting the resident moving safely as the plan allows. Report signs of a leg clot promptly.\n\n**Pain medication and the recovery curve.** The nurse manages pain medication. Your role: report whether pain is controlled, and importantly, report pain that's worsening rather than improving — because recovery pain should gradually ease, and increasing pain can signal a complication. Watch for medication side effects like drowsiness or dizziness that raise fall risk.\n\n**Wound care and infection prevention.** Wound care is done within your role and the nurse's direction — keeping the area clean and dry, careful hygiene, and protecting the dressing. Watch the wound and report early infection signs: increasing redness, warmth, swelling, drainage, or odor. Good hand hygiene protects the healing joint.\n\n**Rehabilitation support.** Therapists run the rehab; you reinforce it — encouraging the prescribed exercises, supporting safe walking with the correct aid and technique, and building the activity that turns the new joint into a working one. You never invent exercises or push beyond what's ordered.\n\nThe scope point for this section: you never set precautions, give medication, or perform therapy — but you know and follow the precautions and weight-bearing status exactly, support clot prevention and rehab, protect the wound, and report the warning signs.",
              },
                        {
                id: 'jr-s07-recovery-curve-callout',
                type: 'callout',
                variant: 'warning',
                title: "Watch the recovery curve",
                body: "Recovery pain should IMPROVE. Pain getting worse, a worsening wound, or a swollen painful calf = report promptly.",
              },
          ]),
      },
      {
        slug: 's08-prevention',
        title: "Prevention & Risk Reduction",
        sortOrder: 3,
        buildContent: () => doc("Prevention", [
                        { id: 'jr-s08-heading', type: 'heading', level: 1, text: "Prevention" },
                        {
                id: 'jr-s08-image',
                type: 'image',
                src: `${ASSET_BASE}/s08-hero.jpg`,
                caption: 'Prevention — following weight-bearing orders, protecting the joint, keeping paths clear.',
              },
                        {
                id: 'jr-s08-narration',
                type: 'text',
                body: "In joint replacement recovery, the CNA prevents the three big complications every day. Here are seven ways.\n\n**One. Follow the movement precautions exactly.** Know each resident's specific precautions — especially the hip rules: no bending the hip too far, no crossing the legs, no turning the leg inward. Follow them in every transfer, every position, every movement. Use the positioning aids like an abduction pillow. Faithful precautions prevent dislocation. When unsure, ask the nurse before moving the resident.\n\n**Two. Know and respect the weight-bearing status.** Know exactly how much weight each resident may put on the operated leg, and never exceed it during transfers or walking. Putting too much weight on a leg that isn't ready can damage the healing joint. This is a rule to follow precisely, never to guess at.\n\n**Three. Get them moving safely to prevent clots.** Immobility causes clots. Support the prescribed early movement, leg and ankle exercises, and safe walking, and help residents change position regularly. Apply compression stockings or devices as directed. Movement is the best clot prevention there is — and it's your daily work.\n\n**Four. Watch the legs for clot signs.** Check the legs for the warning signs of a clot — calf pain, swelling especially on one side, warmth, redness — and report them promptly. Early recognition of a leg clot prevents the deadly clot-to-the-lungs that can follow.\n\n**Five. Protect the wound and prevent infection.** Keep the surgical area clean and dry, protect the dressing, practice excellent hand hygiene, and provide careful wound care within your role. Watch for early infection signs and report them. Keeping the new joint free of infection protects the whole surgery.\n\n**Six. Prevent falls — they threaten the new joint.** A fall in early recovery can dislocate or damage the new joint. Keep pathways clear, ensure proper footwear and the correct walking aid, stay close during walking and transfers, and never rush. Fall prevention here protects both the resident and the surgery.\n\n**Seven. Support rehab and watch the recovery curve.** Encourage the prescribed exercises and safe activity faithfully — rehab is what makes the joint work. And watch the recovery curve: it should steadily improve. Report anything moving the wrong way — worsening pain, a worsening wound, new leg swelling, or new trouble — promptly.",
              },
          ]),
      },
    ],
  },
  {
    slug: 'module-3',
    title: 'Action, Judgment, and Application',
    sortOrder: 2,
    lessons: [
      {
        slug: 's09-scenario',
        title: "Scenario & Reporting",
        sortOrder: 0,
        buildContent: () => doc("When to Call Emergency or Doctor", [
                        { id: 'jr-s09-heading', type: 'heading', level: 1, text: "When to Call Emergency or Doctor" },
                        pendingAudio(
                'jr-s09-intro-audio',
                "Emergency response scenarios intro",
                `/assets/courses/joint-replacement/s09-emergency-intro.mp3`,
                "In joint replacement recovery, two emergencies test you most: a blood clot that may have traveled to the lungs, and a dislocated new joint. You're about to work through two situations. Read each carefully, choose your action, and you'll get feedback right away. Keep the core idea in mind: recovery should steadily improve, so a sudden serious change is an emergency — and movement precautions exist to prevent dislocation.",
                '/assets/courses/joint-replacement/s09-emergency-intro.mp3',
              ),
                        {
                id: 'jr-s09-image',
                type: 'image',
                src: `${ASSET_BASE}/s09-hero.jpg`,
                caption: 'Two recovery judgments — a possible dislocation, and a transfer that must follow precautions.',
              },
                        {
                id: 'jr-s09-scenario-ferreira-image',
                type: 'image',
                src: `${ASSET_BASE}/s09-scenario-ferreira.jpg`,
                caption: 'Sudden pain, a shortened or rotated leg: suspect dislocation — stop and report immediately.',
              },
                        {
                id: 'jr-s09-scenario-ferreira',
                type: 'scenario_question',
                prompt: "Mrs. Ferreira is five days out from her hip replacement. You'd noticed earlier that her right calf seemed a bit swollen and tender, which you reported. Now she suddenly becomes short of breath, says she has sharp chest pain that's worse when she breathes, is breathing fast, and seems anxious and frightened. What is the BEST action?",
                options: [
                  {
                    id: 'rest-recheck',
                    label: "Have her rest and recheck her in an hour",
                    feedback: "Sudden shortness of breath and sharp chest pain after surgery, following a swollen tender calf, point to a pulmonary embolism — a clot in the lungs, life-threatening. Resting, walking, or waiting could be fatal. The right action: recognize the emergency and activate help immediately, keeping her calm, upright, and still.",
                  },
                  {
                    id: 'activate-emergency',
                    label: "Recognize a possible clot traveling to the lungs and activate emergency help immediately",
                    feedback: "Exactly right. Sudden shortness of breath, sharp chest pain worse with breathing, and rapid breathing — especially after surgery and following a swollen, tender calf — are classic signs of a pulmonary embolism, a blood clot that has traveled to the lungs. This is a life-threatening emergency. Activate emergency help immediately, keep her calm and still, support her breathing in an upright position, and stay with her. The earlier calf swelling was the DVT warning — this is why those leg signs are reported promptly. Never make her walk or wait; this needs emergency care now.",
                    isRecommended: true,
                  },
                  {
                    id: 'walk-around',
                    label: "Help her walk around to ease the chest pain",
                    feedback: "Sudden shortness of breath and sharp chest pain after surgery, following a swollen tender calf, point to a pulmonary embolism — a clot in the lungs, life-threatening. Resting, walking, or waiting could be fatal. The right action: recognize the emergency and activate help immediately, keeping her calm, upright, and still.",
                  },
                  {
                    id: 'give-pain-med',
                    label: "Give her something for the pain and wait",
                    feedback: "Sudden shortness of breath and sharp chest pain after surgery, following a swollen tender calf, point to a pulmonary embolism — a clot in the lungs, life-threatening. Resting, walking, or waiting could be fatal. The right action: recognize the emergency and activate help immediately, keeping her calm, upright, and still.",
                  },
                ],
                requiredForCompletion: true,
              },
                        {
                id: 'jr-s09-scenario-bianchi-image',
                type: 'image',
                src: `${ASSET_BASE}/s09-scenario-bianchi.jpg`,
                caption: 'Uncertain about weight-bearing orders: never guess — confirm with the nurse before transferring.',
              },
                        {
                id: 'jr-s09-scenario-bianchi',
                type: 'scenario_question',
                prompt: "While you're helping Mr. Bianchi, who is three weeks out from a hip replacement, he reaches down to pull up his sock — bending his hip far forward and turning his leg inward, against his precautions. He suddenly cries out in severe hip pain, says he felt a \"pop,\" and now his operated leg looks shorter and turned inward, and he can't move it. What SHOULD the CNA do?",
                options: [
                  {
                    id: 'push-back',
                    label: "Gently push the leg back into position yourself",
                    feedback: "This is a likely hip dislocation — severe pain, a \"pop,\" and the leg shortened and turned after a forbidden movement. Pushing the joint, standing him up, or moving the leg could cause serious damage. The right action: keep him still, don't move the leg, support him, and get help immediately.",
                  },
                  {
                    id: 'keep-still',
                    label: "Keep him still, do not move the leg, and get help immediately",
                    feedback: "Right. Severe sudden hip pain, a felt \"pop,\" and the leg now shortened, turned, and unable to move — right after a movement that violated his precautions — strongly suggest the new hip has dislocated. This is an emergency. Keep him still, do NOT try to move or reposition the leg yourself — never try to push a dislocated joint back, which can cause serious damage — support him comfortably, and get help immediately. This is exactly the situation movement precautions are designed to prevent, which is why following them so faithfully matters. Report what happened, including the movement that triggered it.",
                    isRecommended: true,
                  },
                  {
                    id: 'stand-walk',
                    label: "Help him stand to \"walk it back into place\"",
                    feedback: "This is a likely hip dislocation — severe pain, a \"pop,\" and the leg shortened and turned after a forbidden movement. Pushing the joint, standing him up, or moving the leg could cause serious damage. The right action: keep him still, don't move the leg, support him, and get help immediately.",
                  },
                  {
                    id: 'keep-moving',
                    label: "Have him keep trying to move the leg",
                    feedback: "This is a likely hip dislocation — severe pain, a \"pop,\" and the leg shortened and turned after a forbidden movement. Pushing the joint, standing him up, or moving the leg could cause serious damage. The right action: keep him still, don't move the leg, support him, and get help immediately.",
                  },
                ],
                requiredForCompletion: true,
              },
          ]),
      },
      {
        slug: 's10-cna-role',
        title: "CNA's Role in Care",
        sortOrder: 1,
        buildContent: () => doc("CNA's Role in Care", [
                        { id: 'jr-s10-heading', type: 'heading', level: 1, text: "CNA's Role in Care" },
                        {
                id: 'jr-s10-narration',
                type: 'text',
                body: "Your role in joint replacement recovery is following the rules that protect the joint, supporting safe movement, preventing complications, and reporting. Let's walk through it.\n\n**Protect the joint with precautions and technique** Your first duty is protecting the new joint. Know each resident's exact movement precautions and weight-bearing status, and follow them in every single transfer, position, and movement. Use the positioning aids — the abduction pillow for hips, proper alignment — and correct transfer technique. Never let a resident, or a rushed moment, force a forbidden movement. When you're unsure whether a movement is safe, stop and ask the nurse before moving them. Following the precautions is how you prevent dislocation.\n\n**Support safe movement and rehab** Recovery needs safe movement. Encourage and support the prescribed exercises, the ankle pumps and leg exercises that prevent clots, and safe walking with the right aid and technique within the weight-bearing limits. Apply compression devices as directed. Getting the resident moving safely prevents clots, rebuilds the joint, and speeds recovery — but always within the precautions and limits the team set.\n\n**Prevent and catch complications** Be the watcher for the three big complications. For clots, watch the legs — calf pain, one-sided swelling, warmth, redness — and report promptly. For infection, watch the wound and the resident — increasing redness, drainage, odor, fever, worsening pain — and report. For dislocation, follow precautions to prevent it, and recognize its signs if it happens. And know the recovery curve: it should steadily improve, so report anything moving the wrong way.\n\n**Respond to emergencies and report** Know the emergencies cold. Sudden shortness of breath and chest pain — possible clot to the lungs — activate emergency help immediately. Sudden severe hip pain with a leg that looks wrong after a forbidden movement — possible dislocation — keep still and get help immediately. And report faithfully throughout: pain trends, wound appearance, leg signs, how the resident is moving, and any concern.\n\nNow the boundary. You do not diagnose. You do not give or adjust medications. You do not perform therapy — you reinforce it. And you never set or change movement precautions or weight-bearing limits, and never force or guess at a movement when unsure.\n\nInside your role — protect the joint with faithful precautions, support safe movement and rehab, prevent and catch the complications, and report — you turn a successful surgery into a successful recovery. The surgeon builds the joint; you, every day, protect it.",
              },
                        {
                id: 'jr-s10-scope-callout',
                type: 'callout',
                variant: 'clinical',
                title: "Stay within scope",
                body: "You do not diagnose. You do not give or adjust medications. You do not perform therapy — you reinforce it. You never set or change movement precautions or weight-bearing limits, and never force or guess at a movement when unsure.",
              },
                        {
                id: 'jr-s10-video',
                type: 'video',
                title: "CNA's Role in Care",
                videoUrl: `${ASSET_BASE}/s10-cna-role.mp4`,
                placeholderNote: `Pending upload: ${ASSET_BASE}/s10-cna-role.mp4`,
              },
                        {
                id: 'jr-s10-image',
                type: 'image',
                src: `${ASSET_BASE}/s10-hero.jpg`,
                caption: "The CNA as the daily guide — every safe transfer protects the new joint's recovery.",
              },
          ]),
      },
      {
        slug: 's11-case-study',
        title: "Case Study",
        sortOrder: 2,
        buildContent: () => {
          const caseNarrative = "Mr. Bianchi, 72, was recovering well from a hip replacement three weeks earlier. He was a proud, independent man, eager to do things himself, and his CNA, Lena, had been gently reinforcing his hip precautions every day: don't bend the hip too far, don't cross the legs, don't turn the operated leg inward.\n\n**The teaching, day by day:** Lena had explained the precautions to Mr. Bianchi in plain terms — not as arbitrary rules, but as protecting his new hip while it healed. She used his abduction pillow, transferred him with correct technique, kept his walker and needed items within easy reach so he wouldn't have to bend or twist for them, and reminded him kindly: \"Let me get that for you — remember, no reaching down past your hip yet.\"\n\n**The near-miss:** One morning, in a hurry to get dressed, Mr. Bianchi waved Lena off and reached down himself to pull up his sock — bending his hip far forward and twisting his leg inward, exactly the movement his precautions forbade. Lena saw it starting and moved fast, but he'd already bent. He froze, then said, \"Oh — that pulled funny.\" There was a moment of fear. This time, it didn't dislocate — but it was close, and it scared them both.\n\n**What Lena did:** Lena didn't scold him. She helped him back to a safe position, checked he was alright, and used the moment to teach: \"That right there — bending down and turning in — that's the exact move that can pop a new hip out of place. That's why I keep offering to get things for you. It's not me being fussy; it's protecting the hip you just got.\" She also set up a long-handled sock aid and reacher the therapist had recommended, so he could dress himself safely without the dangerous bend. And she reported the near-miss to the nurse.\n\n**What it prevented — and the contrast:** Because of Lena's faithful precaution care and quick teaching, Mr. Bianchi understood, used his sock aid from then on, and never made the dangerous movement again. He healed without dislocation. The nurse noted that a dislocation three weeks out could have meant another procedure, a major setback, or worse — and that Lena's daily reinforcement and the adaptive tools had genuinely protected his recovery.\n\n**The recovery completed:** Lena kept supporting his prescribed exercises and safe walking, watched his legs and wound for complications, and watched his recovery curve steadily improve. Months later, Mr. Bianchi was walking comfortably, pain-free, his independence restored — the surgery a full success, because the recovery had been protected.\n\n**Discussion:** Lena's role wasn't dramatic, but it was decisive. She knew Mr. Bianchi's precautions and followed and reinforced them every day. She kept items in reach to prevent the forbidden movements, taught the precautions in a way that earned his cooperation, brought in the adaptive tools that let him stay independent safely, and reported the near-miss. She never set the precautions or performed therapy — she protected the new joint through the daily, faithful work that recovery depends on. The surgeon built the hip; Lena protected it.";

          return doc("Brief Case Study", [
                        { id: 'jr-s11-heading', type: 'heading', level: 1, text: "Brief Case Study" },
            pendingAudio(
              'jr-s11-audio',
              "The Sock That Almost Cost a Hip",
              `/assets/courses/joint-replacement/s11-case-podcast.mp3`,
              caseNarrative,
              '/assets/courses/joint-replacement/s11-case-podcast.mp3',
            ),
                        {
                id: 'jr-s11-image',
                type: 'image',
                src: `${ASSET_BASE}/s11-hero.jpg`,
                caption: 'Recognizing the pattern — how following precautions prevented a serious setback.',
              },
                        {
                id: 'jr-s11-case-study',
                type: 'case_study',
                title: "The Sock That Almost Cost a Hip",
                residentProfile: "Mr. Bianchi, 72, was recovering well from a hip replacement three weeks earlier. He was a proud, independent man, eager to do things himself, and his CNA, Lena, had been gently reinforcing his hip precautions every day: don't bend the hip too far, don't cross the legs, don't turn the operated leg inward.",
                scenario: "**The teaching, day by day:** Lena had explained the precautions to Mr. Bianchi in plain terms — not as arbitrary rules, but as protecting his new hip while it healed. She used his abduction pillow, transferred him with correct technique, kept his walker and needed items within easy reach so he wouldn't have to bend or twist for them, and reminded him kindly: \"Let me get that for you — remember, no reaching down past your hip yet.\"\n\n**The near-miss:** One morning, in a hurry to get dressed, Mr. Bianchi waved Lena off and reached down himself to pull up his sock — bending his hip far forward and twisting his leg inward, exactly the movement his precautions forbade. Lena saw it starting and moved fast, but he'd already bent. He froze, then said, \"Oh — that pulled funny.\" There was a moment of fear. This time, it didn't dislocate — but it was close, and it scared them both.\n\n**What Lena did:** Lena didn't scold him. She helped him back to a safe position, checked he was alright, and used the moment to teach: \"That right there — bending down and turning in — that's the exact move that can pop a new hip out of place. That's why I keep offering to get things for you. It's not me being fussy; it's protecting the hip you just got.\" She also set up a long-handled sock aid and reacher the therapist had recommended, so he could dress himself safely without the dangerous bend. And she reported the near-miss to the nurse.\n\n**What it prevented — and the contrast:** Because of Lena's faithful precaution care and quick teaching, Mr. Bianchi understood, used his sock aid from then on, and never made the dangerous movement again. He healed without dislocation. The nurse noted that a dislocation three weeks out could have meant another procedure, a major setback, or worse — and that Lena's daily reinforcement and the adaptive tools had genuinely protected his recovery.\n\n**The recovery completed:** Lena kept supporting his prescribed exercises and safe walking, watched his legs and wound for complications, and watched his recovery curve steadily improve. Months later, Mr. Bianchi was walking comfortably, pain-free, his independence restored — the surgery a full success, because the recovery had been protected.\n\n**Discussion:** Lena's role wasn't dramatic, but it was decisive. She knew Mr. Bianchi's precautions and followed and reinforced them every day. She kept items in reach to prevent the forbidden movements, taught the precautions in a way that earned his cooperation, brought in the adaptive tools that let him stay independent safely, and reported the near-miss. She never set the precautions or performed therapy — she protected the new joint through the daily, faithful work that recovery depends on. The surgeon built the hip; Lena protected it.",
              },
                        {
                id: 'jr-s11-reflection-1',
                type: 'reflection',
                prompt: "Mr. Bianchi nearly dislocated his hip reaching for a sock. How did Lena's daily habits — keeping items in reach, using adaptive tools, and teaching the \"why\" — protect his new joint?",
                minCharacters: 50,
              },
                        {
                id: 'jr-s11-reflection-2',
                type: 'reflection',
                prompt: "Lena reinforced precautions without scolding and helped him stay independent safely. Why does teaching the reason behind precautions, and supporting safe independence, matter so much in recovery care?",
                minCharacters: 50,
              },
                        {
                id: 'jr-s11-rp-text',
                type: 'text',
                body: "Reflect on the case study in the previous lesson. Your written responses help you apply what you learned about following hip precautions, supporting safe independence, and protecting the new joint through daily recovery care.",
              },
                        {
                id: 'jr-s11-kc2-check',
                type: 'knowledge_check',
                question: "A CNA does not give or adjust medications, does not perform therapy, and does not set or change the movement precautions or weight-bearing limits — those come from the surgeon and team. When a resident recovering from a joint replacement asks for more pain medication, the CNA SHOULD:",
                options: [
                  { id: 'give-medication', label: "Give extra pain medication as the resident requests" },
                  { id: 'report-nurse', label: "Report the concern to the nurse and let the nurse decide" },
                  { id: 'perform-therapy', label: "Perform range-of-motion therapy on your own to reduce pain" },
                  { id: 'adjust-dose', label: "Adjust the medication dose based on the resident's pain level" },
                ],
                correctOptionId: 'report-nurse',
                explanation: "You never give or adjust medications, perform therapy, or set movement precautions or weight-bearing limits — but your reporting of pain changes, wound appearance, leg signs, and recovery concerns supports every treatment the team provides.",
                requiredForCompletion: true,
                meta: {"flaggedFiller":true},
              },
          ]);
        },
      },
      {
        slug: 's12-conclusion',
        title: "Conclusion",
        sortOrder: 3,
        buildContent: () => doc("Conclusion", [
                        { id: 'jr-s12-heading', type: 'heading', level: 1, text: "Conclusion" },
                        {
                id: 'jr-s12-video',
                type: 'video',
                title: 'Conclusion',
                videoUrl: `${ASSET_BASE}/s12-conclusion.mp4`,
                placeholderNote: `Pending upload: ${ASSET_BASE}/s12-conclusion.mp4`,
              },
                        {
                id: 'jr-s12-image',
                type: 'image',
                src: `${ASSET_BASE}/s12-hero.jpg`,
                caption: 'Five things that matter most in joint replacement care.',
              },
                        {
                id: 'jr-s12-narration',
                type: 'text',
                body: "You've reached the end — and you've completed the musculoskeletal series. Let's lock in the five things that matter most for joint replacement care.\n\n**One.** A joint replacement is a successful, life-changing surgery — but the recovery is where success is protected or lost, and that's where the CNA matters most. The surgeon builds the joint; you, every day, protect it while it heals.\n\n**Two.** Know and follow the movement precautions and weight-bearing status exactly. Especially for hips — no bending too far, no crossing the legs, no turning the leg inward — these prevent dislocation. You never set these rules, but you must know and follow each resident's precisely. When in doubt, ask before moving them.\n\n**Three.** Get them moving safely to prevent clots — but only within the rules. Immobility causes dangerous clots, so support the prescribed exercises and safe walking. Balance: encourage the safe movement that prevents clots, while avoiding the forbidden movements that risk dislocation.\n\n**Four.** Prevent and catch the three complications. Clots — watch the legs, report calf pain and swelling. Infection — watch the wound, report redness, drainage, fever, worsening pain. Dislocation — follow precautions, recognize the signs. And know the emergencies: sudden shortness of breath and chest pain (clot to the lungs) or sudden severe hip pain with a leg that looks wrong (dislocation) — both need help now.\n\n**Five.** Honor your scope. You never diagnose, give medications, perform therapy, or set precautions. But you follow the precautions, support safe mobility and rehab, prevent and catch complications, and report faithfully — turning a successful surgery into a successful recovery.",
              },
                        {
                id: 'jr-s12-summary',
                type: 'summary',
                title: "Five things that matter most",
                items: [
                  "A joint replacement is a successful surgery — but recovery is where the CNA protects success.",
                  "Know and follow movement precautions and weight-bearing status exactly — when in doubt, ask before moving.",
                  "Get them moving safely to prevent clots — but only within the rules.",
                  "Prevent and catch the three complications — clots, infection, and dislocation.",
                  "Honor your scope — follow precautions, support rehab, watch closely, and report faithfully.",
                ],
              },
                        {
                id: 'jr-s12-whn-text',
                type: 'text',
                body: "Ten questions are waiting. Everything on them was covered here. You're ready. Trust what you've learned, and show what you know.",
              },
                        {
                id: 'jr-s12-completion-text',
                type: 'text',
                body: "This course provides one hour of continuing education credit through CAL ACE Nursing Academy, an approved CDPH continuing education provider, NAC number 7384. Your certificate is generated automatically when you pass the knowledge check.",
              },
                        {
                id: 'jr-s12-completion-callout',
                type: 'callout',
                variant: 'info',
                title: "Scope reminder",
                body: "CNAs follow precautions, support, and watch. CNAs do not diagnose, give or adjust medications, perform therapy, or set movement restrictions.",
              },
                        {
                id: 'jr-s12-certificate-text',
                type: 'text',
                body: "Your certificate is generated automatically when you pass the knowledge check. CDPH-Approved CE Provider — NAC #7384.",
              },
          ]),
      },
    ],
  },
];

function validatePackageSectionMapping(): void {
  const allLessonSlugs = new Set(
    MODULES.flatMap((moduleSeed) => moduleSeed.lessons.map((lesson) => lesson.slug)),
  );
  for (const slug of PACKAGE_SECTION_LESSON_SLUGS) {
    if (!allLessonSlugs.has(slug)) {
      throw new Error(`Package section lesson slug missing: ${slug}`);
    }
  }
  if (PACKAGE_SECTION_LESSON_SLUGS.length !== 12) {
    throw new Error(`Expected 12 package sections, found ${PACKAGE_SECTION_LESSON_SLUGS.length}`);
  }
}

export async function seedCourse31JointReplacement(
  prisma: PrismaClient,
  options?: { tenantSlug?: string },
): Promise<{
  courseCreated: boolean;
  modulesUpserted: number;
  lessonsUpserted: number;
  strayLessonsDeleted: number;
}> {
  validatePackageSectionMapping();

  const tenantSlug = options?.tenantSlug ?? TENANT_SLUG;

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, deletedAt: null },
  });
  if (!tenant) {
    throw new Error(`Tenant "${tenantSlug}" not found. Run db:seed first.`);
  }

  const category = await prisma.courseCategory.findFirst({
    where: { tenantId: tenant.id, slug: CATEGORY_SLUG, deletedAt: null },
  });
  if (!category) {
    throw new Error(
      `Category "${CATEGORY_SLUG}" not found for tenant "${tenantSlug}". Run db:seed first.`,
    );
  }

  const profession = await prisma.profession.findFirst({
    where: { code: PROFESSION_CODE },
  });

  const ceHours = DEFAULT_LAUNCH_CEU_HOURS;
  const catalogData = mergeLaunchCatalogData(DEFAULT_CATALOG, ceHours);
  const contentMeta = DEFAULT_CONTENT_META;

  const existing = await prisma.course.findFirst({
    where: { tenantId: tenant.id, slug: COURSE_SLUG },
  });

  const course = await prisma.course.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: COURSE_SLUG },
    },
    create: {
      tenantId: tenant.id,
      categoryId: category.id,
      professionId: profession?.id,
      slug: COURSE_SLUG,
      title: COURSE_TITLE,
      summary: COURSE_SUMMARY,
      status: CourseStatus.DRAFT,
      ceHours,
      catalogData: catalogData as Prisma.InputJsonValue,
    },
    update: {
      categoryId: category.id,
      professionId: profession?.id,
      title: COURSE_TITLE,
      summary: COURSE_SUMMARY,
      status: CourseStatus.DRAFT,
      ceHours,
      catalogData: catalogData as Prisma.InputJsonValue,
      deletedAt: null,
    },
  });

  const version = await prisma.courseVersion.upsert({
    where: {
      courseId_versionNumber: { courseId: course.id, versionNumber: 1 },
    },
    create: {
      courseId: course.id,
      versionNumber: 1,
      label: 'Initial release',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
    },
    update: {
      label: 'Initial release',
      status: CourseVersionStatus.DRAFT,
      deliveryMode: DeliveryMode.ONLINE,
      ceHours,
      publishedAt: null,
      contentMeta: contentMeta as Prisma.InputJsonValue,
      deletedAt: null,
    },
  });

  let modulesUpserted = 0;
  let lessonsUpserted = 0;

  for (const moduleSeed of MODULES) {
    const module = await prisma.module.upsert({
      where: {
        courseVersionId_slug: { courseVersionId: version.id, slug: moduleSeed.slug },
      },
      create: {
        courseVersionId: version.id,
        slug: moduleSeed.slug,
        title: moduleSeed.title,
        sortOrder: moduleSeed.sortOrder,
        status: ContentPublishStatus.DRAFT,
      },
      update: {
        title: moduleSeed.title,
        sortOrder: moduleSeed.sortOrder,
        status: ContentPublishStatus.DRAFT,
        deletedAt: null,
      },
    });
    modulesUpserted += 1;

    for (const lessonSeed of moduleSeed.lessons) {
      const content = lessonSeed.buildContent();
      const durationMinutes = durationMinutesForLesson(lessonSeed.slug);

      await prisma.lesson.upsert({
        where: {
          moduleId_slug: { moduleId: module.id, slug: lessonSeed.slug },
        },
        create: {
          moduleId: module.id,
          slug: lessonSeed.slug,
          title: lessonSeed.title,
          sortOrder: lessonSeed.sortOrder,
          status: ContentPublishStatus.DRAFT,
          durationMinutes,
          content: content as unknown as Prisma.InputJsonValue,
        },
        update: {
          title: lessonSeed.title,
          sortOrder: lessonSeed.sortOrder,
          status: ContentPublishStatus.DRAFT,
          durationMinutes,
          content: content as unknown as Prisma.InputJsonValue,
          deletedAt: null,
        },
      });
      lessonsUpserted += 1;
    }
  }

  const ownedLessonKeys = new Set(
    MODULES.flatMap((m) => m.lessons.map((l) => `${m.slug}/${l.slug}`)),
  );
  let strayLessonsDeleted = 0;

  if (version.status !== CourseVersionStatus.DRAFT) {
    console.warn('Skipping stray-lesson cleanup: version is not DRAFT');
  } else {
    const activeLessons = await prisma.lesson.findMany({
      where: {
        deletedAt: null,
        module: { courseVersionId: version.id, deletedAt: null },
      },
      select: { id: true, slug: true, module: { select: { slug: true } } },
    });

    const strayLessons = activeLessons.filter(
      (lesson) => !ownedLessonKeys.has(`${lesson.module.slug}/${lesson.slug}`),
    );

    if (strayLessons.length > 0) {
      const now = new Date();
      await prisma.$transaction(
        strayLessons.map((lesson) =>
          prisma.lesson.update({
            where: { id: lesson.id },
            data: { deletedAt: now },
          }),
        ),
      );
      strayLessonsDeleted = strayLessons.length;
      console.log(
        `Stray-lesson cleanup: soft-deleted ${strayLessonsDeleted} lessons [${strayLessons.map((l) => `${l.module.slug}/${l.slug}`).join(', ')}] on version v${version.versionNumber}.`,
      );
    } else {
      console.log('Stray-lesson cleanup: none found (already clean).');
    }
  }

  return {
    courseCreated: !existing,
    modulesUpserted,
    lessonsUpserted,
    strayLessonsDeleted,
  };
}

function blockCountsByLesson(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const moduleSeed of MODULES) {
    for (const lessonSeed of moduleSeed.lessons) {
      counts[`${moduleSeed.slug}/${lessonSeed.slug}`] = lessonSeed.buildContent().blocks.length;
    }
  }
  return counts;
}

async function main() {
  const prisma = new PrismaClient();
  console.log(`Seeding Course 31 (Joint Replacement) as DRAFT — slug "${COURSE_SLUG}"…`);

  try {
    const result = await seedCourse31JointReplacement(prisma);
    const blockCounts = blockCountsByLesson();
    const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);

    console.log('Seed complete.');
    console.log(`  Course:   ${COURSE_TITLE}`);
    console.log(`  Slug:     ${COURSE_SLUG}`);
    console.log(`  Created:  ${result.courseCreated ? 'yes (new)' : 'no (updated existing)'}`);
    console.log(`  Modules:  ${result.modulesUpserted}`);
    console.log(`  Lessons:  ${result.lessonsUpserted}`);
    console.log(`  Strays cleaned: ${result.strayLessonsDeleted} lessons`);
    console.log(`  Blocks:   ${totalBlocks} total`);
    console.log(`  Sections: ${PACKAGE_SECTION_LESSON_SLUGS.length} package sections mapped`);
    console.log(`  Status:   DRAFT (course, version, modules, lessons)`);
    console.log('  Block counts per lesson:');
    for (const [key, count] of Object.entries(blockCounts)) {
      console.log(`    ${key}: ${count} blocks`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
