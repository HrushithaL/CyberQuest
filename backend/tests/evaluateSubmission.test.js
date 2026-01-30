const missionController = require('../src/controllers/missionController');

describe('evaluateSubmission optimizations', () => {
  afterEach(() => {
    // restore default caller and clear cache
    missionController.__setOpenAICaller(undefined);
    missionController.__clearEvaluationCache();
  });

  test('early-match avoids AI and caches result', async () => {
    const challenge = { title: 'T1', description: 'desc', officialAnswer: 'print("hello")' };
    const submission = 'print("hello")';

    // First call should match official and not use AI
    const res1 = await missionController.evaluateSubmission(challenge, submission, {});
    expect(res1.isCorrect).toBe(true);
    expect(res1.aiUsed).toBe(false);
    expect(res1.aiMatch).toBe(true);

    // Inject an openAICaller that would throw if called — ensuring cache prevents a call
    let called = false;
    missionController.__setOpenAICaller(() => { called = true; throw new Error('Should not call AI'); });

    const res2 = await missionController.evaluateSubmission(challenge, submission, {});
    expect(res2.isCorrect).toBe(true);
    expect(called).toBe(false);
  });

  test('combined prompt returns grade and official answer in single AI call', async () => {
    const challenge = { title: 'T2', description: 'desc', testCases: [], expected: null };
    const submission = 'some submission';

    // Mock AI combined response
    const fakeResponse = {
      choices: [{ message: { content: JSON.stringify({ grade: { scoreFraction: 0.75, testsPassed: 0, totalTests: 0, explanation: 'partial', hint: null, recommendHint: false }, officialAnswer: 'Canonical solution' }) } }]
    };

    missionController.__setOpenAICaller(async () => fakeResponse);

    const res = await missionController.evaluateSubmission(challenge, submission, { forceGenerateOfficial: true });
    expect(res.aiUsed).toBe(true);
    expect(res.officialAnswer).toBe('Canonical solution');
    expect(res.aiGeneratedAnswer).toBe(true);
    expect(res.scoreFraction).toBeGreaterThan(0);
  });
});