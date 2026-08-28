import { describe, expect, it } from 'vitest';
import { ASSESSMENT_QUESTIONS } from './assessment';

describe('free assessment', () => {
  it('contains fourteen focused questions', () => {
    expect(ASSESSMENT_QUESTIONS).toHaveLength(14);
  });

  it('does not place email, zodiac, or photo behind the free result', () => {
    const ids = ASSESSMENT_QUESTIONS.map((question) => question.id);
    expect(ids).not.toContain('email');
    expect(ids).not.toContain('zodiac_sign');
    expect(ids).not.toContain('photo');
  });
});
