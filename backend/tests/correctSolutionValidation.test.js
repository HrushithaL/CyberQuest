const missionController = require('../src/controllers/missionController');

describe('Deterministic validation with correctSolution', () => {
  afterEach(() => {
    missionController.__setOpenAICaller(undefined);
    missionController.__clearEvaluationCache();
  });

  test('event ordering: perfect order yields correct', async () => {
    const solution = {
      type: 'ordering',
      correctOrder: [
        '1. Initial reconnaissance scan detected',
        '2. Suspicious login attempts from foreign IP',
        '3. Privilege escalation detected',
        '4. Unauthorized data access',
        '5. Data exfiltration attempt blocked'
      ],
      correctIndices: [0,1,2,3,4]
    };
    const challenge = { title: 'Order Security Events', correctSolution: solution };

    const submission = JSON.stringify(solution.correctOrder);
    const res = await missionController.evaluateSubmission(challenge, submission, {});
    expect(res.aiUsed).toBe(false);
    expect(res.scoreFraction).toBe(1);
    expect(res.isCorrect).toBe(true);
    expect(res.correctness).toBe('correct');
    expect(res.officialAnswer).toBeNull();
  });

  test('event ordering: partial order yields fractional score and partial correctness', async () => {
    const correctOrder = [
      '1. Initial reconnaissance scan detected',
      '2. Suspicious login attempts from foreign IP',
      '3. Privilege escalation detected',
      '4. Unauthorized data access',
      '5. Data exfiltration attempt blocked'
    ];
    const solution = { type: 'ordering', correctOrder, correctIndices: [0,1,2,3,4] };
    const challenge = { title: 'Order Security Events', correctSolution: solution };

    // Swap a couple of positions to simulate partial correctness
    const submissionArray = [
      correctOrder[0],
      correctOrder[2], // out of order
      correctOrder[1], // out of order
      correctOrder[3],
      correctOrder[4]
    ];
    const res = await missionController.evaluateSubmission(challenge, JSON.stringify(submissionArray), {});
    expect(res.aiUsed).toBe(false);
    expect(res.scoreFraction).toBeGreaterThan(0);
    expect(res.scoreFraction).toBeLessThan(1);
    expect(res.correctness).toBe('partially correct');
    expect(res.officialAnswer).toBeNull();
  });

  test('string solution (forensic IP): exact match is correct, no exposure', async () => {
    const challenge = { title: 'Find Suspicious IP', correctSolution: '182.76.12.54' };
    const res = await missionController.evaluateSubmission(challenge, '182.76.12.54', {});
    expect(res.aiUsed).toBe(false);
    expect(res.isCorrect).toBe(true);
    expect(res.scoreFraction).toBe(1);
    expect(res.correctness).toBe('correct');
    expect(res.officialAnswer).toBeNull();
  });

  test('string solution (forensic IP): partial match yields partial correctness', async () => {
    const challenge = { title: 'Find Suspicious IP', correctSolution: '182.76.12.54' };
    const res = await missionController.evaluateSubmission(challenge, 'Suspicious IP: 182.76.12.5', {});
    expect(res.aiUsed).toBe(false);
    expect(res.isCorrect).toBe(false);
    expect(res.scoreFraction).toBeGreaterThan(0);
    expect(res.correctness).toBe('partially correct');
    expect(res.officialAnswer).toBeNull();
  });

  test('determinism: same input yields same result and uses cache', async () => {
    const solution = {
      type: 'ordering',
      correctOrder: [
        '1. Initial reconnaissance scan detected',
        '2. Suspicious login attempts from foreign IP',
        '3. Privilege escalation detected',
        '4. Unauthorized data access',
        '5. Data exfiltration attempt blocked'
      ],
      correctIndices: [0,1,2,3,4]
    };
    const challenge = { id: 'challenge-123', title: 'Order Security Events', correctSolution: solution };
    const submission = JSON.stringify(solution.correctOrder);

    const res1 = await missionController.evaluateSubmission(challenge, submission, {});
    // Set a caller that would throw if AI path were taken on second call
    missionController.__setOpenAICaller(() => { throw new Error('AI should not be called'); });
    const res2 = await missionController.evaluateSubmission(challenge, submission, {});

    expect(res1.scoreFraction).toBe(res2.scoreFraction);
    expect(res1.correctness).toBe(res2.correctness);
    expect(res2.aiUsed).toBe(false);
  });
});
