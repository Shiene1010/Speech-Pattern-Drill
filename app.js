// MARK: - Elements
const statusEl = document.getElementById("status");
const targetTextEl = document.getElementById("targetText");
const transcriptEl = document.getElementById("transcript");
const countValueEl = document.getElementById("countValue");

const listenButton = document.getElementById("listenButton");
const speakButton = document.getElementById("speakButton");
const backwardButton = document.getElementById("backwardButton");
const practiceButton = document.getElementById("practiceButton");
const resetButton = document.getElementById("resetButton");

// MARK: - Data
const patterns = [
  {
    fullText: "Just tell me what you're told.",
    chunks: ["Just tell me", "what you're told"]
  },
  {
    fullText: "I have to go to the station now.",
    chunks: ["I have to go", "to the station", "now"]
  },
  {
    fullText: "Practice makes perfect every time.",
    chunks: ["Practice makes perfect", "every time"]
  },
  {
    fullText: "Actions speak louder than words.",
    chunks: ["Actions speak", "louder than words"]
  },
  {
    fullText: "The early bird catches the worm.",
    chunks: ["The early bird", "catches the worm"]
  }
];

const commandMap = {
  start: ["start"],
  backward: ["backward"],
  practice: ["have a go"],
  next: ["next"],
  reset: ["reset"]
};

// MARK: - State
let count = 0;
let currentIndex = 0;
let recognition = null;
let isListening = false;
let mode = "command";
let shouldResumeRecognitionAfterSpeech = false;
let isSpeaking = false;

// MARK: - Setup
updateTarget();

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  statusEl.textContent =
    "This browser does not support SpeechRecognition. Please use Chrome.";
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    listenButton.textContent = "Stop Listening";
    statusEl.textContent =
      mode === "command"
        ? "Listening for English commands..."
        : "Listening for your practice sentence...";
  };

  recognition.onend = () => {
    isListening = false;
    listenButton.textContent = "Start Listening";

    if (isSpeaking) return;

    if (shouldResumeRecognitionAfterSpeech) {
      shouldResumeRecognitionAfterSpeech = false;
      safeStartRecognition();
      return;
    }

    statusEl.textContent =
      mode === "command"
        ? "Idle - say: start, backward, have a go, next, reset"
        : "Practice mode - say the target sentence.";
  };

  recognition.onerror = (event) => {
    statusEl.textContent = `Recognition error: ${event.error}`;
  };

  recognition.onresult = (event) => {
    let interimText = "";
    let finalText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript.trim();

      if (result.isFinal) {
        finalText += text + " ";
      } else {
        interimText += text + " ";
      }
    }

    transcriptEl.textContent = (finalText || interimText).trim();

    if (finalText.trim()) {
      handleRecognizedText(finalText.trim());
    }
  };
}

// MARK: - Helpers
function currentPattern() {
  return patterns[currentIndex];
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsCommand(text, commandKey) {
  const normalized = normalizeText(text);
  return commandMap[commandKey].some((cmd) =>
    normalized.includes(normalizeText(cmd))
  );
}

function safeStartRecognition() {
  if (!recognition || isListening || isSpeaking) return;

  try {
    recognition.start();
  } catch (error) {
    console.warn("recognition.start skipped:", error);
  }
}

function safeStopRecognition() {
  if (!recognition || !isListening) return;

  try {
    recognition.stop();
  } catch (error) {
    console.warn("recognition.stop skipped:", error);
  }
}

function speakText(text, lang = "en-US", rate = 0.9) {
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();

    if (isListening) {
      shouldResumeRecognitionAfterSpeech = true;
      safeStopRecognition();
    }

    isSpeaking = true;
    statusEl.textContent = `Speaking: ${text}`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      isSpeaking = false;

      if (shouldResumeRecognitionAfterSpeech) {
        shouldResumeRecognitionAfterSpeech = false;
        setTimeout(() => {
          safeStartRecognition();
        }, 250);
      }

      resolve();
    };

    utterance.onerror = () => {
      isSpeaking = false;

      if (shouldResumeRecognitionAfterSpeech) {
        shouldResumeRecognitionAfterSpeech = false;
        setTimeout(() => {
          safeStartRecognition();
        }, 250);
      }

      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

function updateTarget() {
  targetTextEl.textContent = currentPattern().fullText;
}

function moveNextPattern() {
  currentIndex = (currentIndex + 1) % patterns.length;
  updateTarget();
  statusEl.textContent = "Moved to the next pattern.";
}

async function playCurrentPattern() {
  await speakText(currentPattern().fullText, "en-US", 0.85);
  statusEl.textContent = "Say a command: backward, have a go, next, reset";
}

function buildBackwardSequences(chunks) {
  const sequences = [];

  for (let i = chunks.length - 1; i >= 0; i--) {
    sequences.push(chunks.slice(i).join(" / "));
  }

  return sequences;
}

async function playBackwardPattern() {
  const sequences = buildBackwardSequences(currentPattern().chunks);

  statusEl.textContent = "Backward chunk mode...";

  for (const sequence of sequences) {
    transcriptEl.textContent = sequence;
    await speakText(sequence.replaceAll(" / ", ", "), "en-US", 0.78);
  }

  statusEl.textContent = "Backward finished. Say: have a go, next, reset";
}

async function playChunkSequenceForward() {
  for (const chunk of currentPattern().chunks) {
    transcriptEl.textContent = chunk;
    await speakText(chunk, "en-US", 0.82);
  }
}

async function startPracticeMode() {
  mode = "practice";
  statusEl.textContent = "Practice mode. Repeat the full target sentence.";
  await speakText("Have a go.", "en-US", 0.92);
}

function returnToCommandMode() {
  mode = "command";
  statusEl.textContent = "Back to command mode.";
}

function calculateWordScore(spokenText, targetText) {
  const spokenWords = normalizeText(spokenText).split(" ");
  const targetWords = normalizeText(targetText).split(" ");

  const matchedCount = targetWords.filter((word) =>
    spokenWords.includes(word)
  ).length;

  return matchedCount / targetWords.length;
}

async function checkPractice(spokenText) {
  const spoken = normalizeText(spokenText);
  const target = normalizeText(currentPattern().fullText);

  if (spoken === target) {
    count += 1;
    countValueEl.textContent = String(count);
    await speakText("Good job.", "en-US", 0.95);
    returnToCommandMode();
    return;
  }

  const score = calculateWordScore(spokenText, currentPattern().fullText);

  if (score >= 0.7) {
    count += 1;
    countValueEl.textContent = String(count);
    await speakText("Good. Try again.", "en-US", 0.95);
    returnToCommandMode();
  } else {
    await speakText("Try again.", "en-US", 0.95);
    statusEl.textContent = `Not matched enough (${Math.round(score * 100)}%). Repeat the sentence.`;
  }
}

async function handleRecognizedText(text) {
  if (isSpeaking) return;

  if (mode === "command") {
    if (containsCommand(text, "start")) {
      await playCurrentPattern();
      return;
    }

    if (containsCommand(text, "backward")) {
      await playBackwardPattern();
      return;
    }

    if (containsCommand(text, "practice")) {
      await startPracticeMode();
      return;
    }

    if (containsCommand(text, "next")) {
      moveNextPattern();
      return;
    }

    if (containsCommand(text, "reset")) {
      resetAll();
      return;
    }

    statusEl.textContent = `Unknown command: ${text}`;
    return;
  }

  if (mode === "practice") {
    await checkPractice(text);
  }
}

function resetAll() {
  count = 0;
  currentIndex = 0;
  mode = "command";
  countValueEl.textContent = "0";
  transcriptEl.textContent = "Your speech recognition result will appear here.";
  updateTarget();
  window.speechSynthesis.cancel();
  statusEl.textContent = "Reset complete.";
}

// MARK: - Button Actions
listenButton.addEventListener("click", () => {
  if (!recognition) return;

  if (isListening) {
    safeStopRecognition();
  } else {
    safeStartRecognition();
  }
});

speakButton.addEventListener("click", async () => {
  await playCurrentPattern();
});

backwardButton.addEventListener("click", async () => {
  await playBackwardPattern();
});

practiceButton.addEventListener("click", async () => {
  await startPracticeMode();
});

resetButton.addEventListener("click", () => {
  resetAll();
});