import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiGetMissionById, apiGetUserProfile, apiGetMissions, apiEvaluateChallenge, apiValidateSection } from "../utils/api";
import { submitMissionAndRefresh, submitMission, autosaveMission } from "../utils/missionSubmit";
import { AuthContext } from "../context/AuthContext";

export default function MissionPlay() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, login } = useContext(AuthContext);

  const [mission, setMission] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [answerDetails, setAnswerDetails] = useState([]);
  const [submittedTabs, setSubmittedTabs] = useState({ questions: false, scenarios: false, challenges: false });
  const [challengeSolutions, setChallengeSolutions] = useState({});
  const [mcqHintsRemaining, setMcqHintsRemaining] = useState(3);
  const [mcqUnlockedHints, setMcqUnlockedHints] = useState([]);
  const [showMcqHintModal, setShowMcqHintModal] = useState(false);
  const [mcqTaskInput, setMcqTaskInput] = useState("");
  const [mcqHintSources, setMcqHintSources] = useState([]);
  const [showScorecardAvailable, setShowScorecardAvailable] = useState({ questions: false, scenarios: false, challenges: false });
  const [scorecardIndex, setScorecardIndex] = useState(0);
  const [scorecardFilter, setScorecardFilter] = useState('all');
  const [loadingMission, setLoadingMission] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");
  const [showScorecard, setShowScorecard] = useState(false);
  const [challengeCode, setChallengeCode] = useState("");
  const [nextTabAfterSubmit, setNextTabAfterSubmit] = useState(null);
  const [expandedHints, setExpandedHints] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);
  const saveTimer = useRef(null);
  const [dirty, setDirty] = useState(false);
  const autosaveInProgress = useRef(false);
  const [checkResults, setCheckResults] = useState({});
  const [checking, setChecking] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);

  const toggleHintExpansion = (challengeIndex) => {
    setExpandedHints(prev => ({
      ...prev,
      [challengeIndex]: !prev[challengeIndex]
    }));
  };

  useEffect(() => {
    (async () => {
      setLoadingMission(true);
      try {
        const data = await apiGetMissionById(id);

        if (data?.message?.toLowerCase().includes("token")) {
          nav("/login");
          return;
        }

        if (!data || !data._id) {
          console.error("Invalid mission data received");
          alert("Failed to load mission. Please try again.");
          nav("/missions");
          return;
        }

        console.log("MISSION LOADED:", data);
        // Sanitize mission content to avoid undefined entries
        const cleanQuestions = (data.content?.questions || data.questions || []).filter(Boolean);
        const cleanScenarios = (data.content?.scenarios || data.scenarios || []).filter(Boolean);
        const cleanChallenges = (data.content?.challenges || data.challenges || []).filter(Boolean);
        setMission({
          ...data,
          content: {
            ...(data.content || {}),
            questions: cleanQuestions,
            scenarios: cleanScenarios,
            challenges: cleanChallenges,
          },
        });

        try {
          localStorage.setItem(`mission_accessed_${data._id}`, new Date().toISOString());
        } catch (err) { }

        // Load and surface any saved answers / solutions for review or continued play
        const userProg = data.userProgress || {};

        const submissionTrack = userProg?.submissionTrack || {};

        if (userProg?.answers && userProg.answers.length > 0) {
          const loadedAnswers = {};
          userProg.answers.forEach((ans, idx) => {
            if (ans !== undefined) loadedAnswers[idx] = ans;
          });
          setAnswers(loadedAnswers);
          console.log("Loaded previous answers:", loadedAnswers);

          // If mission was already completed, compute answerDetails locally so Review shows correctness
          if (userProg.status === 'completed') {
            const questionsArr = (data.content?.questions || data.questions || []).filter(Boolean);
            const challengesArr = (data.content?.challenges || data.challenges || []).filter(Boolean);
            const computedDetails = [];

            // questions
            questionsArr.forEach((q, index) => {
              const userIdx = userProg.answers[index];
              const correctIndex = typeof q.answer === 'number' ? q.answer : (typeof q.answerIndex === 'number' ? q.answerIndex : null);
              const isCorrect = (userIdx !== undefined) && (correctIndex !== null ? userIdx === correctIndex : (q.answer !== undefined ? String(userIdx).trim() === String(q.answer).trim() : false));
              computedDetails.push({
                type: 'question',
                index,
                question: q.question,
                userAnswer: userIdx !== undefined ? (Array.isArray(q.options) ? q.options[userIdx] : userIdx) : 'Not answered',
                correctAnswer: Array.isArray(q.options) ? q.options[correctIndex] : q.answer,
                isCorrect,
                explanation: q.explanation || '',
                topic: data.topic
              });
            });

            // challenges
            challengesArr.forEach((c, idx) => {
              const submittedObj = userProg.challengeSolutions ? (userProg.challengeSolutions[idx] || userProg.challengeSolutions[String(idx)]) : null;
              const submittedText = submittedObj ? (typeof submittedObj === 'string' ? submittedObj.trim() : (submittedObj.code || '').toString().trim()) : '';
              let isCorrect = false;
              let note = '';

              // Prefer explicit expected or test-case based checks
              if (c.expected && typeof c.expected === 'string' && submittedText) {
                isCorrect = submittedText.toLowerCase().includes(c.expected.toLowerCase());
                note = isCorrect ? 'Matched expected output' : 'Submission received; did not match expected pattern';
              } else if (Array.isArray(c.testCases) && c.testCases.length > 0 && submittedText) {
                // Simple deterministic 'includes' check for each test case output
                const totalTests = c.testCases.length;
                let passed = 0;
                c.testCases.forEach(tc => {
                  const expected = (tc.output || '').toString().trim().toLowerCase();
                  if (!expected) return;
                  if (submittedText.toLowerCase().includes(expected)) passed++;
                });
                isCorrect = passed === totalTests && totalTests > 0;
                note = `Passed ${passed}/${totalTests} test cases`;
              } else if (submittedText) {
                // No deterministic checks available — mark as awaiting review
                isCorrect = false;
                note = 'Submission received (awaiting review — no test cases or expected answer available)';
              }

              computedDetails.push({
                type: 'challenge',
                index: idx,
                question: c.title || `Challenge ${idx + 1}`,
                submitted: submittedText || null,
                isCorrect,
                explanation: note || c.hint || (Array.isArray(c.hints) ? c.hints[0] : '') || '',
                topic: data.topic
              });
            });

            setAnswerDetails(computedDetails);
            setSubmittedTabs(prev => ({ ...prev, questions: true, challenges: submissionTrack.challengesSubmitted || false, scenarios: submissionTrack.scenariosSubmitted || false }));
            setShowScorecardAvailable(prev => ({ ...prev, questions: true, challenges: submissionTrack.challengesSubmitted || false, scenarios: submissionTrack.scenariosSubmitted || false }));
          }
        }

        if (userProg?.challengeSolutions) {
          setChallengeSolutions(userProg.challengeSolutions || {});
          if ((submissionTrack.challengesSubmitted || (userProg.status === 'completed' && Object.keys(userProg.challengeSolutions || {}).length > 0))) {
            setSubmittedTabs(prev => ({ ...prev, challenges: true }));
            setShowScorecardAvailable(prev => ({ ...prev, challenges: true }));
          }
        }

        // If the mission is already completed, mark scenarios as submitted only if the user actually answered them so Review shows selection
        if (userProg.status === 'completed' || submissionTrack.scenariosSubmitted) {
          const existingScenarios = (data.content?.scenarios || data.scenarios || []).filter(Boolean);
          if (existingScenarios.length > 0) {
            const userAnswers = userProg.answers || [];
            const questionCount = (data.content?.questions || data.questions || []).length || 0;
            const scenarioAnswers = userAnswers.slice(questionCount, questionCount + existingScenarios.length);
            // Only count numeric indices (>= 0) or non-empty strings as valid answers — ignore null/undefined/empty
            const hasScenarioAnswers = scenarioAnswers.some(a => (typeof a === 'number' && a >= 0) || (typeof a === 'string' && String(a).trim().length > 0));
            if (hasScenarioAnswers) {
              setSubmittedTabs(prev => ({ ...prev, scenarios: true }));
              setShowScorecardAvailable(prev => ({ ...prev, scenarios: true }));
            }
          }
        }

        // Honor submission track even if mission not completed
        if (submissionTrack.questionsSubmitted) {
          setSubmittedTabs(prev => ({ ...prev, questions: true }));
          setShowScorecardAvailable(prev => ({ ...prev, questions: true }));
        }
        if (submissionTrack.scenariosSubmitted) {
          setSubmittedTabs(prev => ({ ...prev, scenarios: true }));
          setShowScorecardAvailable(prev => ({ ...prev, scenarios: true }));
        }
        if (submissionTrack.challengesSubmitted) {
          setSubmittedTabs(prev => ({ ...prev, challenges: true }));
          setShowScorecardAvailable(prev => ({ ...prev, challenges: true }));
        }

        const qHints = (data.content?.questions || data.questions || []).map(q => q?.hint).filter(Boolean);
        const sHints = (data.content?.scenarios || data.scenarios || []).map(s => s?.hint).filter(Boolean);
        const cHints = (data.content?.challenges || data.challenges || []).map(c => (Array.isArray(c?.hints) ? c.hints[0] : c?.hint)).filter(Boolean);
        const defaultHints = [
          'Eliminate obviously incorrect options to narrow your choices.',
          'Read each option carefully and compare with the question stem.',
          'Use elimination and keywords to deduce the most likely answer.'
        ];
        const combined = [...qHints, ...sHints, ...cHints, ...defaultHints].slice(0, 3);
        setMcqHintSources(combined);

        if ((!data.userProgress || !data.userProgress.answers || data.userProgress.answers.length === 0)) {
          try {
            const savedAnswers = localStorage.getItem(`mission_answers_${data._id}`);
            if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
          } catch (err) { }
        }
        if ((!data.userProgress || !data.userProgress.challengeSolutions || Object.keys(data.userProgress.challengeSolutions || {}).length === 0)) {
          try {
            const savedChallenges = localStorage.getItem(`mission_challenges_${data._id}`);
            if (savedChallenges) setChallengeSolutions(JSON.parse(savedChallenges));
          } catch (err) { }
        }

        // Reset dirty state when mission loaded
        setDirty(false);
      } catch (err) {
        console.error("Failed to load mission:", err);
        alert("Error loading mission. Please try again.");
        nav("/missions");
      } finally {
        setLoadingMission(false);
      }
    })();
  }, [id, nav]);

  // Autosave draft progress periodically when dirty
  useEffect(() => {
    if (!mission || !mission._id) return;
    const interval = setInterval(async () => {
      if (!dirty) return;
      if (autosaveInProgress.current) return;
      if (submitting) return;
      if (mission.userProgress && mission.userProgress.status === 'completed') {
        setDirty(false);
        return;
      }

      autosaveInProgress.current = true;
      try {
        const payload = { missionId: mission._id, answers: compileAnswerArray(), challengeSolutions };
        const { ok, res, error } = await autosaveMission(payload);
        if (ok && res) {
          // Show autosave indicator briefly
          try { if (saveTimer.current) clearTimeout(saveTimer.current); } catch (e) { }
          setSaveStatus('autosaved');
          saveTimer.current = setTimeout(() => setSaveStatus(null), 3000);
          setDirty(false);
          // Update mission state if server returned fresh data
          if (res.mission) setMission(res.mission);
          // Notify listeners so admin/dashboard can update
          window.dispatchEvent(new Event("missionsRefresh"));
        } else {
          console.warn('Autosave response error:', error || res);
        }
      } catch (err) {
        console.error('Autosave failed:', err);
      } finally {
        autosaveInProgress.current = false;
      }
    }, 10000); // every 10s

    // Attempt to autosave on unload (best-effort)
    const handleBeforeUnload = (e) => {
      if (!dirty || !mission || !mission._id) return;
      try {
        const payload = { missionId: mission._id, answers: compileAnswerArray(), challengeSolutions };
        const token = localStorage.getItem('token');
        navigator.sendBeacon?.(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/missions/autosave`, JSON.stringify(payload));
        // If sendBeacon unavailable, try fetch keepalive
        if (!navigator.sendBeacon) {
          fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/missions/autosave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(payload),
            keepalive: true
          }).catch(() => { });
        }
      } catch (err) {
        // best-effort only
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dirty, mission, challengeSolutions, submitting]);

  useEffect(() => {
    try {
      localStorage.setItem(`mission_answers_${id}`, JSON.stringify(answers));
    } catch (err) { }
  }, [answers, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`mission_challenges_${id}`, JSON.stringify(challengeSolutions));
    } catch (err) { }
  }, [challengeSolutions, id]);

  if (loadingMission) {
    return (
      <>
        <Navbar />
        <div className="container py-4" style={{ color: "var(--primary)", textAlign: "center", paddingTop: "5rem" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", marginRight: "1rem" }}></i>
          Loading mission...
        </div>
      </>
    );
  }

  if (!mission || !mission._id) {
    return (
      <>
        <Navbar />
        <div className="container py-4" style={{ color: "var(--secondary)", textAlign: "center", paddingTop: "5rem" }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: "2rem", marginRight: "1rem" }}></i>
          <p>Mission not found or error loading mission.</p>
          <button
            onClick={() => nav("/missions")}
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              border: "none",
              padding: "0.8rem 2rem",
              borderRadius: "10px",
              color: "#000",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "1rem"
            }}
          >
            Back to Missions
          </button>
        </div>
      </>
    );
  }

  const content = mission.content || {};
  const questions = (content.questions || mission.questions || []).filter(Boolean);
  const scenarios = (content.scenarios || content.scenario || []).filter(Boolean);
  const challenges = (content.challenges || content.challenge || []).filter(Boolean);

  const handleSelect = (qIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
    setDirty(true);
  };

  const _extractResult = (res) => {
    if (!res) return null;
    return {
      gained: res.gained ?? res.earnedPoints ?? res.score ?? res.points ?? 0,
      totalScore: res.totalScore ?? res.newScore ?? res.scoreTotal ?? null,
      level: res.level ?? res.newLevel ?? null,
      message: res.message ?? null,
    };
  };

  const handleSubmit = async () => {
    if (!mission || !mission._id) {
      alert("Mission data is invalid. Please go back and try again.");
      return;
    }

    if (questions.length > 0 && activeTab === "questions") {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount === 0) {
        alert("Please answer at least one question before submitting.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        missionId: mission._id,
        answers: buildAnswersForSection('questions'),
      };

      const { ok, res, mission: refreshedMission, error } = await submitMissionAndRefresh(payload, { login });
      if (!ok) {
        alert(error || "Invalid response from server. Please try again.");
        return;
      }

      const parsed = _extractResult(res);
      setResult(parsed || { gained: 0, totalScore: null });
      // Backend returns full answer details based on merged progress
      // Merge new question details with existing scenario/challenge details
      setAnswerDetails(prev => {
        const newDetails = res.answerDetails || [];
        // Keep previous details that are NOT questions (scenarios, challenges)
        const existingNonQuestions = (prev || []).filter(d => d.type !== 'question');
        // Get new question details
        const newQuestions = newDetails.filter(d => d.type === 'question');
        // Return merged: new questions + existing non-questions
        return [...newQuestions, ...existingNonQuestions];
      });

      // If we received refreshed mission data, update local mission state so userProgress is reflected
      if (refreshedMission && refreshedMission._id) {
        setMission(refreshedMission);
      }

      setSubmittedTabs((prev) => ({ ...prev, questions: true }));

      // Show temporary saved indicator
      try { if (saveTimer.current) clearTimeout(saveTimer.current); } catch (e) { }
      setSaveStatus('saved');
      saveTimer.current = setTimeout(() => setSaveStatus(null), 3000);

      // Determine next tab (set and navigate immediately for a smooth flow)
      if (scenarios.length > 0) {
        setNextTabAfterSubmit("scenarios");
      } else if (challenges.length > 0) {
        setNextTabAfterSubmit("challenges");
      } else {
        setNextTabAfterSubmit(null);
      }

      setShowScorecardAvailable(prev => ({ ...prev, [activeTab]: true }));
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to submit mission. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit only scenario/email answers (keeps questions untouched) and move to Challenges tab
  const handleSubmitScenarios = async () => {
    if (!mission || !mission._id) {
      alert("Mission data is invalid. Please go back and try again.");
      return;
    }

    // Require at least one scenario option selection before submitting
    const anyScenarioSelected = (scenarios || []).some((_, i) => answers[`sc-${i}`] !== undefined && answers[`sc-${i}`] !== null);
    if (!anyScenarioSelected) {
      alert('Please select at least one option in the scenarios before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { missionId: mission._id, answers: buildAnswersForSection('scenarios') };
      const { ok, res, mission: refreshedMission, error } = await submitMissionAndRefresh(payload, { login });
      if (!ok) {
        alert(error || "Invalid response from server. Please try again.");
        return;
      }

      const parsed = _extractResult(res);
      setResult(parsed || { gained: 0, totalScore: null });
      // Backend returns full answer details
      // Merge new scenario details with existing question/challenge details
      setAnswerDetails(prev => {
        const newDetails = res.answerDetails || [];
        // Keep previous details that are NOT scenarios
        const existingNonScenarios = (prev || []).filter(d => d.type !== 'scenario');
        // Get new scenario details
        const newScenarios = newDetails.filter(d => d.type === 'scenario');
        // Return merged: existing non-scenarios + new scenarios
        return [...existingNonScenarios, ...newScenarios];
      });

      if (refreshedMission && refreshedMission._id) {
        setMission(refreshedMission);
      }

      setSubmittedTabs((prev) => ({ ...prev, scenarios: true }));

      // Show temporary saved indicator
      try { if (saveTimer.current) clearTimeout(saveTimer.current); } catch (e) { }
      setSaveStatus('saved');
      saveTimer.current = setTimeout(() => setSaveStatus(null), 3000);

      // Determine next tab
      if (challenges.length > 0) {
        setNextTabAfterSubmit("challenges");
      } else {
        setNextTabAfterSubmit(null);
      }

      setShowScorecardAvailable(prev => ({ ...prev, scenarios: true }));
    } catch (err) {
      console.error("Submit scenarios failed:", err);
      alert("Failed to submit scenarios. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteGeneric = async () => {
    setSubmitting(true);
    try {
      if (!mission || !mission._id) {
        alert("Mission data is invalid. Please go back and try again.");
        return;
      }

      // For challenge completion submit only challenge solutions; otherwise submit the full answers array
      let payload;
      if (activeTab === "challenges") {
        payload = { missionId: mission._id };
        if (challengeSolutions) payload.challengeSolutions = challengeSolutions;
        if (challengeCode) payload.challengeCode = challengeCode;
      } else {
        payload = { missionId: mission._id, answers: compileAnswerArray() };
      }

      const { ok, res, mission: refreshedMission, error } = await submitMissionAndRefresh(payload, { login });
      if (!ok) {
        alert(error || "Invalid response from server. Please try again.");
        return;
      }

      const parsed = _extractResult(res);
      setResult(parsed || { gained: 0, totalScore: null });
      // Merge new challenge details with existing question/scenario details
      setAnswerDetails(prev => {
        const newDetails = res.answerDetails || [];
        // Keep previous details that are NOT challenges
        const existingNonChallenges = (prev || []).filter(d => d.type !== 'challenge');
        // Get new challenge details
        const newChallenges = newDetails.filter(d => d.type === 'challenge');
        // Return merged: existing non-challenges + new challenges
        return [...existingNonChallenges, ...newChallenges];
      });

      if (refreshedMission && refreshedMission._id) {
        setMission(refreshedMission);
      }

      setSubmittedTabs((prev) => ({ ...prev, [activeTab]: true }));

      // Show temporary saved indicator
      try { if (saveTimer.current) clearTimeout(saveTimer.current); } catch (e) { }
      setSaveStatus('saved');
      saveTimer.current = setTimeout(() => setSaveStatus(null), 3000);

      // Determine next tab based on current active tab
      if (activeTab === "scenarios" && challenges.length > 0) {
        setNextTabAfterSubmit("challenges");
      } else {
        setNextTabAfterSubmit(null);
      }

      setShowScorecardAvailable(prev => ({ ...prev, [activeTab]: true }));

      // If we just completed the challenges tab, evaluate each challenge (deterministic checks first, then AI when available)
      if (activeTab === "challenges") {
        // Show a brief evaluating indicator
        try { setSaveStatus('evaluating'); } catch (e) { }

        // Evaluate all challenges concurrently and populate `checkResults` so the UI can show official answers/hints
        const evalTasks = (challenges || []).map((c, idx) => (async () => {
          const submittedObj = challengeSolutions ? (challengeSolutions[idx] || challengeSolutions[String(idx)]) : null;
          const submission = submittedObj ? (typeof submittedObj === 'string' ? submittedObj : (submittedObj.code || '')) : '';
          try {
            setChecking(prev => ({ ...prev, [idx]: true }));
            const payload = { missionId: mission._id, challengeIndex: idx, submission };
            // Only request AI generation if there is no deterministic expected answer or test cases and no existing officialAnswer
            const hasDeterministic = (c.expected && String(c.expected).trim().length > 0) || (Array.isArray(c.testCases) && c.testCases.length > 0) || !!c.officialAnswer;
            const shouldForce = !hasDeterministic;
            try {
              const r = await apiEvaluateChallenge(payload, { force: shouldForce });
              if (r && r.result) {
                setCheckResults(prev => ({ ...prev, [idx]: r.result }));
                // If the evaluation shows the submission is incorrect, auto-expand hint/official answer for the user
                const isCorrect = r.result.isCorrect || (r.result.scoreFraction !== undefined && r.result.scoreFraction >= 1);
                if (!isCorrect) setExpandedHints(prev => ({ ...prev, [idx]: true }));
              } else {
                setCheckResults(prev => ({ ...prev, [idx]: { explanation: 'Evaluation could not be completed' } }));
              }
            } catch (evalErr) {
              console.error('Error evaluating challenge', idx, evalErr);
              setCheckResults(prev => ({ ...prev, [idx]: { explanation: 'Error during evaluation' } }));
            }
          } catch (err) {
            console.error('Evaluate challenge failed for index', idx, err);
          } finally {
            setChecking(prev => ({ ...prev, [idx]: false }));
          }
        })());

        try {
          await Promise.all(evalTasks);
        } catch (err) {
          console.warn('One or more challenge evaluations failed', err);
        }

        // Auto-open the scorecard view for challenges
        setScorecardFilter('challenges');
        setShowScorecard(true);
        setScorecardIndex(0);

        // Clear evaluating indicator
        try { setSaveStatus(null); } catch (e) { }
        
        // Keep user on the challenges tab so they see their saved solutions
        // Do not change activeTab - user stays on challenges view with their input visible
      }
    } catch (err) {
      console.error("Complete failed:", err);
      alert("Failed to complete mission. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAnswerDetail = (qIndex) => {
    if (!answerDetails || !Array.isArray(answerDetails) || !answerDetails[qIndex]) return null;
    return answerDetails[qIndex];
  };

  const handleCheckSolution = async (index) => {
    try {
      if (!mission || !mission._id) return;

      const submittedObj = challengeSolutions ? (challengeSolutions[index] || challengeSolutions[String(index)]) : null;
      const submission = submittedObj ? (typeof submittedObj === 'string' ? submittedObj : (submittedObj.code || '')) : '';

      if (!submission || String(submission).trim() === '') {
        alert('Please enter your solution before checking.');
        return;
      }

      setChecking(prev => ({ ...prev, [index]: true }));

      const payload = { missionId: mission._id, challengeIndex: index, submission };
      // Use force: true to automatically trigger AI validation when no deterministic checks exist
      try {
        const res = await apiEvaluateChallenge(payload, { force: true });
        if (res && res.result) {
          setCheckResults(prev => ({ ...prev, [index]: res.result }));
          // Optionally expand hint if AI recommends
          if (res.result.aiRecommendHint && res.result.aiHint) {
            setExpandedHints(prev => ({ ...prev, [index]: true }));
          }
        } else {
          setCheckResults(prev => ({ ...prev, [index]: { explanation: 'No evaluation result available. Please try again.' } }));
        }
      } catch (apiErr) {
        console.error('API evaluation error for challenge', index, apiErr);
        setCheckResults(prev => ({ ...prev, [index]: { explanation: 'Failed to evaluate: ' + (apiErr?.message || 'Unknown error') } }));
      }
    } catch (err) {
      console.error('Check solution failed:', err);
      setCheckResults(prev => ({ ...prev, [index]: { explanation: 'Failed to evaluate solution' } }));
    } finally {
      setChecking(prev => ({ ...prev, [index]: false }));
    }
  };

  // Explicitly request AI review (tries to generate/compare against an AI canonical answer)
  const requestAIReview = async (index) => {
    try {
      if (!mission || !mission._id) return;
      setChecking(prev => ({ ...prev, [index]: true }));

      const submittedObj = challengeSolutions ? (challengeSolutions[index] || challengeSolutions[String(index)]) : null;
      const submission = submittedObj ? (typeof submittedObj === 'string' ? submittedObj : (submittedObj.code || '')) : '';
      if (!submission || String(submission).trim() === '') {
        alert('Please enter your solution before requesting an AI review.');
        return;
      }

      // Explicit user-requested AI review
      const payload = { missionId: mission._id, challengeIndex: index, submission };
      const res = await apiEvaluateChallenge(payload, { force: true });
      if (res && res.result) {
        // If AI wasn't available, the result will indicate aiUsed=false
        if (!res.result.aiUsed) {
          alert('AI evaluation is not available on the server. Enable AI (ENABLE_AI_EVAL=true) and set a valid OPENAI_API_KEY to use AI reviews.');
        }
        setCheckResults(prev => ({ ...prev, [index]: res.result }));
        if (res.result.aiRecommendHint && res.result.aiHint) setExpandedHints(prev => ({ ...prev, [index]: true }));
      } else {
        alert('No evaluation result available.');
      }
    } catch (err) {
      console.error('AI review request failed:', err);
      if (err && err.response && err.response.status === 503) {
        alert(err.response.data?.message || 'AI evaluation not available on server.');
      } else {
        alert('AI review failed. Check server logs for details.');
      }
    } finally {
      setChecking(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleUnlockMcqHint = () => {
    if (!mcqTaskInput || mcqTaskInput.trim().toLowerCase() !== 'unlock') {
      alert("To unlock a hint, type 'unlock' and click Complete Task.");
      return;
    }
    if (mcqHintsRemaining <= 0) {
      alert('No hints remaining.');
      return;
    }
    const nextIdx = mcqUnlockedHints.length;
    const hintText = (mcqHintSources && mcqHintSources[nextIdx]) || 'Try re-reading the question; look for keywords.';
    setMcqUnlockedHints(prev => ([...prev, hintText]));
    setMcqHintsRemaining(prev => prev - 1);
    setMcqTaskInput('');
    setShowMcqHintModal(false);
    try { alert('Hint unlocked. Check the hints section near the question for guidance.'); } catch (err) { }
  };

  const compileAnswerArray = () => {
    const arr = [];
    for (let i = 0; i < questions.length; i += 1) {
      arr.push(answers[i] !== undefined ? answers[i] : null);
    }
    for (let i = 0; i < scenarios.length; i += 1) {
      arr.push(answers[`sc-${i}`] !== undefined ? answers[`sc-${i}`] : null);
    }
    return arr;
  };

  // Build answers aligned to the full mission answers array but only populate a given section.
  const buildAnswersForSection = (section) => {
    if (section === 'questions') {
      const arr = [];
      for (let i = 0; i < questions.length; i += 1) arr.push(answers[i] !== undefined ? answers[i] : null);
      for (let i = 0; i < scenarios.length; i += 1) arr.push(null);
      return arr;
    }

    if (section === 'scenarios') {
      const arr = [];
      for (let i = 0; i < questions.length; i += 1) arr.push(null);
      for (let i = 0; i < scenarios.length; i += 1) arr.push(answers[`sc-${i}`] !== undefined ? answers[`sc-${i}`] : null);
      return arr;
    }

    return compileAnswerArray();
  };

  const prevScore = () => setScorecardIndex((s) => Math.max(0, (s || 0) - 1));
  const nextScore = () => {
    const filteredCount = (answerDetails || []).filter(d => scorecardFilter === 'all' ? true : d.type === scorecardFilter).length;
    setScorecardIndex((s) => Math.min(Math.max(0, filteredCount - 1), (s || 0) + 1));
  };

  const closeScorecard = async () => {
    try {
      const updatedUser = await apiGetUserProfile();
      if (updatedUser && updatedUser._id) {
        const token = localStorage.getItem("token");
        login(updatedUser, token);
      }
    } catch (err) {
      console.error("Failed to refresh user data:", err);
    }

    const next = nextTabAfterSubmit;
    setNextTabAfterSubmit(null);

    // If there's a next tab and it hasn't been submitted yet, navigate to it
    if (next && next !== activeTab && !submittedTabs[next]) {
      setShowScorecard(false);
      setActiveTab(next);
      setScorecardIndex(0);
      setScorecardFilter('all');
    } else {
      // Only close and leave if ALL sections that exist have been submitted
      const allSectionsComplete =
        submittedTabs.questions &&
        (scenarios.length === 0 || submittedTabs.scenarios) &&
        (challenges.length === 0 || submittedTabs.challenges);

      if (!allSectionsComplete) {
        // Sections remain; don't close yet
        alert('Please complete all sections before leaving.');
        return;
      }

      // All sections done, close and go back to missions
      setShowScorecard(false);
      try { localStorage.setItem(`mission_completed_${mission._id}`, String(Date.now())); } catch (err) { }
      setTimeout(() => nav("/missions"), 300);
    }
  };

  const handleScorecardFinalSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = { missionId: mission._id, answers: compileAnswerArray() };
      if (activeTab === 'challenges') payload.challengeSolutions = challengeSolutions;

      const { ok, res, mission: refreshedMission, error } = await submitMissionAndRefresh(payload, { login });
      if (!ok || !res || typeof res !== 'object') {
        alert(error || 'Failed to submit final mission state.');
        return;
      }

      const parsed = _extractResult(res);
      setResult(parsed || { gained: 0, totalScore: null });
      setAnswerDetails(res.answerDetails || []);

      if (refreshedMission && refreshedMission._id) {
        setMission(refreshedMission);
      }

      // Show temporary saved indicator
      try { if (saveTimer.current) clearTimeout(saveTimer.current); } catch (e) { }
      setSaveStatus('saved');
      saveTimer.current = setTimeout(() => setSaveStatus(null), 3000);

      setSubmittedTabs((prev) => ({ ...prev, questions: true, scenarios: true, challenges: true }));
      setShowScorecardAvailable({ questions: true, scenarios: true, challenges: true });

      try {
        const list = await apiGetMissions();
        const idx = (list || []).findIndex(m => m._id === mission._id);

        // Clear localStorage markers
        try {
          localStorage.removeItem(`mission_answers_${mission._id}`);
          localStorage.removeItem(`mission_challenges_${mission._id}`);
          localStorage.removeItem(`mission_started_${mission._id}`);
          localStorage.setItem(`mission_completed_${mission._id}`, String(Date.now()));
        } catch (err) { }

        // Dispatch refresh event for Missions page
        window.dispatchEvent(new Event("missionsRefresh"));

        // Wait a bit for backend to sync, then navigate
        setShowScorecard(false);

        if (idx >= 0 && idx < (list || []).length - 1) {
          const nextMission = list[idx + 1];
          // Small delay to ensure state updates
          setTimeout(() => {
            nav(`/mission/${nextMission._id}`);
          }, 500);
        } else {
          // No next mission — go back to list
          setTimeout(() => {
            nav('/missions');
          }, 500);
        }
      } catch (err) {
        console.error('Failed to fetch missions for next navigation', err);
        setShowScorecard(false);
        setTimeout(() => {
          nav('/missions');
        }, 500);
      }
    } catch (err) {
      console.error('Final submit failed: ', err);
      alert('Final submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <style>{`
          /* Theme variables moved to src/styles/theme.css */

          .mission-header {
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1));
            border: 2px solid rgba(0, 255, 136, 0.3);
            border-radius: 20px;
            padding: 2rem;
            margin-bottom: 2rem;
            margin-top: 80px;
          }

          .mission-title {
            color: var(--primary);
            margin-bottom: 0;
            font-size: 2rem;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
          }

          .mission-meta {
            color: rgba(255,255,255,0.7);
            font-size: 0.95rem;
            margin-top: 0.5rem;
          }

          .mission-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            border-bottom: 2px solid rgba(0, 255, 136, 0.2);
            flex-wrap: wrap;
          }

          .tab-btn {
            background: transparent;
            border: none;
            padding: 1rem 1.5rem;
            color: rgba(255,255,255,0.6);
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s;
            position: relative;
          }

          .tab-btn:hover {
            color: var(--primary);
          }

          .tab-btn.active {
            color: var(--primary);
          }

          .tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--accent));
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
          }

          .tab-badge {
            display: inline-block;
            margin-left: 0.5rem;
            padding: 2px 8px;
            border-radius: 50%;
            background: rgba(0, 255, 136, 0.2);
            color: var(--primary);
            font-size: 0.85rem;
            font-weight: bold;
          }

          .content-section {
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .question-card {
            background: rgba(10, 14, 39, 0.9);
            border: 2px solid rgba(0, 255, 136, 0.15);
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: all 0.3s;
          }

          .question-card:hover {
            border-color: var(--primary);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
          }

          .question-text {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 1rem;
            text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
          }

          .option-label {
            color: rgba(255,255,255,0.85);
            margin-left: 0.5rem;
            font-weight: 500;
          }

          .form-check-input {
            border-color: rgba(0, 255, 136, 0.3);
          }

          .form-check-input:checked {
            background-color: var(--primary);
            border-color: var(--primary);
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
          }

          .scenario-email {
            background: rgba(0, 0, 0, 0.5);
            border-left: 4px solid var(--accent);
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 1.5rem;
            font-family: monospace;
          }

          .email-header {
            border-bottom: 1px solid rgba(0, 255, 136, 0.3);
            padding-bottom: 1rem;
            margin-bottom: 1rem;
          }

          .email-from {
            color: var(--accent);
            font-weight: bold;
            text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
          }

          .email-subject {
            color: var(--secondary);
            margin-top: 0.5rem;
            font-weight: 600;
          }

          .email-content {
            color: rgba(255,255,255,0.8);
            margin-top: 1rem;
            white-space: pre-wrap;
          }

          .challenge-card {
            background: rgba(10, 14, 39, 0.9);
            border: 2px solid rgba(255, 0, 128, 0.15);
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: all 0.3s;
          }

          .challenge-card:hover {
            border-color: var(--secondary);
            box-shadow: 0 0 20px rgba(255, 0, 128, 0.15);
          }

          .challenge-title {
            color: var(--secondary);
            font-weight: bold;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
            text-shadow: 0 0 5px rgba(255, 0, 128, 0.3);
          }

          .code-block {
            background: #000;
            border: 1px solid rgba(0, 255, 136, 0.3);
            padding: 1rem;
            border-radius: 10px;
            overflow-x: auto;
            margin: 1rem 0;
            font-family: 'Courier New', monospace;
            color: var(--primary);
            text-shadow: 0 0 5px rgba(0, 255, 136, 0.2);
          }

          .hints-box {
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(0, 255, 136, 0.05));
            border: 1px solid rgba(0, 212, 255, 0.4);
            padding: 1rem;
            border-radius: 10px;
            margin-top: 1rem;
            box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.05);
          }

          .hints-title {
            color: var(--accent);
            font-weight: bold;
            margin-bottom: 0.5rem;
            text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
          }

          .hints-content {
            color: rgba(255,255,255,0.8);
            line-height: 1.6;
            font-size: 0.95rem;
          }

          .submit-btn {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: bold;
            color: #000;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 1.5rem;
            width: 100%;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
            text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          }

          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 25px rgba(0, 255, 136, 0.6);
          }

          .submit-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }

          .scorecard-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
          }

          .scorecard-modal {
            background: linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(0, 20, 40, 0.95));
            border: 2px solid rgba(0, 255, 136, 0.5);
            border-radius: 25px;
            padding: 3rem;
            max-width: 700px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 0 40px rgba(0, 255, 136, 0.3), inset 0 0 30px rgba(0, 255, 136, 0.05);
            animation: slideUp 0.4s ease;
            text-align: center;
          }

          .scorecard-title {
            color: var(--primary);
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
          }

          .scorecard-trophy {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 0.6s ease infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }

          .scorecard-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin: 2rem 0;
          }

          .scorecard-stat {
            padding: 1.5rem;
            background: rgba(0, 255, 136, 0.08);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 15px;
            transition: all 0.3s;
          }

          .scorecard-stat:hover {
            background: rgba(0, 255, 136, 0.15);
            border-color: var(--primary);
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
          }

          .scorecard-value {
            color: var(--primary);
            font-size: 2rem;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
          }

          .scorecard-label {
            color: rgba(255,255,255,0.7);
            font-size: 0.9rem;
            margin-top: 0.5rem;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 1px;
          }

          .scorecard-close-btn {
            background: linear-gradient(135deg, var(--primary), var(--accent));
            border: none;
            padding: 12px 40px;
            border-radius: 25px;
            font-weight: bold;
            color: #000;
            cursor: pointer;
            margin-top: 2rem;
            transition: all 0.3s;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
            font-size: 1rem;
          }

          .scorecard-close-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 25px rgba(0, 255, 136, 0.6);
          }

          .scorecard-close-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .answer-details-container {
            max-height: 400px;
            overflow-y: auto;
            margin: 1.5rem 0;
            padding: 0 1rem;
          }

          .answer-detail-item {
            background: rgba(10, 14, 39, 0.6);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 0.8rem;
            text-align: left;
          }

          .answer-detail-item.correct {
            border-color: rgba(0, 255, 136, 0.5);
            background: rgba(0, 255, 136, 0.08);
          }

          .answer-detail-item.incorrect {
            border-color: rgba(255, 0, 128, 0.5);
            background: rgba(255, 0, 128, 0.08);
          }

          .answer-detail-question {
            color: var(--primary);
            font-weight: 600;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
          }

          .answer-detail-row {
            display: flex;
            gap: 1rem;
            margin: 0.5rem 0;
            font-size: 0.85rem;
          }

          .answer-detail-label {
            color: rgba(255,255,255,0.6);
            min-width: 80px;
          }

          .answer-detail-value {
            color: rgba(255,255,255,0.85);
            flex: 1;
          }

          .answer-correct {
            color: #00ff88;
            font-weight: 600;
          }

          .answer-incorrect {
            color: #ff0080;
            font-weight: 600;
          }

          .concept-explanation {
            background: rgba(0, 212, 255, 0.08);
            border-left: 3px solid var(--accent);
            padding: 0.8rem;
            border-radius: 5px;
            margin-top: 0.8rem;
            font-size: 0.85rem;
            color: rgba(255,255,255,0.8);
            line-height: 1.5;
          }

          .empty-state {
            text-align: center;
            padding: 3rem;
            color: rgba(255,255,255,0.7);
          }
        `}
        </style>

        <div className="mission-header">
          <button
            onClick={() => nav("/missions")}
            style={{
              background: "transparent",
              border: "1px solid rgba(0, 255, 136, 0.4)",
              color: "var(--primary)",
              padding: "0.5rem 1rem",
              borderRadius: "10px",
              cursor: "pointer",
              marginBottom: "1rem",
              transition: "all 0.3s",
              fontSize: "0.9rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(0, 255, 136, 0.1)";
              e.target.style.boxShadow = "0 0 10px rgba(0, 255, 136, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.boxShadow = "none";
            }}
          >
            <i className="fas fa-arrow-left"></i> Back to Missions
          </button>
          <h2 className="mission-title">
            <i className="fas fa-crosshairs"></i> {mission.title}
          </h2>
          <div className="mission-meta">
            <span><i className="fas fa-tag"></i> {mission.type}  </span>
            <span><i className="fas fa-chart-line"></i> {mission.difficulty?.toUpperCase()}</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", marginTop: "1rem", marginBottom: 0 }}>
            {mission.description || content.description || ""}
          </p>
        </div>

        <div className="mission-tabs">
          {questions.length > 0 && (
            <button
              className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
              onClick={() => setActiveTab("questions")}
            >
              <i className="fas fa-question-circle"></i> MCQ Questions
              <span className="tab-badge">{questions.length}</span>
            </button>
          )}

          {scenarios.length > 0 && (
            <button
              className={`tab-btn ${activeTab === "scenarios" ? "active" : ""}`}
              onClick={() => setActiveTab("scenarios")}
            >
              <i className="fas fa-envelope"></i> Email Scenarios
              <span className="tab-badge">{scenarios.length}</span>
            </button>
          )}

          {challenges.length > 0 && (
            <button
              className={`tab-btn ${activeTab === "challenges" ? "active" : ""}`}
              onClick={() => setActiveTab("challenges")}
            >
              <i className="fas fa-flag-checkered"></i> Challenges
              <span className="tab-badge">{challenges.length}</span>
            </button>
          )}
        </div>

        {/* MCQ QUESTIONS TAB */}
        {activeTab === "questions" && questions.length > 0 && (
          <div className="content-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ color: "var(--primary)", margin: 0 }}>
                <i className="fas fa-list-check"></i> Answer the Multiple Choice Questions
              </h4>
            </div>
            {(questions || []).filter(Boolean).map((q, index) => {
              const selectedOption = answers[index];
              const answerDetail = getAnswerDetail(index);
              const qQuestion = q?.question || '[Question missing]';
              const qOptions = q?.options || [];
              const qAnswer = q?.answer;
              let correctIndex = typeof qAnswer === 'number' ? qAnswer : null;
              if (answerDetail && answerDetail.correctAnswer) {
                const found = qOptions.findIndex(o => String(o).trim() === String(answerDetail.correctAnswer).trim());
                if (found >= 0) correctIndex = found;
              }
              const isSubmitted = submittedTabs.questions || (answerDetails && answerDetails.length > 0);
              const isAnswerCorrect = selectedOption !== undefined && selectedOption === correctIndex;
              const hasAnswered = selectedOption !== undefined;

              return (
                <div key={index} className="question-card">
                  <div className="question-text">
                    {index + 1}. {qQuestion}
                  </div>

                  {q?.image && (
                    <div style={{ marginBottom: "1rem" }}>
                      <img src={q.image} alt={`q-${index}`} style={{ maxWidth: "100%", borderRadius: "10px" }} />
                    </div>
                  )}

                  <div>
                    {qOptions.map((opt, j) => {
                      const isSelected = answers[index] === j;
                      const isCorrectOption = j === qAnswer;
                      let optionStyle = {};

                      if (isSubmitted) {
                        if (isCorrectOption) {
                          optionStyle = {
                            background: "rgba(0, 255, 136, 0.15)",
                            borderLeft: "4px solid #00ff88",
                            paddingLeft: "calc(0.5rem - 4px)",
                          };
                        } else if (isSelected && !isAnswerCorrect) {
                          optionStyle = {
                            background: "rgba(255, 0, 128, 0.15)",
                            borderLeft: "4px solid #ff0080",
                            paddingLeft: "calc(0.5rem - 4px)",
                          };
                        }
                      }

                      return (
                        <div className="form-check" key={j} style={{ marginBottom: "0.75rem", ...optionStyle, padding: "0.75rem 0.5rem", borderRadius: "8px", transition: "all 0.3s" }}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`q${index}`}
                            id={`q${index}opt${j}`}
                            checked={answers[index] === j}
                            onChange={() => handleSelect(index, j)}
                            disabled={isSubmitted}
                            style={{ cursor: "pointer" }}
                          />
                          <label className="form-check-label option-label" htmlFor={`q${index}opt${j}`} style={{ cursor: "pointer" }}>
                            {String.fromCharCode(65 + j)}) {opt}
                            {isSubmitted && isCorrectOption && <span style={{ color: "#00ff88", fontWeight: "bold", marginLeft: "0.5rem" }}>✓ Correct</span>}
                            {isSubmitted && isSelected && !isAnswerCorrect && <span style={{ color: "#ff0080", fontWeight: "bold", marginLeft: "0.5rem" }}>✗ Wrong</span>}
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {((isSubmitted || mcqUnlockedHints.length > 0) && !isAnswerCorrect && q.hint) && (
                    <div className="hints-box" style={{ background: "rgba(255, 0, 128, 0.1)", borderLeft: "4px solid #ff0080", marginTop: "1rem" }}>
                      <div className="hints-title" style={{ color: "#ff0080" }}><i className="fas fa-lightbulb"></i> Hint for Correct Answer</div>
                      <div className="hints-content">{q.hint}</div>
                    </div>
                  )}

                  {((isSubmitted || mcqUnlockedHints.length > 0) && isAnswerCorrect && (q.explanation || answerDetail?.explanation)) && (
                    <div className="hints-box" style={{ background: "rgba(0, 255, 136, 0.1)", borderLeft: "4px solid #00ff88", marginTop: "1rem" }}>
                      <div className="hints-title" style={{ color: "#00ff88" }}><i className="fas fa-check-circle"></i> Explanation</div>
                      <div className="hints-content">{q.explanation || answerDetail?.explanation}</div>
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="submit-btn" onClick={handleSubmit} disabled={submitting || submittedTabs.questions}>
                {submitting ? (
                  <>
                    <span style={{ marginRight: "0.5rem" }}>⏳</span> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Submit Answers
                  </>
                )}
              </button>
              {saveStatus && (
                <div style={{ color: '#00ff88', fontWeight: 700, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,255,136,0.06)' }}>
                  {saveStatus === 'autosaved' ? '✓ Auto-saved' : '✓ Progress saved'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCENARIOS TAB */}
        {activeTab === "scenarios" && scenarios.length > 0 && (
          <div className="content-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ color: "var(--accent)", margin: 0 }}>
                <i className="fas fa-envelope"></i> Analyze Email Scenarios
              </h4>
            </div>
            {scenarios.map((s, i) => {
              const scSubmitted = submittedTabs.scenarios || (answerDetails && Array.isArray(answerDetails) && answerDetails.some(d => d.type === 'scenario'));
              const scDetail = answerDetails && Array.isArray(answerDetails) ? answerDetails.find(d => d.type === 'scenario' && d.index === i) : null;

              let scCorrectIndex = null;
              if (typeof s.answer === 'number') {
                scCorrectIndex = s.answer;
              } else if (s.answer) {
                const idx = (s.options || []).findIndex(o => String(o).trim() === String(s.answer).trim());
                if (idx >= 0) scCorrectIndex = idx;
              } else if (scDetail && scDetail.correctAnswer) {
                const idx = (s.options || []).findIndex(o => String(o).trim() === String(scDetail.correctAnswer).trim());
                if (idx >= 0) scCorrectIndex = idx;
              }

              return (
                <div key={i} className="question-card">
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                      Scenario {i + 1}: {s.title}
                    </div>
                  </div>

                  <div className="scenario-email">
                    <div className="email-header">
                      <div className="email-from">From: {s.sender}</div>
                      <div className="email-subject">Subject: {s.subject}</div>
                    </div>
                    <div className="email-content">{s.content}</div>
                  </div>

                  {Array.isArray(s.options) && (
                    <div>
                      <p style={{ color: "var(--primary)", fontWeight: "bold", marginBottom: "0.75rem" }}>
                        What should you do?
                      </p>
                      {(s.options || []).map((opt, j) => {
                        const scSelected = answers[`sc-${i}`];

                        const scIsSelected = scSelected === j;
                        const scIsCorrectOption = scCorrectIndex !== null && scCorrectIndex === j;
                        let scStyle = {};
                        if (scSubmitted) {
                          if (scIsCorrectOption) scStyle = { background: 'rgba(0, 255, 136, 0.15)', borderLeft: '4px solid #00ff88', paddingLeft: 'calc(0.5rem - 4px)' };
                          else if (scIsSelected && scCorrectIndex !== null && scSelected !== scCorrectIndex) scStyle = { background: 'rgba(255, 0, 128, 0.15)', borderLeft: '4px solid #ff0080', paddingLeft: 'calc(0.5rem - 4px)' };
                        }
                        return (
                          <div key={j}>
                            <div className="form-check" style={{ marginBottom: "0.75rem", ...scStyle }}>
                              <input
                                className="form-check-input"
                                type="radio"
                                name={`sc${i}`}
                                id={`sc${i}opt${j}`}
                                checked={scSelected === j}
                                onChange={() => { setAnswers((p) => ({ ...p, [`sc-${i}`]: j })); setDirty(true); }}
                                disabled={scSubmitted}
                                style={{ cursor: "pointer" }}
                              />
                              <label className="form-check-label option-label" htmlFor={`sc${i}opt${j}`}>
                                {String.fromCharCode(65 + j)}) {opt}
                                {scSubmitted && scIsCorrectOption && <span style={{ color: "#00ff88", fontWeight: "bold", marginLeft: "0.5rem" }}>✓ Correct</span>}
                                {scSubmitted && scIsSelected && scCorrectIndex !== null && scSelected !== scCorrectIndex && <span style={{ color: "#ff0080", fontWeight: "bold", marginLeft: "0.5rem" }}>✗ Wrong</span>}
                              </label>
                            </div>
                            {j === (s.options || []).length - 1 && scSubmitted && (scSelected === undefined || scSelected === null) && (
                              <div style={{ marginTop: "1rem", marginBottom: "0.75rem", padding: "0.75rem", background: "rgba(255, 0, 128, 0.1)", borderRadius: "8px", borderLeft: "4px solid #ff0080", color: "#ff0080", fontWeight: "bold" }}>
                                <i className="fas fa-exclamation-circle"></i> You did not answer this scenario - marked as wrong
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {scSubmitted && scDetail?.explanation && (
                    <div className="hints-box" style={{ background: "rgba(0, 255, 136, 0.1)", borderLeft: "4px solid #00ff88", marginTop: "1rem" }}>
                      <div className="hints-title" style={{ color: "#00ff88" }}><i className="fas fa-check-circle"></i> Explanation</div>
                      <div className="hints-content">{scDetail.explanation}</div>
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className="submit-btn"
                onClick={handleSubmitScenarios}
                disabled={submitting || submittedTabs.scenarios}
                title={submittedTabs.scenarios ? 'Scenarios already submitted' : 'Submit your scenario choices (unanswered will count as wrong)'}
              >
                {submitting ? (
                  <>
                    <span style={{ marginRight: "0.5rem" }}>⏳</span> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Submit Scenarios
                  </>
                )}
              </button>
              {saveStatus && (
                <div style={{ color: '#00ff88', fontWeight: 700, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,255,136,0.06)' }}>
                  {saveStatus === 'autosaved' ? '✓ Auto-saved' : '✓ Progress saved'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === "challenges" && challenges.length > 0 && (
          <div className="content-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ color: "var(--secondary)", margin: 0 }}>
                <i className="fas fa-flag-checkered"></i> Complete Security Challenges
              </h4>
            </div>
            {challenges.map((c, i) => (
              <div key={i} className="challenge-card">
                <div className="challenge-title">
                  Challenge {i + 1}: {c.title}
                </div>

                {c.description && (
                  <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "1rem" }}>
                    {c.description}
                  </p>
                )}

                {c.guide && (
                  <div className="hints-box" style={{ marginTop: '1rem', borderLeft: '4px solid rgba(0,212,255,0.4)' }}>
                    <div className="hints-title" style={{ color: 'var(--accent)' }}><i className="fas fa-route"></i> Guide</div>
                    <div className="hints-content">{c.guide}</div>
                  </div>
                )}

                {c.code && (
                  <>
                    <p style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                      {c.language ? `Code (${c.language}):` : "Code:"}
                    </p>
                    <div className="code-block">{c.code}</div>
                  </>
                )}

                {Array.isArray(c.hints) && c.hints.length > 0 && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <button
                      onClick={() => toggleHintExpansion(i)}
                      style={{
                        background: "linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(0, 212, 255, 0.2))",
                        border: "2px solid rgba(255, 0, 128, 0.4)",
                        color: "var(--secondary)",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "15px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        transition: "all 0.3s",
                        fontSize: "0.95rem",
                        width: "100%",
                        justifyContent: "space-between"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "linear-gradient(135deg, rgba(255, 0, 128, 0.3), rgba(0, 212, 255, 0.3))";
                        e.target.style.boxShadow = "0 0 15px rgba(255, 0, 128, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(0, 212, 255, 0.2))";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <i className="fas fa-lightbulb"></i> Get Hints ({c.hints.length})
                      </span>
                      <i className={`fas fa-chevron-${expandedHints[i] ? "up" : "down"}`}></i>
                    </button>

                    {expandedHints[i] && (
                      <div className="hints-box" style={{ marginTop: "1rem", animation: "fadeIn 0.3s ease" }}>
                        <div className="hints-title" style={{ marginBottom: "1rem", color: "var(--secondary)" }}>
                          <i className="fas fa-lightbulb"></i> Helpful Hints
                        </div>
                        <ul style={{
                          marginBottom: 0,
                          color: "rgba(255,255,255,0.9)",
                          paddingLeft: "1.5rem"
                        }}>
                          {c.hints.map((hint, hIdx) => (
                            <li key={hIdx} style={{
                              marginBottom: "0.75rem",
                              lineHeight: "1.5",
                              fontSize: "0.95rem"
                            }}>
                              <strong style={{ color: "var(--accent)" }}>Hint {hIdx + 1}:</strong> {hint}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: "1.5rem" }}>
                  <p style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                    <i className="fas fa-keyboard"></i> Your Solution:
                  </p>
                  <textarea
                    placeholder="Write your solution here... Paste code, commands, or your answer."
                    value={typeof (challengeSolutions[i]) === 'string' ? challengeSolutions[i] : ((challengeSolutions[i] && challengeSolutions[i].code) || '')}
                    onChange={(e) => { setChallengeSolutions(prev => ({ ...prev, [i]: { ...(typeof prev[i] === 'string' ? {} : (prev[i] || {})), code: e.target.value } })); setDirty(true); }}
                    style={{
                      width: "100%",
                      minHeight: "150px",
                      background: "#000",
                      border: "1px solid rgba(0, 255, 136, 0.3)",
                      borderRadius: "8px",
                      padding: "1rem",
                      color: "var(--primary)",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "0.9rem",
                      resize: "vertical",
                      boxSizing: "border-box"
                    }}
                  />
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    {((typeof challengeSolutions[i] === 'string' ? challengeSolutions[i] : (challengeSolutions[i] && (challengeSolutions[i].code || ''))) || '').length || 0} characters
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleCheckSolution(i)}
                      disabled={checking[i] || !((typeof challengeSolutions[i] === 'string' ? challengeSolutions[i] : (challengeSolutions[i]?.code || '')).trim())}
                      style={{
                        background: checking[i]
                          ? 'rgba(255,255,255,0.1)'
                          : 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 255, 136, 0.3))',
                        border: '2px solid rgba(0, 212, 255, 0.5)',
                        color: checking[i] ? 'rgba(255,255,255,0.5)' : '#fff',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        cursor: checking[i] ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                        fontSize: '0.9rem'
                      }}
                      onMouseEnter={(e) => {
                        if (!checking[i]) {
                          e.target.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.5), rgba(0, 255, 136, 0.5))';
                          e.target.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!checking[i]) {
                          e.target.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 255, 136, 0.3))';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {checking[i] ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Checking...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle"></i> Check Solution
                        </>
                      )}
                    </button>

                    {/* Validation Result Display */}
                    {checkResults[i] && !checking[i] && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        background: checkResults[i].isCorrect || checkResults[i].scoreFraction >= 1
                          ? 'rgba(0, 255, 136, 0.15)'
                          : checkResults[i].scoreFraction > 0
                            ? 'rgba(255, 193, 7, 0.15)'
                            : 'rgba(255, 0, 128, 0.15)',
                        border: checkResults[i].isCorrect || checkResults[i].scoreFraction >= 1
                          ? '1px solid rgba(0, 255, 136, 0.4)'
                          : checkResults[i].scoreFraction > 0
                            ? '1px solid rgba(255, 193, 7, 0.4)'
                            : '1px solid rgba(255, 0, 128, 0.4)',
                        color: checkResults[i].isCorrect || checkResults[i].scoreFraction >= 1
                          ? '#00ff88'
                          : checkResults[i].scoreFraction > 0
                            ? '#ffc107'
                            : '#ff0080',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        <i className={`fas ${checkResults[i].isCorrect || checkResults[i].scoreFraction >= 1
                          ? 'fa-check-circle'
                          : checkResults[i].scoreFraction > 0
                            ? 'fa-exclamation-circle'
                            : 'fa-times-circle'
                          }`}></i>
                        {checkResults[i].isCorrect || checkResults[i].scoreFraction >= 1
                          ? 'Correct!'
                          : checkResults[i].scoreFraction > 0
                            ? `Partially Correct (${Math.round(checkResults[i].scoreFraction * 100)}%)`
                            : 'Incorrect'}
                      </div>
                    )}
                  </div>

                  {/* Detailed Feedback Box */}
                  {checkResults[i] && !checking[i] && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: checkResults[i].isCorrect || checkResults[i].scoreFraction >= 1
                        ? '1px solid rgba(0, 255, 136, 0.3)'
                        : '1px solid rgba(255, 0, 128, 0.3)'
                    }}>
                      <div style={{
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: checkResults[i].isCorrect || checkResults[i].scoreFraction >= 1 ? '#00ff88' : 'var(--accent)'
                      }}>
                        <i className="fas fa-clipboard-check"></i> Evaluation Result
                      </div>

                      {checkResults[i].explanation && (
                        <div style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                          {checkResults[i].explanation}
                        </div>
                      )}

                      {checkResults[i].testsPassed !== undefined && checkResults[i].totalTests > 0 && (
                        <div style={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.85rem',
                          marginTop: '0.5rem'
                        }}>
                          <i className="fas fa-tasks"></i> Tests Passed: {checkResults[i].testsPassed} / {checkResults[i].totalTests}
                        </div>
                      )}

                      {/* Show correct answer if wrong */}
                      {!(checkResults[i].isCorrect || checkResults[i].scoreFraction >= 1) && (c.correctSolution || c.expected || checkResults[i].officialAnswer) && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '0.25rem' }}>
                            <i className="fas fa-lightbulb"></i> Correct Answer:
                          </div>
                          <pre style={{
                            background: 'rgba(0, 255, 136, 0.05)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            color: '#00ff88',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            margin: 0,
                            fontSize: '0.9rem',
                            fontFamily: "'Courier New', monospace"
                          }}>
                            {typeof c.correctSolution === 'string'
                              ? c.correctSolution
                              : c.expected || checkResults[i].officialAnswer || 'See hints for guidance'}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {Array.isArray(c.inputFields) && c.inputFields.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      {c.inputFields.map((fld, fldIdx) => (
                        <div key={fldIdx} style={{ marginBottom: '0.75rem' }}>
                          <label style={{ color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>{fld.label || fld.name}</label>
                          <input
                            value={(challengeSolutions[i] && challengeSolutions[i].inputs && challengeSolutions[i].inputs[fld.name]) || ''}
                            onChange={(e) => {
                              setChallengeSolutions(prev => ({
                                ...prev,
                                [i]: {
                                  ...(prev[i] || {}),
                                  inputs: { ...(prev[i] && prev[i].inputs ? prev[i].inputs : {}), [fld.name]: e.target.value }
                                }
                              })); setDirty(true);
                            }}
                            placeholder={fld.placeholder || ''}
                            type={fld.type || 'text'}
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.2)', background: '#000', color: 'var(--primary)' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Removed auto-display of official answers and evaluation results after save */}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Disable only while submitting or when mission is completed on server side */}
              <button
                className="submit-btn"
                onClick={handleCompleteGeneric}
                disabled={submitting || (mission && mission.userProgress && mission.userProgress.status === 'completed')}
                title={submitting ? 'Submitting...' : (mission && mission.userProgress && mission.userProgress.status === 'completed' ? 'Mission already completed' : '')}
              >
                {submitting ? (
                  <>
                    <span style={{ marginRight: "0.5rem" }}>⏳</span> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Complete Challenges
                  </>
                )}
              </button>

              {/* When the button is disabled because the mission is completed, show a note explaining why */}
              {mission && mission.userProgress && mission.userProgress.status === 'completed' && (
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  This mission is already completed — you cannot re-submit.
                </div>
              )}

              {saveStatus === 'saved' && (
                <div style={{ color: '#00ff88', fontWeight: 700, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,255,136,0.06)' }}>
                  ✓ Progress saved
                </div>
              )}
            </div>
          </div>
        )}

        {questions.length === 0 && scenarios.length === 0 && challenges.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-inbox" style={{ fontSize: "3rem", color: "var(--primary)", marginBottom: "1rem" }}></i>
            <p>This mission has no playable content.</p>
          </div>
        )}

        {/* Review Mission Button - Shows when mission is completed */}
        {mission && mission.userProgress && mission.userProgress.status === 'completed' && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 999
          }}>
            <button
              onClick={() => setShowReviewModal(true)}
              style={{
                background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '50px',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 6px 30px rgba(0, 255, 136, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.4)';
              }}
            >
              <i className="fas fa-clipboard-list"></i> Review Mission
            </button>
          </div>
        )}

        {/* Review Mission Modal */}
        {showReviewModal && (
          <div className="scorecard-overlay" style={{ zIndex: 1200 }}>
            <div className="scorecard-modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Close Button (Top Right) */}
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                title="Close Review"
              >
                <i className="fas fa-times"></i>
              </button>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  <i className="fas fa-medal" style={{ color: '#ffd700' }}></i>
                </div>
                <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.8rem', textShadow: '0 0 20px rgba(0, 255, 136, 0.5)' }}>
                  Mission Review
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.5rem 0 0' }}>{mission.title}</p>
              </div>

              {/* Stats Summary */}
              {(() => {
                const mcqDetails = answerDetails.filter(d => d.type === 'question');
                const scenarioDetails = answerDetails.filter(d => d.type === 'scenario');
                const challengeDetails = answerDetails.filter(d => d.type === 'challenge');
                const mcqCorrect = mcqDetails.filter(d => d.isCorrect).length;
                const scenarioCorrect = scenarioDetails.filter(d => d.isCorrect).length;
                const challengeCorrect = challengeDetails.filter(d => d.isCorrect).length;

                // Use mission content counts if answer details don't have all items
                const mcqTotal = Math.max(mcqDetails.length, questions.length);
                const scenarioTotal = Math.max(scenarioDetails.length, scenarios.length);
                const challengeTotal = Math.max(challengeDetails.length, challenges.length);

                const totalCorrect = mcqCorrect + scenarioCorrect + challengeCorrect;
                const totalItems = mcqTotal + scenarioTotal + challengeTotal;
                const percentage = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;

                return (
                  <>
                    {/* XP & Performance Summary */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 212, 255, 0.15))',
                        border: '2px solid rgba(0, 255, 136, 0.4)',
                        borderRadius: '15px',
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '2rem', color: '#00ff88', fontWeight: 'bold' }}>
                          {result?.gained || mission.userProgress?.score || 0}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          XP Earned
                        </div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 152, 0, 0.15))',
                        border: '2px solid rgba(255, 215, 0, 0.4)',
                        borderRadius: '15px',
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '2rem', color: '#ffd700', fontWeight: 'bold' }}>
                          {percentage}%
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Accuracy
                        </div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15), rgba(255, 0, 128, 0.15))',
                        border: '2px solid rgba(138, 43, 226, 0.4)',
                        borderRadius: '15px',
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '2rem', color: '#8a2be2', fontWeight: 'bold' }}>
                          {totalCorrect}/{totalItems}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Correct
                        </div>
                      </div>
                    </div>

                    {/* Section Badges */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap'
                    }}>
                      {mcqTotal > 0 && (
                        <div style={{
                          background: mcqCorrect === mcqTotal && mcqTotal > 0
                            ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.25), rgba(0, 212, 255, 0.25))'
                            : mcqCorrect > 0
                              ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 152, 0, 0.25))'
                              : 'linear-gradient(135deg, rgba(255, 0, 128, 0.25), rgba(255, 82, 82, 0.25))',
                          border: mcqCorrect === mcqTotal && mcqTotal > 0
                            ? '2px solid rgba(0, 255, 136, 0.6)'
                            : mcqCorrect > 0
                              ? '2px solid rgba(255, 193, 7, 0.6)'
                              : '2px solid rgba(255, 0, 128, 0.6)',
                          borderRadius: '12px',
                          padding: '0.75rem 1.5rem',
                          textAlign: 'center',
                          minWidth: '120px'
                        }}>
                          <i className="fas fa-question-circle" style={{
                            fontSize: '1.5rem',
                            color: mcqCorrect === mcqTotal && mcqTotal > 0 ? '#00ff88' : mcqCorrect > 0 ? '#ffc107' : '#ff0080',
                            marginBottom: '0.25rem',
                            display: 'block'
                          }}></i>
                          <div style={{
                            color: mcqCorrect === mcqTotal && mcqTotal > 0 ? '#00ff88' : mcqCorrect > 0 ? '#ffc107' : '#ff0080',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                          }}>
                            {mcqCorrect}/{mcqTotal}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>MCQs</div>
                        </div>
                      )}
                      {scenarioTotal > 0 && (
                        <div style={{
                          background: scenarioCorrect === scenarioTotal && scenarioTotal > 0
                            ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.25), rgba(0, 212, 255, 0.25))'
                            : scenarioCorrect > 0
                              ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 152, 0, 0.25))'
                              : 'linear-gradient(135deg, rgba(255, 0, 128, 0.25), rgba(255, 82, 82, 0.25))',
                          border: scenarioCorrect === scenarioTotal && scenarioTotal > 0
                            ? '2px solid rgba(0, 255, 136, 0.6)'
                            : scenarioCorrect > 0
                              ? '2px solid rgba(255, 193, 7, 0.6)'
                              : '2px solid rgba(255, 0, 128, 0.6)',
                          borderRadius: '12px',
                          padding: '0.75rem 1.5rem',
                          textAlign: 'center',
                          minWidth: '120px'
                        }}>
                          <i className="fas fa-envelope" style={{
                            fontSize: '1.5rem',
                            color: scenarioCorrect === scenarioTotal && scenarioTotal > 0 ? '#00ff88' : scenarioCorrect > 0 ? '#ffc107' : '#ff0080',
                            marginBottom: '0.25rem',
                            display: 'block'
                          }}></i>
                          <div style={{
                            color: scenarioCorrect === scenarioTotal && scenarioTotal > 0 ? '#00ff88' : scenarioCorrect > 0 ? '#ffc107' : '#ff0080',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                          }}>
                            {scenarioCorrect}/{scenarioTotal}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Scenarios</div>
                        </div>
                      )}
                      {challengeTotal > 0 && (
                        <div style={{
                          background: challengeCorrect === challengeTotal && challengeTotal > 0
                            ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.25), rgba(0, 212, 255, 0.25))'
                            : challengeCorrect > 0
                              ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 152, 0, 0.25))'
                              : 'linear-gradient(135deg, rgba(255, 0, 128, 0.25), rgba(255, 82, 82, 0.25))',
                          border: challengeCorrect === challengeTotal && challengeTotal > 0
                            ? '2px solid rgba(0, 255, 136, 0.6)'
                            : challengeCorrect > 0
                              ? '2px solid rgba(255, 193, 7, 0.6)'
                              : '2px solid rgba(255, 0, 128, 0.6)',
                          borderRadius: '12px',
                          padding: '0.75rem 1.5rem',
                          textAlign: 'center',
                          minWidth: '120px'
                        }}>
                          <i className="fas fa-flag-checkered" style={{
                            fontSize: '1.5rem',
                            color: challengeCorrect === challengeTotal && challengeTotal > 0 ? '#00ff88' : challengeCorrect > 0 ? '#ffc107' : '#ff0080',
                            marginBottom: '0.25rem',
                            display: 'block'
                          }}></i>
                          <div style={{
                            color: challengeCorrect === challengeTotal && challengeTotal > 0 ? '#00ff88' : challengeCorrect > 0 ? '#ffc107' : '#ff0080',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                          }}>
                            {challengeCorrect}/{challengeTotal}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Challenges</div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Close Button */}
              <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  className="scorecard-close-btn"
                  onClick={() => setShowReviewModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    border: 'none',
                    padding: '12px 40px',
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  <i className="fas fa-times"></i> Close Review
                </button>
              </div>
            </div>
          </div>
        )}

        {showMcqHintModal && (
          <div className="scorecard-overlay" style={{ zIndex: 1100 }}>
            <div className="scorecard-modal" style={{ maxWidth: 560 }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}><i className="fas fa-lightbulb"></i> Unlock Hint</h4>
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem' }}>Hints remaining: <strong>{mcqHintsRemaining}</strong></div>
              {mcqUnlockedHints.length > 0 && (
                <div className="hints-box" style={{ marginBottom: '1rem' }}>
                  <div className="hints-title">Unlocked Hints</div>
                  <div className="hints-content">
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                      {mcqUnlockedHints.map((h, idx) => (
                        <li key={idx} style={{ marginBottom: '0.5rem' }}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '0.5rem' }}>Type <strong>unlock</strong> and click "Complete Task" to unlock a hint.</div>
              <input
                placeholder="Type 'unlock' to get a hint"
                value={mcqTaskInput}
                onChange={(e) => setMcqTaskInput(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.2)', background: '#000', color: 'var(--primary)', marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="submit-btn"
                  onClick={handleUnlockMcqHint}
                  disabled={mcqHintsRemaining <= 0 || !(mcqTaskInput && mcqTaskInput.trim().toLowerCase() === 'unlock')}
                  style={{ width: 'auto', padding: '0.5rem 1rem', minWidth: '120px' }}
                >
                  <i className="fas fa-unlock"></i> Complete Task
                </button>
                <button
                  className="scorecard-close-btn"
                  onClick={() => setShowMcqHintModal(false)}
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showScorecard && result && (
          <div className="scorecard-overlay">
            <div className="scorecard-modal">
              <div className="scorecard-trophy">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="scorecard-title">
                Mission Complete!
              </div>

              <div className="scorecard-stats">
                <div className="scorecard-stat">
                  <div className="scorecard-value">{result.gained}</div>
                  <div className="scorecard-label">XP Earned</div>
                </div>

                {result.totalScore !== null && (
                  <div className="scorecard-stat">
                    <div className="scorecard-value">{result.totalScore}</div>
                    <div className="scorecard-label">Total XP</div>
                  </div>
                )}

                {result.level && (
                  <div className="scorecard-stat">
                    <div className="scorecard-value">Lvl {result.level}</div>
                    <div className="scorecard-label">Your Level</div>
                  </div>
                )}
              </div>

              {answerDetails.length > 0 && (
                (() => {
                  const filtered = (answerDetails || []).filter(d => scorecardFilter === 'all' ? true : d.type === scorecardFilter);
                  const detail = filtered[scorecardIndex];

                  // Calculate stats for each section
                  const mcqDetails = answerDetails.filter(d => d.type === 'question');
                  const scenarioDetails = answerDetails.filter(d => d.type === 'scenario');
                  const challengeDetails = answerDetails.filter(d => d.type === 'challenge');

                  const mcqCorrect = mcqDetails.filter(d => d.isCorrect).length;
                  const scenarioCorrect = scenarioDetails.filter(d => d.isCorrect).length;
                  const challengeCorrect = challengeDetails.filter(d => d.isCorrect).length;

                  return (
                    <>
                      {/* Performance Badges */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        marginBottom: '1.5rem'
                      }}>
                        {/* MCQ Badge */}
                        {mcqDetails.length > 0 && (
                          <div style={{
                            background: mcqCorrect === mcqDetails.length
                              ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 212, 255, 0.2))'
                              : mcqCorrect > 0
                                ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2))'
                                : 'linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(255, 82, 82, 0.2))',
                            border: mcqCorrect === mcqDetails.length
                              ? '2px solid rgba(0, 255, 136, 0.5)'
                              : mcqCorrect > 0
                                ? '2px solid rgba(255, 193, 7, 0.5)'
                                : '2px solid rgba(255, 0, 128, 0.5)',
                            borderRadius: '12px',
                            padding: '0.75rem 1.25rem',
                            textAlign: 'center',
                            minWidth: '100px'
                          }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                              <i className="fas fa-question-circle" style={{
                                color: mcqCorrect === mcqDetails.length ? '#00ff88' : mcqCorrect > 0 ? '#ffc107' : '#ff0080'
                              }}></i>
                            </div>
                            <div style={{
                              color: mcqCorrect === mcqDetails.length ? '#00ff88' : mcqCorrect > 0 ? '#ffc107' : '#ff0080',
                              fontWeight: 'bold',
                              fontSize: '1.1rem'
                            }}>
                              {mcqCorrect}/{mcqDetails.length}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>MCQs</div>
                          </div>
                        )}

                        {/* Scenario Badge */}
                        {scenarioDetails.length > 0 && (
                          <div style={{
                            background: scenarioCorrect === scenarioDetails.length
                              ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 212, 255, 0.2))'
                              : scenarioCorrect > 0
                                ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2))'
                                : 'linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(255, 82, 82, 0.2))',
                            border: scenarioCorrect === scenarioDetails.length
                              ? '2px solid rgba(0, 255, 136, 0.5)'
                              : scenarioCorrect > 0
                                ? '2px solid rgba(255, 193, 7, 0.5)'
                                : '2px solid rgba(255, 0, 128, 0.5)',
                            borderRadius: '12px',
                            padding: '0.75rem 1.25rem',
                            textAlign: 'center',
                            minWidth: '100px'
                          }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                              <i className="fas fa-envelope" style={{
                                color: scenarioCorrect === scenarioDetails.length ? '#00ff88' : scenarioCorrect > 0 ? '#ffc107' : '#ff0080'
                              }}></i>
                            </div>
                            <div style={{
                              color: scenarioCorrect === scenarioDetails.length ? '#00ff88' : scenarioCorrect > 0 ? '#ffc107' : '#ff0080',
                              fontWeight: 'bold',
                              fontSize: '1.1rem'
                            }}>
                              {scenarioCorrect}/{scenarioDetails.length}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Scenarios</div>
                          </div>
                        )}

                        {/* Challenge Badge */}
                        {challengeDetails.length > 0 && (
                          <div style={{
                            background: challengeCorrect === challengeDetails.length
                              ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 212, 255, 0.2))'
                              : challengeCorrect > 0
                                ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2))'
                                : 'linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(255, 82, 82, 0.2))',
                            border: challengeCorrect === challengeDetails.length
                              ? '2px solid rgba(0, 255, 136, 0.5)'
                              : challengeCorrect > 0
                                ? '2px solid rgba(255, 193, 7, 0.5)'
                                : '2px solid rgba(255, 0, 128, 0.5)',
                            borderRadius: '12px',
                            padding: '0.75rem 1.25rem',
                            textAlign: 'center',
                            minWidth: '100px'
                          }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                              <i className="fas fa-flag-checkered" style={{
                                color: challengeCorrect === challengeDetails.length ? '#00ff88' : challengeCorrect > 0 ? '#ffc107' : '#ff0080'
                              }}></i>
                            </div>
                            <div style={{
                              color: challengeCorrect === challengeDetails.length ? '#00ff88' : challengeCorrect > 0 ? '#ffc107' : '#ff0080',
                              fontWeight: 'bold',
                              fontSize: '1.1rem'
                            }}>
                              {challengeCorrect}/{challengeDetails.length}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Challenges</div>
                          </div>
                        )}
                      </div>

                      <div className="answer-details-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <h5 style={{ color: "var(--accent)", marginBottom: 0, fontSize: "1rem" }}>
                            <i className="fas fa-clipboard-check"></i> Answer Review
                          </h5>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{scorecardIndex + 1} / {filtered.length}</div>
                        </div>
                        {detail ? (
                          <div className={`answer-detail-item ${detail?.isCorrect ? "correct" : "incorrect"}`}>
                            <div className="answer-detail-question">{`Q${scorecardIndex + 1}. ${detail.question || 'Challenge'}`}</div>

                            {detail.type === 'challenge' ? (
                              <>
                                <div className="answer-detail-row">
                                  <div className="answer-detail-label"><strong>Your Submission:</strong></div>
                                  <div className={`answer-detail-value ${detail.isCorrect ? "answer-correct" : "answer-incorrect"}`}>
                                    {detail.submitted || 'No submission'}
                                    <i className="fas" style={{ marginLeft: "0.5rem" }}>
                                      {detail.isCorrect ? "✓" : "✗"}
                                    </i>
                                  </div>
                                </div>

                                <div className="answer-detail-row">
                                  <div className="answer-detail-label"><strong>Score:</strong></div>
                                  <div className="answer-detail-value">{(detail.scoreFraction !== undefined ? Math.round(detail.scoreFraction * 100) : (detail.isCorrect ? 100 : 0))}%</div>
                                </div>

                                {detail.testsPassed !== undefined && (
                                  <div className="answer-detail-row">
                                    <div className="answer-detail-label"><strong>Tests:</strong></div>
                                    <div className="answer-detail-value">{detail.testsPassed}/{detail.totalTests}</div>
                                  </div>
                                )}

                                {detail.explanation && (
                                  <div className="concept-explanation">
                                    <strong style={{ color: "var(--accent)" }}>💡 Feedback:</strong> {detail.explanation}
                                  </div>
                                )}
                                {detail.aiHint && (
                                  <div style={{ marginTop: '0.75rem' }}>
                                    {detail.aiRecommendHint && (
                                      <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: '0.25rem' }}>AI suggests using a hint.</div>
                                    )}
                                    <button className="submit-btn" style={{ padding: '6px 10px' }} onClick={() => toggleHintExpansion(detail.index)}>
                                      <i className="fas fa-lightbulb"></i> {expandedHints[detail.index] ? 'Hide AI Hint' : 'Show AI Hint'}
                                    </button>
                                    {expandedHints[detail.index] && (
                                      <div className="concept-explanation" style={{ marginTop: '0.5rem' }}>
                                        <strong style={{ color: 'var(--accent)' }}>AI Hint:</strong> {detail.aiHint}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="answer-detail-row">
                                  <div className="answer-detail-label"><strong>Your Answer:</strong></div>
                                  <div className={`answer-detail-value ${detail.isCorrect ? "answer-correct" : "answer-incorrect"}`}>
                                    {detail.userAnswer}
                                    <i className="fas" style={{ marginLeft: "0.5rem" }}>
                                      {detail.isCorrect ? "✓" : "✗"}
                                    </i>
                                  </div>
                                </div>

                                {!detail.isCorrect && (
                                  <div className="answer-detail-row">
                                    <div className="answer-detail-label"><strong>Correct:</strong></div>
                                    <div className="answer-detail-value answer-correct">{detail.correctAnswer}</div>
                                  </div>
                                )}

                                {detail.explanation && (
                                  <div className="concept-explanation">
                                    <strong style={{ color: "var(--accent)" }}>💡 Concept:</strong> {detail.explanation}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </>
                  );
                })()
              )}

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button className="scorecard-close-btn" onClick={prevScore} disabled={scorecardIndex === 0} style={{ width: 'auto', padding: '0.6rem 1rem' }}>
                  <i className="fas fa-arrow-left"></i> Prev
                </button>
                <button className="scorecard-close-btn" onClick={closeScorecard} style={{ width: 'auto', padding: '0.6rem 1rem' }}>
                  <i className="fas fa-times"></i> Close
                </button>
                <button className="scorecard-close-btn" onClick={handleScorecardFinalSubmit} disabled={submitting} style={{ width: 'auto', padding: '0.6rem 1rem' }}>
                  <i className="fas fa-paper-plane"></i> Submit & Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}