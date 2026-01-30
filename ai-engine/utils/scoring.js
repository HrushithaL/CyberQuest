// simple scoring
exports.calculateScore = (mission, answers = [], timeTaken = 0) => {
  if (!mission || !mission.questions || mission.questions.length === 0) return 0;
  let correct = 0;
  mission.questions.forEach((q, i) => {
    if (answers[i] === q.answerIndex) correct++;
  });
  const accuracy = correct / mission.questions.length;
  const base = mission.rewardPoints || 10;
  const difficultyMultiplier = mission.difficulty === "easy" ? 1 : mission.difficulty === "medium" ? 1.5 : 2;
  const timeBonus = Math.max(0, Math.floor((Math.max(0, 60 - (timeTaken || 0))) / 10));
  const score = Math.round(base * accuracy * difficultyMultiplier + timeBonus);
  return score;
};
