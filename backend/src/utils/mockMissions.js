// Mock mission generator for development/testing
// Dynamically generates missions based on type and difficulty

const difficultyConfig = {
  easy: {
    numQuestions: 3,
    numScenarios: 1,
    descSuffix: "- Beginner Level"
  },
  medium: {
    numQuestions: 4,
    numScenarios: 2,
    descSuffix: "- Intermediate Level"
  },
  hard: {
    numQuestions: 5,
    numScenarios: 2,
    descSuffix: "- Advanced Level"
  },
  expert: {
    numQuestions: 5,
    numScenarios: 3,
    descSuffix: "- Master Level"
  }
};

const topicDescriptions = {
  mcq: "Test your knowledge with multiple choice questions",
  phishing: "Learn to identify and prevent phishing attacks",
  "code-injection": "Understand and prevent code injection vulnerabilities",
  "network-defense": "Master network security and defense strategies",
  "password-crack": "Learn password security and cracking techniques",
  "malware-analysis": "Analyze and understand malware behavior",
  cryptography: "Master encryption and cryptographic concepts",
  "sql-injection": "Prevent and understand SQL injection attacks",
  ransomware: "Understand ransomware attacks and prevention",
  "web-exploit": "Learn web application exploitation techniques",
  forensics: "Master digital forensics investigation",
  "physical-security": "Understand physical security principles",
  "insider-threat": "Identify and mitigate insider threats",
  ddos: "Understand and mitigate DDoS attacks",
  "cloud-security": "Master cloud security best practices",
  iot: "Understand IoT vulnerabilities and security"
};

// Generate dynamic MCQ questions based on topic
const generateMCQQuestions = (topic, difficulty, count) => {
  const questions = [];
  const topicLower = topic.toLowerCase();

  const questionBanks = {
    phishing: [
      { q: "What is the primary goal of phishing?", opts: ["Steal credentials", "Improve security", "Test networks", "Backup data"], ans: 0, explanation: "Phishing attacks aim to steal sensitive information like usernames, passwords, and financial details through deceptive emails and fake websites." },
      { q: "Which email sign is a red flag?", opts: ["Urgent language", "Clear sender", "Good grammar", "SSL certificate"], ans: 0, explanation: "Urgent, threatening language like 'Act now!' or 'Verify immediately' is a classic phishing tactic to make you react without thinking." },
      { q: "What should you do with suspicious emails?", opts: ["Click links", "Contact officially", "Reply password", "Forward friends"], ans: 1, explanation: "Always contact the company directly using official phone numbers or websites, never using information from the suspicious email." },
      { q: "What is spear phishing?", opts: ["Random phishing", "Targeted phishing", "Mass email", "Server attack"], ans: 1, explanation: "Spear phishing targets specific individuals with personalized information, making the attack more convincing and dangerous." },
      { q: "How to verify website legitimacy?", opts: ["Looks professional", "Check HTTPS/URL", "Has logo", "Registered domain"], ans: 1, explanation: "Check the HTTPS lock icon and verify the URL matches the official domain. Fake sites often use similar-looking URLs with slight variations." },
      { q: "What are phishing red flags?", opts: ["Professional design", "Suspicious links and urgency", "Clear company info", "Verified SSL"], ans: 1, explanation: "Red flags include suspicious links, urgent requests for credentials, poor grammar, and requests to verify personal information via email." },
      { q: "Where do phishing attacks come from?", opts: ["Legitimate sources", "Fake URLs/spoofed emails", "Official channels", "Verified senders"], ans: 1, explanation: "Phishing comes from fake email addresses that spoof legitimate companies and fake websites designed to look like the real thing." }
    ],
    "code-injection": [
      { q: "What is code injection?", opts: ["Running code", "Inserting malicious code", "Deleting code", "Copying code"], ans: 1, explanation: "Code injection is when attackers insert malicious code into a program or application by exploiting improper input validation." },
      { q: "Which prevents code injection?", opts: ["User input", "Input validation", "No checks", "Trust users"], ans: 1, explanation: "Input validation checks and sanitizes all user input before using it, preventing attackers from injecting malicious commands." },
      { q: "What is SQL injection?", opts: ["SQL database", "Malicious SQL code", "Data backup", "Query optimization"], ans: 1, explanation: "SQL injection attacks insert malicious SQL commands into input fields to manipulate databases and steal or modify data." },
      { q: "How to prevent injection attacks?", opts: ["Parameterized queries", "No validation", "Trust input", "Accept all data"], ans: 0, explanation: "Parameterized queries (prepared statements) separate user input from SQL code, making injection attacks impossible." },
      { q: "What is XSS?", opts: ["Cross-site scripting", "Database query", "Network protocol", "File format"], ans: 0, explanation: "Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into websites to steal user data or sessions." },
      { q: "Which is vulnerable to injection?", opts: ["Unvalidated user input", "Encrypted data", "Hashed passwords", "Static content"], ans: 0, explanation: "Any application that processes unvalidated user input without proper checks is vulnerable to injection attacks." }
    ],
    "password-crack": [
      { q: "What is brute force attack?", opts: ["Guessing passwords systematically", "Social engineering", "Phishing", "Malware"], ans: 0, explanation: "Brute force attacks try all possible password combinations until finding the correct one, using automated tools." },
      { q: "Strong password includes?", opts: ["Only letters", "Mix of cases, numbers, symbols", "Dictionary words", "Same as username"], ans: 1, explanation: "Strong passwords combine uppercase, lowercase, numbers, and special characters to resist brute force and dictionary attacks." },
      { q: "What is rainbow table?", opts: ["Color chart", "Precomputed hash values", "Password list", "Database"], ans: 1, explanation: "Rainbow tables are precomputed lists of password hashes used to quickly crack passwords without calculating hashes." },
      { q: "How often change passwords?", opts: ["Never", "Every 5 years", "Every 90 days", "Once a year"], ans: 2, explanation: "Security best practices recommend changing passwords every 90 days or immediately after suspected breaches." },
      { q: "What is credential stuffing?", opts: ["Password storage", "Using leaked credentials", "Creating passwords", "Hashing passwords"], ans: 1, explanation: "Credential stuffing uses leaked passwords from one site to hack accounts on other sites where users reuse passwords." },
      { q: "What makes a password weak?", opts: ["Long combinations", "Dictionary words", "Special characters", "Numbers"], ans: 1, explanation: "Weak passwords use common dictionary words, personal information, or simple patterns that attackers can guess quickly." }
    ],
    mcq: [
      { q: "What is cybersecurity?", opts: ["Computer repair", "Protecting systems from attacks", "Network maintenance", "Data storage"], ans: 1, explanation: "Cybersecurity is the practice of protecting systems, networks, and data from digital attacks, theft, and unauthorized access." },
      { q: "What is a firewall?", opts: ["Physical wall", "Network security device", "Software license", "User account"], ans: 1, explanation: "A firewall monitors and controls incoming and outgoing network traffic based on security rules to prevent unauthorized access." },
      { q: "What is encryption?", opts: ["Data backup", "Converting data to unreadable form", "File compression", "Network cable"], ans: 1, explanation: "Encryption converts readable data into coded form that can only be read with the correct decryption key, protecting confidentiality." },
      { q: "What is a virus?", opts: ["Disease", "Malicious software", "Network protocol", "File type"], ans: 1, explanation: "A virus is malicious software that replicates itself and infects files or systems to steal data or cause damage." },
      { q: "What is MFA?", opts: ["Single password", "Multiple authentication methods", "Data encryption", "File compression"], ans: 1, explanation: "Multi-Factor Authentication (MFA) requires two or more verification methods to prove your identity, increasing security." },
      { q: "What is a vulnerability?", opts: ["Feature", "Security weakness", "Update", "Protocol"], ans: 1, explanation: "A vulnerability is a security flaw or weakness in software that attackers can exploit to gain unauthorized access." }
    ],
    cryptography: [
      { q: "What is symmetric encryption?", opts: ["Multiple keys", "Same key for both", "Public key", "No encryption"], ans: 1, explanation: "Symmetric encryption uses the same key to encrypt and decrypt data. Both sender and receiver must keep this key secret." },
      { q: "What is RSA?", opts: ["Database", "Asymmetric algorithm", "File format", "Protocol"], ans: 1, explanation: "RSA is an asymmetric encryption algorithm using public and private keys, widely used for secure communication and digital signatures." },
      { q: "What is hash function?", opts: ["Password storage", "One-way conversion", "Encryption", "Decryption"], ans: 1, explanation: "Hash functions convert data into fixed-length codes that cannot be reversed. Used for password storage and data integrity verification." },
      { q: "What is PKI?", opts: ["Private keys only", "Public key infrastructure", "File format", "Network protocol"], ans: 1, explanation: "PKI is a system managing public and private keys, certificates, and authorities to enable secure digital communication." },
      { q: "What is a certificate?", opts: ["Degree", "Digital identity verification", "License", "Permit"], ans: 1, explanation: "A digital certificate verifies ownership of a public key and is signed by a trusted Certificate Authority, used for HTTPS websites." },
      { q: "What does encryption do?", opts: ["Deletes data", "Protects data confidentiality", "Increases speed", "Reduces size"], ans: 1, explanation: "Encryption transforms readable data into unreadable form, protecting it from unauthorized access and ensuring confidentiality." }
    ]
  };

  const bank = questionBanks[topicLower] || questionBanks.mcq;

  // Shuffle the bank and pick random questions
  const shuffled = [...bank].sort(() => Math.random() - 0.5);

  // Creative hints that explain the concept without giving the answer
  const hintBank = {
    phishing: [
      "Think about what attackers really want from you - is it your bank account, passwords, or personal data?",
      "Imagine receiving an urgent message from someone claiming to be from your bank. Real banks never ask for verification via email. What does this tell you?",
      "Consider this: legitimate companies verify through official channels and secure websites. Fake ones use urgency and pressure.",
      "Picture a fake website that looks identical to the real one. How would you check if it's genuine before entering your credentials?",
      "Real attackers study you first. They gather information about your company, colleagues, and habits. What's the targeted version of phishing called?",
      "Imagine you're a hacker - what would make someone click your malicious link? Urgency? Fear? A reward?"
    ],
    "code-injection": [
      "Think of your code like a house - would you let strangers add rooms without checking if they're safe?",
      "Imagine a restaurant that accepts any ingredient customers suggest without checking. That's vulnerable to injection.",
      "If you ask a user for their name and they enter '${dangerous_code}', what happens if you don't check it?",
      "SQL is like a conversation with a database. What happens if someone inserts unexpected commands into that conversation?",
      "Picture a web form that directly uses user input in database queries. What protection would you add?",
      "Attackers try to 'inject' code when your application trusts user input blindly. What's the defense mechanism?"
    ],
    "password-crack": [
      "Imagine trying every word in a dictionary, then every combination. That's what computers do very fast. What's this technique called?",
      "A strong password should be hard to guess. Mix different types of characters - would a simple dictionary word survive an attack?",
      "Someone pre-computed millions of passwords and their hash values for quick lookup. What tool is this?",
      "Think about your passwords like locks - the stronger and more unique, the harder to break. How often should you change them?",
      "Attackers use leaked password lists from data breaches to try the same credentials on other sites. What's this attack called?",
      "Your password 'Password123' looks complex, but is it really? Why would hackers crack it in seconds?"
    ],
    mcq: [
      "Security is like protecting your home - you need layers of defense. What's the main concept?",
      "Imagine a barrier between your network and the internet, filtering bad traffic. What is this called?",
      "Think of text being scrambled so only you and the intended reader can understand it. That's the basic idea.",
      "A program that copies itself and damages your system. What causes the most harm in cyber attacks?",
      "Using two forms of proof (like password + phone code). Modern apps ask for this for security.",
      "A flaw in software that could let attackers in - what would you call this security problem?"
    ],
    cryptography: [
      "Both sender and receiver use the same secret key. Think of it like one master key for a house.",
      "A famous algorithm using public and private keys - used for email, banking, and more. It's named after three mathematicians.",
      "A function that converts data into a fixed-length fingerprint - impossible to reverse but easy to verify. What's this called?",
      "Imagine a system where everyone has a public key (like an email address) and private key (like a password). What's this system called?",
      "A digital proof that says 'I am who I claim to be' - needed for secure websites and emails.",
      "When you access a secure website with HTTPS, data becomes unreadable to eavesdroppers. What protects it?"
    ]
  };

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const q = shuffled[i];
    // Also shuffle options but keep track of correct answer
    const optionsWithIndices = q.opts.map((opt, idx) => ({ opt, originalIdx: idx }));
    const shuffledOpts = optionsWithIndices.sort(() => Math.random() - 0.5);
    const newAnswerIdx = shuffledOpts.findIndex(x => x.originalIdx === q.ans);

    // Select a random hint from the appropriate bank
    const hints = hintBank[topicLower] || hintBank.mcq;
    const randomHint = hints[Math.floor(Math.random() * hints.length)];

    questions.push({
      question: q.q,
      options: shuffledOpts.map(x => x.opt),
      answer: newAnswerIdx,
      hint: randomHint,
      explanation: q.explanation || "Well done! You answered this correctly."
    });
  }

  return questions;
};

// Generate dynamic scenario emails
const generateScenarios = (topic, difficulty, count) => {
  const scenarios = [];

  const scenarioTemplates = [
    {
      title: "Suspicious Email from Authority",
      sender: "admin@internal-company.com",
      subject: "URGENT: Verify Account Immediately",
      content: "Your account has suspicious activity detected. Click here to verify: http://verify-account-now.com"
    },
    {
      title: "Prize Notification Scam",
      sender: "prizes@winner-notification.net",
      subject: "You've Won! Claim Your Prize",
      content: "Congratulations! You've won a $1000 gift card. Click to claim: http://claim-prize-now.xyz"
    },
    {
      title: "Package Delivery Notice",
      sender: "delivery@package-service.com",
      subject: "Package Delivery Failed - Update Address",
      content: "Your package couldn't be delivered. Update your shipping address here: http://delivery-update.com"
    },
    {
      title: "Bank Security Alert",
      sender: "security@your-bank-alert.com",
      subject: "ALERT: Unauthorized Access Attempt",
      content: "We detected an unauthorized login. Verify your identity immediately: http://bank-verify-now.com"
    },
    {
      title: "Job Offer Email",
      sender: "hr@recruiter-company.com",
      subject: "Exclusive Job Opportunity For You",
      content: "We have a great opportunity for you. Confirm your interest and details: http://job-opportunity.net"
    },
    {
      title: "Software Update Notice",
      sender: "updates@system-software.net",
      subject: "Critical System Update Required",
      content: "Your system needs a critical security update. Download now: http://system-update-urgent.com"
    },
    {
      title: "Refund Processing",
      sender: "refunds@tax-service.com",
      subject: "Your Tax Refund is Ready",
      content: "Your tax refund of $2500 is ready for processing. Claim it here: http://tax-refund-claim.net"
    }
  ];

  // Shuffle and pick random scenarios
  const shuffled = [...scenarioTemplates].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const template = shuffled[i];
    scenarios.push({
      title: template.title,
      sender: template.sender,
      subject: template.subject,
      content: template.content,
      options: ["This is legitimate", "This is a phishing attempt", "Report to security", "Delete the email"],
      answer: 1  // Usually the phishing attempt option
    });
  }

  return scenarios;
};

// Generate dynamic challenges
const generateChallenges = (topic, difficulty, count) => {
  const challenges = [];
  const topicKey = (topic || '').toString().toLowerCase();

  const challengeTemplates = [
    {
      title: "SQL Injection Vulnerability Detection",
      description: "Identify the SQL injection vulnerability in this code",
      code: "SELECT * FROM users WHERE id = '" + "' + userInput + '\'",
      language: "sql",
      tags: ["sql", "injection"],
      hints: ["Check for string concatenation", "Look for unsanitized input", "Use parameterized queries"]
    },
    {
      title: "Password Security Analysis",
      description: "Analyze this password for security vulnerabilities",
      code: "Password: 'password123'\nUsername: admin\nStored in: plaintext database",
      language: "text",
      tags: ["password", "auth"],
      hints: ["Check password strength", "Look for plaintext storage", "No hashing detected"]
    },
    {
      title: "Network Protocol Analysis",
      description: "What security issues do you see in this packet capture?",
      code: "HTTP Request to: http://sensitive-data.com/api/transfer\nPayload: account=12345&amount=1000&pin=1234",
      language: "text",
      tags: ["network", "cleartext"],
      hints: ["Protocol should be HTTPS", "Sensitive data in cleartext", "PIN exposed in URL"]
    },
    {
      title: "Malware Signature Detection",
      description: "Identify the malicious pattern",
      code: "exec(base64_decode('...')); \n$_GET['cmd']; \nsystem($_POST['shell']);",
      language: "php",
      tags: ["malware", "rce"],
      hints: ["Remote code execution", "Dynamic execution", "User input directly executed"]
    },
    {
      title: "Authentication Bypass",
      description: "Find the authentication flaw",
      code: "if (username == 'admin' || password == null) { grant_access(); }",
      language: "javascript",
      tags: ["auth", "logic"],
      hints: ["Logic error", "OR condition vulnerability", "Missing password check"]
    },
    {
      title: "Directory Traversal Vulnerability",
      description: "Spot the directory traversal attack",
      code: "file = open(user_input_path)\nreadfile(file)",
      language: "python",
      tags: ["traversal", "path"],
      hints: ["Path validation missing", "Use absolute paths", "Check for ../ patterns"]
    },
    {
      title: "CSRF Token Analysis",
      description: "Find the CSRF vulnerability",
      code: "<form action='transfer.php'>\n<input type='hidden' name='amount' value='1000'>\n</form>",
      language: "html",
      tags: ["csrf", "web"],
      hints: ["No CSRF token", "No state verification", "Use anti-CSRF tokens"]
    }
  ];

  // Prefer templates that match the topic (if provided), but allow random selection
  const matching = challengeTemplates.filter(t => {
    return (t.tags || []).some(tag => topicKey.includes(tag) || topicKey === tag);
  });

  const pool = (matching.length > 0) ? matching.concat(challengeTemplates.filter(t => !matching.includes(t))) : [...challengeTemplates];

  // Shuffle pool and pick up to 'count' items
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const template = shuffled[i];
    const topicHint = topicKey ? ` (${topicKey})` : '';
    challenges.push({
      title: `${template.title}${topicHint}`,
      description: template.description,
      code: template.code,
      language: template.language,
      hints: template.hints
    });
  }

  return challenges;
};

// Main function to generate mission
exports.generateMockMission = (topic, difficulty, type) => {
  const diff = (difficulty || "easy").toLowerCase();
  const config = difficultyConfig[diff] || difficultyConfig.easy;

  // Always generate mixed content (MCQ + Scenarios + Challenges)
  // regardless of the type parameter
  const questions = generateMCQQuestions(topic, diff, config.numQuestions);
  const scenarios = generateScenarios(topic, diff, config.numScenarios);
  const challenges = generateChallenges(topic, diff, 2);

  let content = {
    questions: questions,
    scenarios: scenarios,
    challenges: challenges
  };

  // Normalize topic for display (remove unwanted tokens like 'mcq')
  let topicDisplay = (topic || '').toString().trim();
  topicDisplay = topicDisplay.replace(/\bmcq\b/ig, '').replace(/\bmultiple choice\b/ig, '').trim();
  if (!topicDisplay) topicDisplay = 'Security';

  const topicDesc = topicDescriptions[topicDisplay?.toLowerCase()] || `Learn about ${topicDisplay}`;

  // Create unique, descriptive titles based on content
  const timestamp = Date.now();
  const variant = Math.floor(Math.random() * 100);
  const difficultyLabel = diff.charAt(0).toUpperCase() + diff.slice(1);

  // Create a more descriptive title
  const titles = [
    `${topicDisplay} Mastery - ${difficultyLabel} Challenge #${variant}`,
    `${topicDisplay} Security Training - ${difficultyLabel} Level`,
    `${topicDisplay} Assessment - ${difficultyLabel} Difficulty`,
    `${topicDisplay} Learning Module - ${difficultyLabel} Stage`,
    `${topicDisplay} Certification Prep - ${difficultyLabel} Tier`
  ];

  const randomTitle = titles[Math.floor(Math.random() * titles.length)];

  // Create unique descriptions based on what's in the mission
  const descriptions = [
    `Complete ${questions.length} questions, analyze ${scenarios.length} scenarios, and solve ${challenges.length} security challenges to master ${topicDisplay.toLowerCase()} at ${diff} level.`,
    `Test your ${topicDisplay.toLowerCase()} knowledge with ${questions.length} multiple-choice questions, evaluate ${scenarios.length} real-world scenarios, and complete ${challenges.length} practical challenges.`,
    `Comprehensive ${topicDisplay.toLowerCase()} training: Answer ${questions.length} questions, assess ${scenarios.length} situations, and tackle ${challenges.length} technical challenges.`,
    `Interactive ${topicDisplay.toLowerCase()} mission featuring ${questions.length} knowledge questions, ${scenarios.length} scenario-based evaluations, and ${challenges.length} hands-on security exercises.`,
    `Full ${topicDisplay.toLowerCase()} learning experience with ${questions.length} multiple-choice questions, ${scenarios.length} case studies, and ${challenges.length} practical security challenges.`
  ];

  const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

  return {
    title: randomTitle,
    description: randomDescription,
    points: diff === 'easy' ? 100 : diff === 'medium' ? 200 : diff === 'hard' ? 300 : 500,
    content: content,
    type: "comprehensive",  // Indicates this is a mixed mission
    difficulty: diff,
    topic: topicDisplay
  };
};
