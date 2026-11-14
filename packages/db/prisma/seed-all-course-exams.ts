/**
 * Seed final exams (10 questions each) for all 11 launch courses.
 * Communication Skills: deletes existing assessment/questions first, then re-seeds.
 * All other courses: upserts assessment and questions.
 * Run: cd packages/db && npx tsx prisma/seed-all-course-exams.ts
 */
import {
  AssessmentKind,
  CourseVersionStatus,
  PrismaClient,
  QuestionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const FINAL_EXAM_SLUG = 'final-exam';

const EXAM_SETTINGS = {
  questionCount: 10,
  randomizeQuestions: true,
  randomizeOptions: true,
  requireAllLessons: true,
  activeParticipationRequired: true,
} as const;

type ExamQuestion = {
  sortOrder: number;
  prompt: string;
  options: [
    { id: 'a'; label: string },
    { id: 'b'; label: string },
    { id: 'c'; label: string },
    { id: 'd'; label: string },
  ];
  correctAnswer: 'a' | 'b' | 'c' | 'd';
};

type CourseExamConfig = {
  courseSlug: string;
  title: string;
  replaceExisting?: boolean;
  questions: ExamQuestion[];
};

const COURSE_EXAMS: CourseExamConfig[] = [
  {
    courseSlug: 'communication-skills',
    title: 'Final Exam — Communication Skills in Long-Term Care',
    replaceExisting: true,
    questions: [
      {
        sortOrder: 1,
        prompt:
          'A resident does not speak English well. To communicate care needs, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Speak loudly and slowly' },
          { id: 'b', label: 'Use an interpreter or picture cards' },
          { id: 'c', label: 'Ask the family to always be present' },
          { id: 'd', label: 'Skip explaining the care' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 2,
        prompt: 'A resident is crying and will not say why. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Leave the room and return later' },
          { id: 'b', label: 'Tell the resident to calm down' },
          { id: 'c', label: 'Sit with the resident and listen' },
          { id: 'd', label: 'Call the family right away' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 3,
        prompt: 'When giving a report to the oncoming nurse aide, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Share personal opinions about residents' },
          { id: 'b', label: 'Only report completed tasks' },
          { id: 'c', label: 'Report changes in the resident\'s condition' },
          { id: 'd', label: 'Wait until the nurse asks questions' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 4,
        prompt: 'A resident says "I do not want a bath today." The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Give the bath anyway for hygiene' },
          { id: 'b', label: 'Restrain the resident and complete the bath' },
          { id: 'c', label: 'Respect the refusal and tell the nurse' },
          { id: 'd', label: 'Ask the family to convince the resident' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 5,
        prompt: 'The BEST way to get a resident\'s attention before starting care is to:',
        options: [
          { id: 'a', label: 'Touch the resident\'s shoulder firmly' },
          { id: 'b', label: 'Call the resident\'s name and make eye contact' },
          { id: 'c', label: 'Knock loudly on the door' },
          { id: 'd', label: 'Begin care while the resident is sleeping' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 6,
        prompt:
          'A resident with hearing loss does not respond to instructions. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Shout the instructions' },
          { id: 'b', label: 'Face the resident and speak clearly' },
          { id: 'c', label: 'Write a note and leave the room' },
          { id: 'd', label: 'Skip verbal communication' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 7,
        prompt:
          'A family member asks the nurse aide about the resident\'s diagnosis. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Share only what the family already knows' },
          { id: 'b', label: 'Explain the diagnosis in detail' },
          { id: 'c', label: 'Tell the family to speak with the nurse' },
          { id: 'd', label: 'Ignore the question' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 8,
        prompt: 'A resident becomes upset during care. The BEST response is:',
        options: [
          { id: 'a', label: 'You are being difficult today.' },
          { id: 'b', label: 'I will come back when you are calm.' },
          { id: 'c', label: 'You seem upset. Would you like to stop for now?' },
          { id: 'd', label: 'This will only take a minute.' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 9,
        prompt: 'When communicating with a confused resident, the nurse aide SHOULD use:',
        options: [
          { id: 'a', label: 'Long detailed explanations' },
          { id: 'b', label: 'Short simple sentences' },
          { id: 'c', label: 'Medical terms to be accurate' },
          { id: 'd', label: 'Written instructions only' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 10,
        prompt:
          'A resident asks the nurse aide to keep a health concern secret. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Keep the secret to build trust' },
          { id: 'b', label: 'Tell other nurse aides first' },
          { id: 'c', label: 'Explain that safety concerns must be reported' },
          { id: 'd', label: 'Document it without telling the nurse' },
        ],
        correctAnswer: 'c',
      },
    ],
  },
  {
    courseSlug: 'stress-management',
    title: 'Final Exam — Stress Management for Healthcare Workers',
    questions: [
      {
        sortOrder: 1,
        prompt:
          'A nurse aide feels overwhelmed during a busy shift. The BEST first action is to:',
        options: [
          { id: 'a', label: 'Work faster to finish all tasks' },
          { id: 'b', label: 'Skip the lunch break' },
          { id: 'c', label: 'Tell the charge nurse and ask for help' },
          { id: 'd', label: 'Ask a family member to assist' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 2,
        prompt: 'Which of the following is a sign of burnout in a nurse aide?',
        options: [
          { id: 'a', label: 'Wanting to learn new skills' },
          { id: 'b', label: 'Feeling energized at the start of each shift' },
          { id: 'c', label: 'No longer caring about residents\' wellbeing' },
          { id: 'd', label: 'Arriving early to work' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 3,
        prompt:
          'After a resident passes away, the nurse aide feels very sad. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Hide feelings and continue working' },
          { id: 'b', label: 'Leave the unit without telling anyone' },
          { id: 'c', label: 'Talk to the charge nurse about how to cope' },
          { id: 'd', label: 'Avoid caring for similar residents' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 4,
        prompt: 'The BEST way for a nurse aide to manage stress long-term is to:',
        options: [
          { id: 'a', label: 'Work extra shifts to stay busy' },
          { id: 'b', label: 'Get enough sleep and exercise regularly' },
          { id: 'c', label: 'Avoid talking about work problems' },
          { id: 'd', label: 'Drink coffee throughout the shift' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 5,
        prompt: 'A coworker says "I do not care what happens anymore." The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Agree that the job is not worth caring about' },
          { id: 'b', label: 'Report the coworker to management' },
          { id: 'c', label: 'Express concern and suggest speaking with a supervisor' },
          { id: 'd', label: 'Ignore the comment' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 6,
        prompt: 'Taking care of your own health as a nurse aide is important because:',
        options: [
          { id: 'a', label: 'It is required by the facility' },
          { id: 'b', label: 'It helps you provide better care to residents' },
          { id: 'c', label: 'It reduces the number of residents assigned' },
          { id: 'd', label: 'It is only required for new nurse aides' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 7,
        prompt:
          'A nurse aide is having personal problems at home. During the shift, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Share personal problems with residents' },
          { id: 'b', label: 'Focus on resident care and seek support after the shift' },
          { id: 'c', label: 'Ask to go home early every day' },
          { id: 'd', label: 'Avoid all interaction with residents' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 8,
        prompt: 'Which of the following is a healthy way to cope with a stressful shift?',
        options: [
          { id: 'a', label: 'Complaining to residents about coworkers' },
          { id: 'b', label: 'Skipping breaks to finish work faster' },
          { id: 'c', label: 'Talking to a trusted coworker or supervisor' },
          { id: 'd', label: 'Taking extra medication to relax' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 9,
        prompt: 'Compassion fatigue in nurse aides is BEST described as:',
        options: [
          { id: 'a', label: 'Being tired from lifting heavy residents' },
          { id: 'b', label: 'Boredom from doing the same tasks' },
          { id: 'c', label: 'Emotional exhaustion from giving care over time' },
          { id: 'd', label: 'Frustration with facility rules' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 10,
        prompt:
          'A nurse aide notices a coworker crying in the break room. The BEST response is:',
        options: [
          { id: 'a', label: 'Leave the coworker alone to recover' },
          { id: 'b', label: 'Tell other coworkers what happened' },
          { id: 'c', label: 'Ask if the coworker is okay and needs support' },
          { id: 'd', label: 'Report the coworker to the charge nurse' },
        ],
        correctAnswer: 'c',
      },
    ],
  },
  {
    courseSlug: 'mobility-safety',
    title: 'Final Exam — Mobility & Transfer Safety',
    questions: [
      {
        sortOrder: 1,
        prompt: 'Before transferring a resident, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Assume all residents transfer the same way' },
          { id: 'b', label: 'Check the care plan for transfer instructions' },
          { id: 'c', label: 'Ask the family how to transfer the resident' },
          { id: 'd', label: 'Transfer quickly to save time' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 2,
        prompt: 'A gait belt SHOULD be placed:',
        options: [
          { id: 'a', label: 'Around the resident\'s chest' },
          { id: 'b', label: 'Around the resident\'s hips' },
          { id: 'c', label: 'Around the resident\'s waist over clothing' },
          { id: 'd', label: 'Around the resident\'s wrists' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 3,
        prompt: 'When using proper body mechanics, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Bend at the waist and reach far' },
          { id: 'b', label: 'Twist the spine when moving a resident' },
          { id: 'c', label: 'Keep the load close and bend at the knees' },
          { id: 'd', label: 'Hold the resident by the arms only' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 4,
        prompt: 'A resident starts to fall during walking. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Try to hold the resident upright at all costs' },
          { id: 'b', label: 'Step away to avoid being injured' },
          { id: 'c', label: 'Lower the resident safely to the floor' },
          { id: 'd', label: 'Call for help before doing anything' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 5,
        prompt: 'A resident is on "non-weight-bearing" status. This means the resident:',
        options: [
          { id: 'a', label: 'Can walk with a walker' },
          { id: 'b', label: 'Can bear some weight on the affected leg' },
          { id: 'c', label: 'Cannot put any weight on the affected leg' },
          { id: 'd', label: 'Only needs help going up stairs' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 6,
        prompt:
          'To prevent pressure injuries, a bedbound resident SHOULD be repositioned:',
        options: [
          { id: 'a', label: 'Once per shift' },
          { id: 'b', label: 'Every 4 to 6 hours' },
          { id: 'c', label: 'At least every 2 hours' },
          { id: 'd', label: 'Only when the resident asks' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 7,
        prompt: 'When ambulating a resident, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Walk in front to show the resident the way' },
          { id: 'b', label: 'Walk behind the resident at all times' },
          { id: 'c', label: 'Walk beside and slightly behind the resident' },
          { id: 'd', label: 'Ask a family member to walk with the resident' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 8,
        prompt:
          'The nurse aide raised the bed to care for a resident but forgot supplies. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Tell the resident to lie still and get supplies quickly' },
          { id: 'b', label: 'Ask the roommate to watch the resident' },
          { id: 'c', label: 'Lower the bed and place the call light within reach first' },
          { id: 'd', label: 'Leave the bed raised until returning' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 9,
        prompt: 'A mechanical lift SHOULD be used:',
        options: [
          { id: 'a', label: 'Only for residents who cannot move at all' },
          { id: 'b', label: 'According to the care plan and manufacturer instructions' },
          { id: 'c', label: 'Only when two nurse aides are unavailable' },
          { id: 'd', label: 'Without checking the sling each time' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 10,
        prompt: 'Which footwear is BEST for a resident who is learning to walk again?',
        options: [
          { id: 'a', label: 'Socks only' },
          { id: 'b', label: 'Loose slippers' },
          { id: 'c', label: 'Non-skid footwear' },
          { id: 'd', label: 'Bare feet for better grip' },
        ],
        correctAnswer: 'c',
      },
    ],
  },
  {
    courseSlug: 'resident-rights',
    title: 'Final Exam — Resident Rights & Advocacy',
    questions: [
      {
        sortOrder: 1,
        prompt: 'A resident refuses to take a bath. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Give the bath anyway for hygiene reasons' },
          { id: 'b', label: 'Restrain the resident and complete the bath' },
          { id: 'c', label: 'Respect the refusal, document it, and tell the nurse' },
          { id: 'd', label: 'Ask a family member to force the resident' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 2,
        prompt: 'Before entering a resident\'s room, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Enter quietly without disturbing the resident' },
          { id: 'b', label: 'Knock and wait for permission to enter' },
          { id: 'c', label: 'Open the door and announce the purpose' },
          { id: 'd', label: 'Enter only when the nurse is present' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 3,
        prompt: 'A resident asks the nurse aide to help file a complaint. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Discourage the resident to avoid conflict' },
          { id: 'b', label: 'Tell the resident the complaint will not be heard' },
          { id: 'c', label: 'Explain the complaint process and tell the nurse' },
          { id: 'd', label: 'Ignore the request' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 4,
        prompt: 'Which of the following protects a resident\'s right to privacy?',
        options: [
          { id: 'a', label: 'Discussing care needs in the hallway' },
          { id: 'b', label: 'Leaving the room door open during personal care' },
          { id: 'c', label: 'Pulling the curtain during personal care' },
          { id: 'd', label: 'Sharing the resident\'s information with visitors' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 5,
        prompt: 'A resident has a DNR order. If the resident stops breathing, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Begin CPR immediately' },
          { id: 'b', label: 'Call 911 before telling the nurse' },
          { id: 'c', label: 'Follow the DNR and call the nurse right away' },
          { id: 'd', label: 'Ask the family what to do' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 6,
        prompt: 'A nurse aide sees a coworker speaking rudely to a resident. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Laugh along to avoid conflict' },
          { id: 'b', label: 'Intervene and report it to the charge nurse' },
          { id: 'c', label: 'Tell the resident to ignore it' },
          { id: 'd', label: 'Wait to see if it happens again' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 7,
        prompt: 'Restraints may ONLY be used when:',
        options: [
          { id: 'a', label: 'The nurse aide feels it is necessary' },
          { id: 'b', label: 'A family member requests it' },
          { id: 'c', label: 'There is a physician order and medical necessity' },
          { id: 'd', label: 'The resident is confused' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 8,
        prompt: 'A resident\'s mail SHOULD be:',
        options: [
          { id: 'a', label: 'Opened by staff to check for safety' },
          { id: 'b', label: 'Read by the nurse before delivery' },
          { id: 'c', label: 'Given to the resident unopened' },
          { id: 'd', label: 'Held until a family member is present' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 9,
        prompt: 'A resident wants to refuse a medication. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Mix the medication into the resident\'s food' },
          { id: 'b', label: 'Tell the resident refusal is not allowed' },
          { id: 'c', label: 'Report the refusal to the nurse right away' },
          { id: 'd', label: 'Give the medication anyway' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 10,
        prompt:
          'Which of the following is an example of respecting a resident\'s dignity?',
        options: [
          { id: 'a', label: 'Calling residents by their room number' },
          { id: 'b', label: 'Referring to the resident as "sweetie" or "honey"' },
          { id: 'c', label: 'Asking the resident how they prefer to be addressed' },
          { id: 'd', label: 'Discussing the resident\'s condition in the hallway' },
        ],
        correctAnswer: 'c',
      },
    ],
  },
  {
    courseSlug: 'elder-abuse-reporting',
    title: 'Final Exam — Elder & Dependent Adult Abuse Reporting',
    questions: [
      {
        sortOrder: 1,
        prompt: 'In California, a nurse aide who suspects elder abuse SHOULD:',
        options: [
          { id: 'a', label: 'Wait until certain before reporting' },
          { id: 'b', label: 'Discuss it only with coworkers' },
          { id: 'c', label: 'Report the suspicion to the charge nurse right away' },
          { id: 'd', label: 'Confront the suspected abuser first' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 2,
        prompt: 'Which of the following is an example of physical abuse?',
        options: [
          { id: 'a', label: 'Helping a resident with a meal' },
          { id: 'b', label: 'Giving medications on time' },
          { id: 'c', label: 'Slapping a resident during care' },
          { id: 'd', label: 'Following the care plan' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 3,
        prompt:
          'A resident tells the nurse aide that a staff member took money from them. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Tell the resident it is a staff matter' },
          { id: 'b', label: 'Confront the staff member directly' },
          { id: 'c', label: 'Report it to the charge nurse and document it' },
          { id: 'd', label: 'Ask other residents if this happened to them' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 4,
        prompt: 'Neglect in a care facility means:',
        options: [
          { id: 'a', label: 'Giving more care than the care plan requires' },
          { id: 'b', label: 'Encouraging the resident to be independent' },
          { id: 'c', label: 'Failing to provide basic needs such as food or hygiene' },
          { id: 'd', label: 'Following physician orders exactly' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 5,
        prompt: 'Which of the following is an example of emotional abuse?',
        options: [
          { id: 'a', label: 'Setting limits on unsafe behavior' },
          { id: 'b', label: 'Redirecting a confused resident' },
          { id: 'c', label: 'Threatening to withhold meals if a resident does not cooperate' },
          { id: 'd', label: 'Enforcing facility rules consistently' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 6,
        prompt:
          'A nurse aide threatens to skip a resident\'s bath if the resident does not cooperate. This is:',
        options: [
          { id: 'a', label: 'Acceptable if the resident is difficult' },
          { id: 'b', label: 'A form of emotional abuse' },
          { id: 'c', label: 'Allowed with a supervisor\'s approval' },
          { id: 'd', label: 'A standard behavior management technique' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 7,
        prompt: 'In California, elder abuse reports SHOULD be made to:',
        options: [
          { id: 'a', label: 'Only the facility administrator' },
          { id: 'b', label: 'The resident\'s family first' },
          { id: 'c', label: 'Adult Protective Services or law enforcement' },
          { id: 'd', label: 'The charge nurse only' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 8,
        prompt: 'Signs that may indicate a resident is being abused include:',
        options: [
          { id: 'a', label: 'Good appetite and participation in activities' },
          { id: 'b', label: 'Unexplained bruises or injuries' },
          { id: 'c', label: 'Consistent weight and clean skin' },
          { id: 'd', label: 'Friendly interactions with all staff' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 9,
        prompt: 'Sexual abuse of a resident includes:',
        options: [
          { id: 'a', label: 'Providing personal hygiene care as ordered' },
          { id: 'b', label: 'Any non-consensual sexual contact' },
          { id: 'c', label: 'A physical exam by licensed staff' },
          { id: 'd', label: 'Discussing health needs with a physician' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 10,
        prompt: 'Which behavior by a nurse aide is considered abuse?',
        options: [
          { id: 'a', label: 'Documenting a resident\'s refusal of care' },
          { id: 'b', label: 'Reporting a change in condition to the nurse' },
          { id: 'c', label: 'Withholding meals as punishment' },
          { id: 'd', label: 'Following the resident\'s care plan' },
        ],
        correctAnswer: 'c',
      },
    ],
  },
  {
    courseSlug: 'infection-control',
    title: 'Final Exam — Infection Control for CNAs',
    questions: [
      {
        sortOrder: 1,
        prompt: 'The MOST effective way to prevent the spread of infection is:',
        options: [
          { id: 'a', label: 'Wearing a gown at all times' },
          { id: 'b', label: 'Proper hand washing' },
          { id: 'c', label: 'Keeping windows open' },
          { id: 'd', label: 'Giving residents antibiotics' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 2,
        prompt: 'The nurse aide SHOULD wash hands for at least:',
        options: [
          { id: 'a', label: '5 seconds' },
          { id: 'b', label: '10 seconds' },
          { id: 'c', label: '20 seconds' },
          { id: 'd', label: '60 seconds' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 3,
        prompt: 'Standard precautions apply to:',
        options: [
          { id: 'a', label: 'Only residents with known infections' },
          { id: 'b', label: 'All blood and body fluids for every resident' },
          { id: 'c', label: 'Only residents in isolation' },
          { id: 'd', label: 'Only when the nurse directs their use' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 4,
        prompt: 'When putting on PPE, the CORRECT order is:',
        options: [
          { id: 'a', label: 'Gloves, gown, mask, eye protection' },
          { id: 'b', label: 'Gown, mask, eye protection, gloves' },
          { id: 'c', label: 'Mask, gloves, gown, eye protection' },
          { id: 'd', label: 'Eye protection, gloves, mask, gown' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 5,
        prompt: 'Articles contaminated with blood or body fluids SHOULD be placed in:',
        options: [
          { id: 'a', label: 'The soiled linen basket' },
          { id: 'b', label: 'The biohazard container' },
          { id: 'c', label: 'The soiled utility room' },
          { id: 'd', label: 'The resident\'s trash container' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 6,
        prompt: 'Alcohol-based hand sanitizer should NOT be used when:',
        options: [
          { id: 'a', label: 'Moving between residents in a hallway' },
          { id: 'b', label: 'After removing gloves with no visible soil' },
          { id: 'c', label: 'Hands are visibly soiled with blood or body fluids' },
          { id: 'd', label: 'Hands feel dry after washing' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 7,
        prompt:
          'A resident is on contact precautions. Before entering the room, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Put on gloves only' },
          { id: 'b', label: 'Put on a gown and gloves' },
          { id: 'c', label: 'Put on a mask only' },
          { id: 'd', label: 'No PPE is needed' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 8,
        prompt: 'A resident is diagnosed with C. difficile. The nurse aide SHOULD wash hands with:',
        options: [
          { id: 'a', label: 'Soap and water only' },
          { id: 'b', label: 'Alcohol-based hand sanitizer only' },
          { id: 'c', label: 'Either soap or sanitizer' },
          { id: 'd', label: 'Gloves are enough — no hand washing needed' },
        ],
        correctAnswer: 'a',
      },
      {
        sortOrder: 9,
        prompt:
          'Which PPE is needed when splashing of blood or body fluids is expected?',
        options: [
          { id: 'a', label: 'Gloves only' },
          { id: 'b', label: 'Gown only' },
          { id: 'c', label: 'Gloves, gown, mask, and eye protection' },
          { id: 'd', label: 'No PPE is needed if vaccinated' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 10,
        prompt: 'When removing contaminated gloves, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Pull both gloves off at the fingertips at the same time' },
          {
            id: 'b',
            label:
              'Peel one glove from the wrist, then remove the second without touching the outside',
          },
          { id: 'c', label: 'Rinse gloves before removing them' },
          { id: 'd', label: 'Remove gloves after leaving the resident\'s room' },
        ],
        correctAnswer: 'b',
      },
    ],
  },
  {
    courseSlug: 'dementia-care',
    title: 'Final Exam — Dementia Care for CNAs',
    questions: [
      {
        sortOrder: 1,
        prompt: 'A resident with dementia repeatedly asks to go home. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Explain firmly that this is their home now' },
          { id: 'b', label: 'Ignore the request' },
          { id: 'c', label: 'Validate feelings and redirect with a calm activity' },
          { id: 'd', label: 'Call the family each time this happens' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 2,
        prompt:
          'A resident with dementia becomes agitated during a bath. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Restrain the resident and finish quickly' },
          { id: 'b', label: 'Increase the water temperature to distract them' },
          { id: 'c', label: 'Stop the bath and try again later using a calm approach' },
          { id: 'd', label: 'Ask the nurse to give a sedative first' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 3,
        prompt: 'Sundowning refers to:',
        options: [
          { id: 'a', label: 'A resident sleeping during the day' },
          {
            id: 'b',
            label: 'Increased confusion or agitation in the late afternoon or evening',
          },
          { id: 'c', label: 'Depression from lack of sunlight' },
          { id: 'd', label: 'A resident\'s preference for nighttime activities' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 4,
        prompt:
          'When communicating with a resident who has moderate dementia, the nurse aide SHOULD use:',
        options: [
          { id: 'a', label: 'Long detailed explanations' },
          { id: 'b', label: 'Medical terms to be accurate' },
          { id: 'c', label: 'Written instructions on the bedside table' },
          { id: 'd', label: 'Short simple sentences and a calm tone' },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 5,
        prompt: 'A resident with dementia is walking toward an exit. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Physically block the resident without speaking' },
          { id: 'b', label: 'Yell at the resident to stop' },
          { id: 'c', label: 'Calmly redirect with a familiar activity or topic' },
          { id: 'd', label: 'Lock the resident in their room' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 6,
        prompt: 'The BEST environment for a resident with dementia is:',
        options: [
          { id: 'a', label: 'Bright lights and loud background noise' },
          { id: 'b', label: 'Frequent room changes for stimulation' },
          { id: 'c', label: 'Calm, consistent, and low-stimulation' },
          { id: 'd', label: 'Large group activities throughout the day' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 7,
        prompt:
          'A resident with dementia believes the nurse aide is a family member. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Firmly correct the resident every time' },
          { id: 'b', label: 'Play along completely with the confusion' },
          { id: 'c', label: 'Gently redirect without arguing' },
          { id: 'd', label: 'Avoid the resident until the confusion passes' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 8,
        prompt:
          'Which approach BEST supports a resident with dementia who has poor appetite?',
        options: [
          { id: 'a', label: 'Serve all foods at once on a full tray' },
          { id: 'b', label: 'Feed the resident as fast as possible' },
          { id: 'c', label: 'Offer one finger food at a time in a quiet setting' },
          { id: 'd', label: 'Withhold meals until the resident is hungry enough' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 9,
        prompt: 'Validation therapy means the nurse aide:',
        options: [
          { id: 'a', label: 'Corrects the resident\'s false beliefs with facts' },
          { id: 'b', label: 'Uses logic to orient the resident to the current date' },
          { id: 'c', label: 'Acknowledges and respects the resident\'s feelings' },
          { id: 'd', label: 'Redirects every statement to current events' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 10,
        prompt:
          'A resident with dementia refuses oral hygiene every day. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Skip oral care since the resident always refuses' },
          { id: 'b', label: 'Force the toothbrush in when the resident is distracted' },
          { id: 'c', label: 'Document the refusal and report to the nurse' },
          { id: 'd', label: 'Ask the family to do all oral care' },
        ],
        correctAnswer: 'c',
      },
    ],
  },
  {
    courseSlug: 'legal-ethical-nursing-practice',
    title: 'Final Exam — Legal & Ethical Issues in Nursing Practice',
    questions: [
      {
        sortOrder: 1,
        prompt: 'The scope of practice for a CNA is defined by:',
        options: [
          { id: 'a', label: 'The facility\'s policies only' },
          { id: 'b', label: 'The supervising nurse on duty' },
          { id: 'c', label: 'The individual CNA\'s experience level' },
          { id: 'd', label: 'California law and the CDPH' },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 2,
        prompt:
          'A CNA is asked to perform a task outside the scope of practice. The CNA SHOULD:',
        options: [
          { id: 'a', label: 'Perform the task if a family member is present' },
          { id: 'b', label: 'Perform the task since the resident requested it' },
          { id: 'c', label: 'Decline and notify the supervising nurse' },
          { id: 'd', label: 'Complete the task if they have seen it done before' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 3,
        prompt: 'HIPAA protects a patient\'s health information in:',
        options: [
          { id: 'a', label: 'Electronic records only' },
          { id: 'b', label: 'Billing records only' },
          { id: 'c', label: 'All forms — verbal, written, and electronic' },
          { id: 'd', label: 'Staff personnel records only' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 4,
        prompt: 'The CORRECT way to correct a documentation error is to:',
        options: [
          { id: 'a', label: 'Use correction fluid to cover the error' },
          { id: 'b', label: 'Scribble over the error completely' },
          { id: 'c', label: 'Tear out the page and start over' },
          {
            id: 'd',
            label: 'Draw one line through the error, write "error," initial, and date it',
          },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 5,
        prompt: 'Which of the following is a professional boundary violation?',
        options: [
          { id: 'a', label: 'Reporting a change in condition to the nurse' },
          { id: 'b', label: 'Documenting a resident\'s refusal of care' },
          { id: 'c', label: 'Accepting a large cash gift from a resident\'s family' },
          { id: 'd', label: 'Following the care plan as written' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 6,
        prompt: 'The ethical principle of "do no harm" means the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Always follow the resident\'s wishes even if unsafe' },
          { id: 'b', label: 'Avoid any action that could injure or harm the resident' },
          { id: 'c', label: 'Only provide care when the nurse is present' },
          { id: 'd', label: 'Report all resident requests to the nurse' },
        ],
        correctAnswer: 'b',
      },
      {
        sortOrder: 7,
        prompt:
          'A resident asks the nurse aide to keep a symptom secret from the nurse. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Keep the secret to maintain trust' },
          { id: 'b', label: 'Tell other nurse aides before reporting' },
          {
            id: 'c',
            label: 'Explain that safety concerns must be reported, then notify the nurse',
          },
          { id: 'd', label: 'Document it without telling anyone' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 8,
        prompt: 'Accurate documentation is important because:',
        options: [
          { id: 'a', label: 'It is only needed for billing purposes' },
          { id: 'b', label: 'It is optional if the shift is uneventful' },
          { id: 'c', label: 'It is only reviewed during state surveys' },
          { id: 'd', label: 'It provides a legal record and supports safe care' },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 9,
        prompt: 'Advance directives are legal documents that:',
        options: [
          { id: 'a', label: 'Allow staff to make decisions without the resident' },
          { id: 'b', label: 'Only apply when the resident is unconscious' },
          { id: 'c', label: 'Must be re-signed at each admission' },
          { id: 'd', label: 'State the resident\'s wishes for future medical care' },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 10,
        prompt: 'Which of the following actions by a nurse aide is ethical?',
        options: [
          { id: 'a', label: 'Sharing a resident\'s personal information with visitors' },
          { id: 'b', label: 'Reporting observed abuse to the charge nurse' },
          { id: 'c', label: 'Performing tasks outside the scope of practice' },
          { id: 'd', label: 'Ignoring a resident\'s complaint to save time' },
        ],
        correctAnswer: 'b',
      },
    ],
  },
  {
    courseSlug: 'workplace-violence-prevention',
    title: 'Final Exam — Workplace Violence Prevention in Healthcare',
    questions: [
      {
        sortOrder: 1,
        prompt: 'Early warning signs that a resident may become aggressive include:',
        options: [
          { id: 'a', label: 'Sleeping more than usual' },
          { id: 'b', label: 'Decreased appetite and withdrawal' },
          { id: 'c', label: 'Raised voice, restlessness, and clenched fists' },
          { id: 'd', label: 'Requesting to speak with a social worker' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 2,
        prompt: 'The MOST common source of workplace violence in healthcare is:',
        options: [
          { id: 'a', label: 'Coworker disputes' },
          { id: 'b', label: 'Visitors and family members' },
          { id: 'c', label: 'Vendor interactions' },
          { id: 'd', label: 'Residents or patients' },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 3,
        prompt:
          'When a nurse aide feels physically threatened by a resident, the FIRST action is to:',
        options: [
          { id: 'a', label: 'Physically restrain the resident' },
          { id: 'b', label: 'Stay and talk the resident down alone' },
          { id: 'c', label: 'Threaten consequences to stop the behavior' },
          { id: 'd', label: 'Remove themselves from danger and call for help' },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 4,
        prompt: 'De-escalation techniques include:',
        options: [
          { id: 'a', label: 'Matching the resident\'s tone and volume' },
          { id: 'b', label: 'Standing very close to show control' },
          { id: 'c', label: 'Speaking calmly and maintaining a safe distance' },
          { id: 'd', label: 'Ignoring the behavior until it stops' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 5,
        prompt: 'After a workplace violence incident, the nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Go home immediately to recover' },
          { id: 'b', label: 'Handle it privately without reporting' },
          { id: 'c', label: 'Tell coworkers informally only' },
          { id: 'd', label: 'Complete an incident report per facility policy' },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 6,
        prompt: 'Which environmental factor INCREASES the risk of workplace violence?',
        options: [
          { id: 'a', label: 'Well-lit hallways and open nursing stations' },
          { id: 'b', label: 'Adequate staffing levels' },
          { id: 'c', label: 'Poor lighting and isolated areas' },
          { id: 'd', label: 'Regular safety training for staff' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 7,
        prompt: 'Workplace violence in healthcare includes:',
        options: [
          { id: 'a', label: 'Physical assault only' },
          { id: 'b', label: 'Disagreements between staff members only' },
          { id: 'c', label: 'Expected behaviors in dementia care only' },
          { id: 'd', label: 'Physical, verbal, and psychological threats or assault' },
        ],
        correctAnswer: 'd',
      },
      {
        sortOrder: 8,
        prompt:
          'A visitor becomes verbally aggressive at the nursing station. The nurse aide SHOULD:',
        options: [
          { id: 'a', label: 'Argue back to defend the facility' },
          { id: 'b', label: 'Walk away without saying anything' },
          { id: 'c', label: 'Stay calm and ask for supervisory support' },
          { id: 'd', label: 'Immediately call security without speaking' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 9,
        prompt: 'California law requires healthcare facilities to have a:',
        options: [
          { id: 'a', label: 'Security guard at every entrance' },
          { id: 'b', label: 'Voluntary violence reporting system' },
          { id: 'c', label: 'Written Workplace Violence Prevention Plan' },
          { id: 'd', label: 'Employee assistance program only' },
        ],
        correctAnswer: 'c',
      },
      {
        sortOrder: 10,
        prompt: 'Which statement about workplace violence reporting is TRUE?',
        options: [
          { id: 'a', label: 'Only managers are required to report' },
          { id: 'b', label: 'Verbal threats do not need to be reported' },
          { id: 'c', label: 'It is the nurse\'s responsibility only' },
          { id: 'd', label: 'All healthcare workers including CNAs must report incidents' },
        ],
        correctAnswer: 'd',
      },
    ],
  },
];

async function getPublishedVersionId(courseSlug: string): Promise<string | null> {
  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, deletedAt: null },
    select: { id: true },
  });

  if (!course) return null;

  const version = await prisma.courseVersion.findFirst({
    where: {
      courseId: course.id,
      status: CourseVersionStatus.PUBLISHED,
      deletedAt: null,
    },
    orderBy: { versionNumber: 'desc' },
    select: { id: true, versionNumber: true },
  });

  return version?.id ?? null;
}

async function deleteExistingFinalExam(courseVersionId: string): Promise<void> {
  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId, slug: FINAL_EXAM_SLUG, deletedAt: null },
    select: { id: true },
  });

  if (!existing) return;

  await prisma.question.deleteMany({ where: { assessmentId: existing.id } });
  await prisma.assessment.delete({ where: { id: existing.id } });
}

async function upsertFinalExam(
  courseVersionId: string,
  config: CourseExamConfig,
): Promise<{ assessmentId: string; questionsUpserted: number }> {
  const existing = await prisma.assessment.findFirst({
    where: { courseVersionId, slug: FINAL_EXAM_SLUG, deletedAt: null },
  });

  const assessment = existing
    ? await prisma.assessment.update({
        where: { id: existing.id },
        data: {
          title: config.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: 80,
          maxAttempts: 3,
          settings: EXAM_SETTINGS,
        },
      })
    : await prisma.assessment.create({
        data: {
          courseVersionId,
          slug: FINAL_EXAM_SLUG,
          title: config.title,
          kind: AssessmentKind.FINAL_EXAM,
          passingScore: 80,
          maxAttempts: 3,
          settings: EXAM_SETTINGS,
        },
      });

  let questionsUpserted = 0;

  for (const q of config.questions) {
    const existingQ = await prisma.question.findFirst({
      where: { assessmentId: assessment.id, sortOrder: q.sortOrder },
    });

    if (existingQ) {
      await prisma.question.update({
        where: { id: existingQ.id },
        data: {
          type: QuestionType.SINGLE_CHOICE,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1,
          metadata: {},
          deletedAt: null,
        },
      });
    } else {
      await prisma.question.create({
        data: {
          assessmentId: assessment.id,
          sortOrder: q.sortOrder,
          type: QuestionType.SINGLE_CHOICE,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: 1,
          metadata: {},
        },
      });
    }

    questionsUpserted += 1;
  }

  return { assessmentId: assessment.id, questionsUpserted };
}

async function seedCourseExam(config: CourseExamConfig): Promise<void> {
  const versionId = await getPublishedVersionId(config.courseSlug);

  if (!versionId) {
    console.error(`SKIP: ${config.courseSlug} — no published course version found`);
    return;
  }

  try {
    if (config.replaceExisting) {
      await deleteExistingFinalExam(versionId);
    }

    const { assessmentId, questionsUpserted } = await upsertFinalExam(versionId, config);

    const action = config.replaceExisting ? 're-seeded' : 'seeded';
    console.log(
      `SUCCESS: ${config.courseSlug} — ${action} final exam (version ${versionId}, assessment ${assessmentId}, ${questionsUpserted} questions)`,
    );
  } catch (error) {
    console.error(`ERROR: ${config.courseSlug} —`, error);
  }
}

async function main() {
  console.log('Seeding final exams for 11 courses...\n');

  for (const config of COURSE_EXAMS) {
    await seedCourseExam(config);
  }

  console.log('\n--- Verification ---');

  const versionIds: string[] = [];
  for (const config of COURSE_EXAMS) {
    const versionId = await getPublishedVersionId(config.courseSlug);
    if (versionId) versionIds.push(versionId);
  }

  const assessmentCount = await prisma.assessment.count({
    where: {
      courseVersionId: { in: versionIds },
      slug: FINAL_EXAM_SLUG,
      kind: AssessmentKind.FINAL_EXAM,
      deletedAt: null,
    },
  });

  const assessments = await prisma.assessment.findMany({
    where: {
      courseVersionId: { in: versionIds },
      slug: FINAL_EXAM_SLUG,
      kind: AssessmentKind.FINAL_EXAM,
      deletedAt: null,
    },
    select: { id: true },
  });

  const questionCount = await prisma.question.count({
    where: {
      assessmentId: { in: assessments.map((a) => a.id) },
      deletedAt: null,
    },
  });

  console.log(`Final exam assessments: ${assessmentCount}`);
  console.log(`Final exam questions: ${questionCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
