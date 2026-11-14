/**
 * Bulk Professional Development course definitions.
 * Append new entries here, then run:
 *   pnpm --filter @calace/db db:seed-professional-development-courses
 */
export type ProfessionalDevelopmentBulkCourse = {
  slug: string;
  title: string;
  summary: string;
};

export const PROFESSIONAL_DEVELOPMENT_BULK_COURSES: ProfessionalDevelopmentBulkCourse[] = [
  // --- 10 AI-FOCUSED DEMENTIA & SAFETY COURSES ---
  {
    slug: 'ai-dementia-care-safety-dignity-rights',
    title: 'AI & Dementia Care: Protecting Safety, Dignity, and Rights',
    summary: 'A course on how AI tools can enhance safety, reduce risks, and uphold the dignity and legal rights of people living with dementia.',
  },
  {
    slug: 'smart-safeguards-ai-prevent-abuse',
    title: 'Smart Safeguards: Using AI to Prevent Abuse in Dementia Care',
    summary: 'Focuses on how AI-powered monitoring, pattern detection, and alerts can help prevent neglect, mistreatment, and caregiver burnout-related abuse.',
  },
  {
    slug: 'ai-ethical-care-patient-rights',
    title: 'AI for Ethical Care: Strengthening Patient Rights in Dementia Support',
    summary: 'Explores how AI can reinforce ethical decision-making, informed consent, and rights-based care practices in dementia settings.',
  },
  {
    slug: 'ai-empowered-caregiver-zero-abuse',
    title: 'The AI-Empowered Caregiver: Safer Dementia Support, Zero Abuse',
    summary: 'Shows caregivers how AI tools can improve behavior management, reduce escalation, and create safer environments for vulnerable adults.',
  },
  {
    slug: 'dementia-behaviors-ai-respectful-care',
    title: 'Dementia Behaviors + AI: A New Model for Safe, Respectful Care',
    summary: 'Teaches how AI can help interpret behaviors, predict triggers, and guide respectful, non-punitive responses.',
  },
  {
    slug: 'ai-against-abuse-protecting-vulnerable',
    title: 'AI Against Abuse: Modern Tools for Protecting Vulnerable Adults',
    summary: 'Covers how AI systems can detect red flags, identify risk patterns, and support early intervention in abuse-prone situations.',
  },
  {
    slug: 'rights-first-dementia-care-ai',
    title: 'Rights-First Dementia Care: How AI Enhances Safety and Oversight',
    summary: 'Explains how AI improves transparency, documentation, and accountability to protect patient rights in long-term care environments.',
  },
  {
    slug: 'ai-dementia-early-detection-responses',
    title: 'AI in Dementia Caregiving: Early Detection, Safer Responses, Better Outcomes',
    summary: 'Focuses on AI-assisted early warning systems that help caregivers respond safely to wandering, agitation, and behavioral changes.',
  },
  {
    slug: 'tech-driven-protection-ai-reduce-abuse',
    title: 'Tech-Driven Protection: Using AI to Reduce Abuse and Improve Dementia Care',
    summary: 'Shows how AI can support safer staffing, real-time monitoring, and proactive interventions to reduce harm.',
  },
  {
    slug: 'human-care-ai-elevating-safety',
    title: 'Human Care, AI Support: Elevating Safety and Rights in Dementia Settings',
    summary: 'Highlights how AI enhances—not replaces—human compassion by improving safety, communication, and rights-based care.',
  },

  // --- 55 CALIFORNIA CNA ONLINE CEU TOPICS ---
  {
    slug: 'california-title-22-cna-regulations',
    title: 'Navigating California Title 22: Essential Regulations for CNAs',
    summary: 'An online review of CDPH Title 22 regulations governing long-term care facilities, CNA scope of practice, and facility compliance.',
  },
  {
    slug: 'digital-age-hipaa-compliance',
    title: 'HIPAA Compliance in the Digital Age: Social Media and Privacy',
    summary: 'Protects CNAs from accidental privacy violations by exploring HIPAA rules regarding smartphones, electronic records, and social media.',
  },
  {
    slug: 'mandated-reporting-elder-abuse-online',
    title: 'Mandated Reporting: Identifying and Preventing Elder Abuse',
    summary: 'A critical review of the legal responsibilities of a CNA to recognize, document, and report physical, emotional, and financial elder abuse.',
  },
  {
    slug: 'patient-rights-ombudsman-advocacy',
    title: 'Resident Rights and the Role of the Ombudsman in California',
    summary: 'Explores the California Patient Bill of Rights, self-determination, and how to work alongside the local Ombudsman to advocate for residents.',
  },
  {
    slug: 'cultural-competence-diverse-facilities',
    title: 'Cultural Competence: Delivering Respectful Care in Diverse Facilities',
    summary: 'Teaches essential skills for navigating cultural, religious, and language differences to provide unbiased, dignified care to all residents.',
  },
  {
    slug: 'infection-control-ppe-guidelines',
    title: 'Infection Control Essentials: Advanced PPE and Pathogen Defense',
    summary: 'Standard precautions, proper doffing/donning of PPE, and breaking the chain of infection in high-density nursing environments.',
  },
  {
    slug: 'managing-outbreaks-covid-flu',
    title: 'Managing Viral Outbreaks: COVID-19, RSV, and Influenza Protocols',
    summary: 'Advanced isolation procedures and sanitation protocols for CNAs during active respiratory virus outbreaks in long-term care.',
  },
  {
    slug: 'bloodborne-pathogens-safety-cna',
    title: 'Bloodborne Pathogens and Workplace Safety for CNAs',
    summary: 'Safe handling of sharps, biohazards, and soiled linens to protect healthcare workers from Hepatitis B, C, and HIV transmission.',
  },
  {
    slug: 'vital-signs-early-warning-detection',
    title: 'Vital Signs Monitoring: Identifying Early Warning Signs',
    summary: 'Refining accuracy in taking vitals and understanding when subtle changes indicate severe underlying conditions like sepsis or shock.',
  },
  {
    slug: 'pain-management-non-verbal-cues',
    title: 'Pain Assessment: Recognizing Non-Verbal Cues in Seniors',
    summary: 'Training CNAs to detect grimacing, guarding, and behavioral shifts as indicators of untreated pain in cognitively impaired residents.',
  },
  {
    slug: 'skin-integrity-pressure-ulcer-prevention',
    title: 'Skin Integrity: Best Practices for Pressure Ulcer Prevention',
    summary: 'Strategies for frequent turning, offloading pressure, and utilizing barrier creams to prevent decubitus ulcers in bed-bound patients.',
  },
  {
    slug: 'incontinence-care-hygiene-dignity',
    title: 'Compassionate Incontinence Care and Maintaining Dignity',
    summary: 'Best practices for perineal care, preventing skin breakdown, and managing the psychological impact of incontinence on residents.',
  },
  {
    slug: 'diabetes-care-hypoglycemia-hyperglycemia',
    title: 'Diabetes Management: Recognizing Hypoglycemia and Hyperglycemia',
    summary: 'How to observe dietary intake, recognize dangerous blood sugar fluctuations, and respond to diabetic emergencies on the floor.',
  },
  {
    slug: 'diabetic-foot-care-cna-role',
    title: 'Diabetic Foot Care: Observation and Daily Prevention Strategies',
    summary: 'The CNA’s critical role in inspecting for neuropathy, poor circulation, and minor wounds that can lead to major diabetic complications.',
  },
  {
    slug: 'dysphagia-safe-feeding-techniques',
    title: 'Dysphagia and Aspiration: Safe Feeding Techniques',
    summary: 'Understanding thickened liquids, proper positioning, and recognizing silent aspiration to ensure safe mealtimes for stroke and dementia patients.',
  },
  {
    slug: 'optimizing-hydration-elderly-care',
    title: 'Dehydration in the Elderly: Prevention and Encouraging Fluids',
    summary: 'Techniques for encouraging fluid intake and recognizing the physical and behavioral signs of severe dehydration in seniors.',
  },
  {
    slug: 'nutrition-therapeutic-diets-ltc',
    title: 'Understanding Therapeutic Diets in Long-Term Care',
    summary: 'A guide to pureed, mechanical soft, low-sodium, and diabetic diets, ensuring residents receive the correct and safe nutritional orders.',
  },
  {
    slug: 'safe-patient-transfers-body-mechanics',
    title: 'Ergonomics and Body Mechanics: Safe Patient Transfers',
    summary: 'Mastering the use of gait belts, mechanical lifts, and proper posture to safely move residents while avoiding injury.',
  },
  {
    slug: 'caregiver-back-injury-prevention',
    title: 'Protecting Your Back: Injury Prevention for Nursing Assistants',
    summary: 'Focuses strictly on the CNA’s physical health, offering stretching routines and structural techniques to prevent chronic career-ending back pain.',
  },
  {
    slug: 'environmental-safety-fall-prevention',
    title: 'Environmental Safety: Advanced Fall Prevention Strategies',
    summary: 'How to conduct daily room audits, manage clutter, adjust lighting, and utilize bed alarms to reduce facility fall rates.',
  },
  {
    slug: 'alzheimers-disease-stages-care',
    title: 'Alzheimer\'s Disease: Understanding the Stages of Cognitive Decline',
    summary: 'A foundational look at the brain changes occurring in Alzheimer’s and how CNA care strategies must adapt across the three main stages.',
  },
  {
    slug: 'dementia-sundowning-management',
    title: 'Managing Sundowning Syndrome in Memory Care',
    summary: 'Actionable techniques for managing late-day confusion, anxiety, and pacing through lighting, routine, and calming interventions.',
  },
  {
    slug: 'deescalating-aggressive-behaviors',
    title: 'Crisis Intervention: De-escalating Aggressive Behaviors',
    summary: 'Verbal and non-verbal techniques to safely diffuse anger and combativeness without the use of chemical or physical restraints.',
  },
  {
    slug: 'safe-redirection-wandering-residents',
    title: 'Wandering Residents: Safe Redirection and Boundary Management',
    summary: 'Approaches to keep elopement-risk residents safe while validating their need to walk and explore the facility.',
  },
  {
    slug: 'adls-severe-cognitive-decline',
    title: 'Assisting with ADLs in Severe Cognitive Decline',
    summary: 'Step-by-step methods for assisting resistant or confused residents with bathing, dressing, and oral care without causing distress.',
  },
  {
    slug: 'communication-hearing-vision-loss',
    title: 'Overcoming Barriers: Caring for Residents with Hearing and Vision Loss',
    summary: 'How to effectively communicate with, guide, and care for seniors experiencing macular degeneration, glaucoma, and severe hearing loss.',
  },
  {
    slug: 'restorative-nursing-prom-exercises',
    title: 'Restorative Care: Passive Range of Motion (PROM) Techniques',
    summary: 'Proper application of PROM exercises to prevent contractures, improve circulation, and maintain joint flexibility in bed-bound residents.',
  },
  {
    slug: 'promoting-independence-adls',
    title: 'Restorative Philosophy: Promoting Independence in Daily Living',
    summary: 'Shifting the mindset from "doing for" the resident to "doing with" them, helping seniors maintain autonomy in their daily routines.',
  },
  {
    slug: 'safe-use-assistive-devices-mobility',
    title: 'Mobility Aids: The Safe Use of Walkers, Canes, and Wheelchairs',
    summary: 'Training on how to correctly size, inspect, and assist residents utilizing various mobility devices to prevent falls.',
  },
  {
    slug: 'end-of-life-dying-process',
    title: 'End-of-Life Care: Understanding the Physical Dying Process',
    summary: 'Educating CNAs on the physical changes that occur during the final days of life, including respiratory changes and mottling.',
  },
  {
    slug: 'palliative-vs-hospice-care-cna',
    title: 'Comfort Care: The CNA\'s Role in Palliative and Hospice Settings',
    summary: 'Differentiating between palliative and hospice care, with a focus on maximizing physical comfort and dignity for terminal patients.',
  },
  {
    slug: 'supporting-grieving-families-ltc',
    title: 'Grief and Loss: Supporting Families During End-of-Life',
    summary: 'Communication strategies for CNAs interacting with grieving families, offering professional empathy and emotional support.',
  },
  {
    slug: 'objective-subjective-charting-cna',
    title: 'Accurate Charting: Objective vs. Subjective Observation',
    summary: 'Training CNAs to write clear, factual, and legally sound clinical notes by removing personal opinions and using precise medical terminology.',
  },
  {
    slug: 'legal-documentation-pitfalls-cna',
    title: 'Legal Documentation: Avoiding Common Pitfalls in CNA Charting',
    summary: 'How incomplete flow sheets, blank spaces, and delayed charting can lead to legal liability for both the CNA and the facility.',
  },
  {
    slug: 'mental-health-depression-seniors',
    title: 'Mental Health in the Elderly: Recognizing Signs of Depression',
    summary: 'Differentiating normal aging from clinical depression and understanding how to support residents experiencing severe sadness and apathy.',
  },
  {
    slug: 'social-isolation-anxiety-ltc',
    title: 'Combating Social Isolation and Anxiety in Long-Term Care',
    summary: 'The CNA’s role in encouraging activity participation, facilitating friendships, and reducing the health risks associated with chronic loneliness.',
  },
  {
    slug: 'emergency-preparedness-fire-safety',
    title: 'Facility Emergency Preparedness: Fire Safety and Evacuation',
    summary: 'A deep dive into the RACE and PASS acronyms, fire extinguisher usage, and coordinating safe resident evacuations during a disaster.',
  },
  {
    slug: 'first-response-choking-seizures',
    title: 'First Response: Immediate Actions for Choking and Seizures',
    summary: 'Step-by-step protocols for clearing obstructed airways, safely managing grand mal seizures, and initiating emergency codes.',
  },
  {
    slug: 'cardiac-care-chf-support',
    title: 'Cardiac Care: Supporting Residents with Congestive Heart Failure',
    summary: 'Recognizing edema, shortness of breath, and fatigue to properly assist residents managing CHF and other chronic heart conditions.',
  },
  {
    slug: 'respiratory-care-copd-asthma',
    title: 'Respiratory Conditions: Caring for COPD and Asthma Patients',
    summary: 'Understanding oxygen safety, positioning for easier breathing, and recognizing signs of respiratory distress in the elderly.',
  },
  {
    slug: 'stroke-recovery-hemiplegia-care',
    title: 'Stroke Recovery: Assisting Residents with Hemiplegia and Aphasia',
    summary: 'Specialized techniques for transferring, dressing, and communicating with residents who have experienced a cerebrovascular accident (CVA).',
  },
  {
    slug: 'urinary-catheter-care-infection',
    title: 'Catheter Care: Preventing Urinary Tract Infections (UTIs)',
    summary: 'Best practices for emptying drainage bags, securing tubing, and performing meatal care to prevent life-threatening catheter-associated UTIs.',
  },
  {
    slug: 'bowel-management-impaction-prevention',
    title: 'Digestive Health: Bowel Management and Impaction Prevention',
    summary: 'Monitoring elimination patterns to prevent severe constipation, fecal impaction, and the associated behavioral issues in seniors.',
  },
  {
    slug: 'developmentally-disabled-adults-care',
    title: 'Specialized Care: Working with Developmentally Disabled Adults',
    summary: 'Adapting traditional CNA skills to care for adult residents with Down Syndrome, Autism, and Cerebral Palsy in long-term care settings.',
  },
  {
    slug: 'workplace-violence-prevention-healthcare',
    title: 'Workplace Violence Prevention in Healthcare Settings',
    summary: 'Recognizing environmental risks and understanding facility protocols to protect staff from physical and verbal abuse on the job.',
  },
  {
    slug: 'caregiver-stress-burnout-prevention',
    title: 'Caregiver Wellness: Managing Stress and Preventing Burnout',
    summary: 'Tools for nursing assistants to manage compassion fatigue, practice self-care, and maintain a healthy work-life balance.',
  },
  {
    slug: 'professional-boundaries-nursing-assistants',
    title: 'Maintaining Professional Boundaries with Residents and Families',
    summary: 'Navigating complex relationships by preventing over-involvement, avoiding favoritism, and politely declining inappropriate gifts.',
  },
  {
    slug: 'lgbtq-inclusive-care-seniors',
    title: 'Inclusive Care: Supporting LGBTQ+ Seniors in Long-Term Care',
    summary: 'Creating a welcoming, discrimination-free environment that respects the history, relationships, and identities of LGBTQ+ elders.',
  },
  {
    slug: 'substance-abuse-older-adults',
    title: 'Hidden Epidemic: Recognizing Substance Abuse in Older Adults',
    summary: 'Educating CNAs on the signs of alcohol dependency, prescription drug misuse, and withdrawal symptoms in the geriatric population.',
  },
  {
    slug: 'california-ab-1629-reimbursement-direct-care',
    title: 'Understanding AB 1629: Facility Staffing Metrics and the CNA',
    summary: 'How California’s direct care hours requirements impact daily CNA shift mandates, documentation, and facility funding.',
  },
  {
    slug: 'post-acute-rehabilitation-cna-role',
    title: 'Post-Acute Rehab: Care Transitions from Hospital to SNF',
    summary: 'Best practices for CNAs welcoming newly discharged post-surgical or stroke residents into skilled nursing facilities.',
  },
  {
    slug: 'psychotropic-medication-monitoring-safeguards',
    title: 'Antipsychotic Stewardship: Monitoring Behavioral Side Effects',
    summary: 'The CNA’s role in observing and charting adverse effects or over-sedation signs in residents on psychotropic regimens.',
  },
  {
    slug: 'resident-recreational-therapy-cna-collaboration',
    title: 'Meaningful Days: Collaborating with Activity and Rehab Teams',
    summary: 'How CNAs can integrate cognitive stimulation and restorative walking programs directly into routine morning ADL care.',
  },
  {
    slug: 'advancing-your-cna-career-california',
    title: 'Career Pathways: Advancing Your Nursing Assistant Certification in CA',
    summary: 'Navigating CDPH requirements to become a Certified Home Health Aide (HHA) or Restorative Nursing Assistant (RNA).',
  },
  {
    slug: 'multisystem-trauma-frail-elderly-care',
    title: 'Fragile Frames: Care Management for Osteoporosis and Arthritis',
    summary: 'Safe handling, structural positioning, and transferring methods designed to minimize pain and fracture risks in frail seniors.',
  }
];