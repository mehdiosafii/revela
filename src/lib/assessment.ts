import { QUESTIONS, type Question } from './engine';

// Keep the assessment focused on the answers that materially change the result.
// Email is collected by Stripe at checkout, and the optional illustration photo
// is offered only after purchase so the free assessment has no contact or upload wall.
const ACTIVE_QUESTION_IDS = [
  'name',
  'age_range',
  'single_duration',
  'home_climate',
  'father_figure',
  'child_comfort',
  'breakup_pattern',
  'exes_pattern',
  'he_pulls_away',
  'conflict_style',
  'falling_style',
  'marriage_timeline',
  'children_dream',
  'own_words',
] as const;

const activeIds = new Set<string>(ACTIVE_QUESTION_IDS);

export const ASSESSMENT_QUESTIONS: Question[] = QUESTIONS.filter((question) => activeIds.has(question.id));

if (import.meta.env.DEV && ASSESSMENT_QUESTIONS.length !== ACTIVE_QUESTION_IDS.length) {
  console.warn('One or more Revela assessment questions could not be found in the engine.');
}
