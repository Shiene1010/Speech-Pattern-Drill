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
  "Just tell me what you're told.",
  "I have to go to the station now.",
  "Practice makes perfect every time.",
  "Actions speak louder than words.",
  "The early bird catches the worm."
];

const commandMap = {
  start: ["스타트", "시작", "start"],
  backward: ["백워드", "backward"],
  practice: ["해버고", "연습", "practice"],
  next: ["다음", "next"],
  reset: ["초기화", "리셋", "reset"]
};

// MARK: - State
let count = 0;
let currentIndex = 0;
let recognition = null;
let isListening = false;
let mode = "command"; // command | practice
let lastFinalTranscript = "";

targetTextEl.textContent = patterns[currentIndex];

// MARK: - Speech Recognition Setup
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  statusEl.textContent = "이 브라우저는 SpeechRecognition을 지원하지 않습니다. Chrome을 사용하세요.";
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    listenButton.textContent = "듣기 중지";
    statusEl.textContent = mode === "command"
      ? "명령어를 듣는 중..."
      : "연습 발화를 듣는 중...";
  };

  recognition.onend = () => {
    isListening = false;
    listenButton.textContent = "듣기 시작";
    if (mode === "command") {
      statusEl.textContent = "대기 중 - '스타트' 또는 '백워드'라고 말해보세요.";
    } else {
      statusEl.textContent = "대기 중 - 연습 모드";
    }
  };

  recognition.onerror = (event) => {
    statusEl.textContent = `오류: ${event.error}`;
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
      lastFinalTranscript = finalText.trim();
      handleRecognizedText(lastFinalTranscript);
    }
  };
}

// MARK: - Helpers
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsCommand(text, commandKey) {
  const normalized = normalizeText(text);
  return commandMap[commandKey].some(cmd => normalized.includes(normalizeText(cmd)));
}

function speakText(text, lang = "en-US", rate = 0.9) {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

function updateTarget() {
  targetTextEl.textContent = patterns[currentIndex];
}

function moveNextPattern() {
  currentIndex = (currentIndex + 1) % patterns.length;
  updateTarget();
  statusEl.textContent = "다음 패턴으로 이동했습니다.";
}

function playCurrentPattern() {
  const target = patterns[currentIndex];
  statusEl.textContent = "타겟 표현을 읽는 중...";
  speakText(target, "en-US", 0.85);
}

function playBackwardPattern() {
  const target = patterns[currentIndex];
  const clean = target.replace(/[.?!]/g, "");
  const words = clean.split(" ");
  const sequences = [];

  for (let i = words.length - 1; i >= 0; i--) {
    sequences.push(words.slice(i).join(" "));
  }

  statusEl.textContent = "백워드 모드 재생 중...";

  window.speechSynthesis.cancel();

  sequences.forEach((chunk, index) => {
    setTimeout(() => {
      transcriptEl.textContent = chunk;
      speakText(chunk, "en-US", 0.8);
    }, index * 1800);
  });
}

function startPracticeMode() {
  mode = "practice";
  statusEl.textContent = "연습 모드입니다. 타겟 표현을 따라 말해보세요.";
  speakText("Repeat after me.", "en-US", 0.9);
}

function returnToCommandMode() {
  mode = "command";
  statusEl.textContent = "명령 모드로 돌아왔습니다.";
}

function checkPractice(spokenText) {
  const spoken = normalizeText(spokenText);
  const target = normalizeText(patterns[currentIndex]);

  if (spoken === target) {
    count += 1;
    countValueEl.textContent = String(count);
    statusEl.textContent = "정확히 일치했습니다. 카운트 증가.";
    speakText("Good job.", "en-US", 0.95);
    returnToCommandMode();
    return;
  }

  const targetWords = target.split(" ");
  const spokenWords = spoken.split(" ");
  const matchedCount = targetWords.filter(word => spokenWords.includes(word)).length;
  const score = matchedCount / targetWords.length;

  if (score >= 0.7) {
    count += 1;
    countValueEl.textContent = String(count);
    statusEl.textContent = `부분 일치 성공 (${Math.round(score * 100)}%). 카운트 증가.`;
    speakText("Good. Try again.", "en-US", 0.95);
    returnToCommandMode();
  } else {
    statusEl.textContent = `불일치 (${Math.round(score * 100)}%). 다시 해보세요.`;
    speakText("Try again.", "en-US", 0.95);
  }
}

function handleRecognizedText(text) {
  if (mode === "command") {
    if (containsCommand(text, "start")) {
      playCurrentPattern();
      return;
    }

    if (containsCommand(text, "backward")) {
      playBackwardPattern();
      return;
    }

    if (containsCommand(text, "practice")) {
      startPracticeMode();
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

    statusEl.textContent = `알 수 없는 명령: ${text}`;
    return;
  }

  if (mode === "practice") {
    checkPractice(text);
  }
}

function resetAll() {
  count = 0;
  currentIndex = 0;
  mode = "command";
  countValueEl.textContent = "0";
  transcriptEl.textContent = "여기에 음성 인식 결과가 표시됩니다.";
  updateTarget();
  statusEl.textContent = "초기화되었습니다.";
  window.speechSynthesis.cancel();
}

// MARK: - Button Actions
listenButton.addEventListener("click", () => {
  if (!recognition) return;

  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

speakButton.addEventListener("click", () => {
  playCurrentPattern();
});

backwardButton.addEventListener("click", () => {
  playBackwardPattern();
});

practiceButton.addEventListener("click", () => {
  startPracticeMode();
});

resetButton.addEventListener("click", () => {
  resetAll();
});