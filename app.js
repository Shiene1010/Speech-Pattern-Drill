const statusEl = document.getElementById("status");
const targetTextEl = document.getElementById("targetText");
const transcriptEl = document.getElementById("transcript");
const countValueEl = document.getElementById("countValue");

const listenButton = document.getElementById("listenButton");
const speakButton = document.getElementById("speakButton");
const backwardButton = document.getElementById("backwardButton");
const practiceButton = document.getElementById("practiceButton");
const resetButton = document.getElementById("resetButton");

const targetExpression = "Just tell me what you're told.";
let count = 0;
let recognition;
let isListening = false;

targetTextEl.textContent = targetExpression;

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  statusEl.textContent = "이 브라우저는 SpeechRecognition을 지원하지 않습니다. Chrome을 사용하세요.";
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    statusEl.textContent = "듣는 중...";
    listenButton.textContent = "듣기 중지";
  };

  recognition.onend = () => {
    isListening = false;
    statusEl.textContent = "대기 중";
    listenButton.textContent = "듣기 시작";
  };

  recognition.onresult = (event) => {
    let transcript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript + " ";
    }

    transcriptEl.textContent = transcript.trim();
  };

  recognition.onerror = (event) => {
    statusEl.textContent = `오류: ${event.error}`;
  };
}

listenButton.addEventListener("click", () => {
  if (!recognition) return;

  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

speakButton.addEventListener("click", () => {
  const utterance = new SpeechSynthesisUtterance(targetExpression);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
});

backwardButton.addEventListener("click", () => {
  const words = targetExpression.replace(/[.]/g, "").split(" ");
  const chunks = [];

  for (let i = words.length - 1; i >= 0; i--) {
    chunks.unshift(words.slice(i).join(" "));
  }

  statusEl.textContent = "백워드 재생 중";

  chunks.forEach((chunk, index) => {
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
      transcriptEl.textContent = chunk;
    }, index * 1800);
  });
});

practiceButton.addEventListener("click", () => {
  const heard = transcriptEl.textContent.toLowerCase().replace(/[^\w\s]/g, "").trim();
  const target = targetExpression.toLowerCase().replace(/[^\w\s]/g, "").trim();

  if (!heard || heard === "여기에 음성 인식 결과가 표시됩니다") {
    statusEl.textContent = "먼저 문장을 말해보세요.";
    return;
  }

  if (heard === target) {
    count += 1;
    countValueEl.textContent = String(count);
    statusEl.textContent = "일치! 카운트 증가";
  } else {
    statusEl.textContent = "불일치. 다시 해보세요.";
  }
});

resetButton.addEventListener("click", () => {
  count = 0;
  countValueEl.textContent = "0";
  transcriptEl.textContent = "여기에 음성 인식 결과가 표시됩니다.";
  statusEl.textContent = "초기화됨";
});