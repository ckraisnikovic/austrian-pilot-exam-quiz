let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let allQuestions = []; // Keep original full list
let selectedAnswer = null;
let userAnswers = [];

// Fisher–Yates shuffle algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    allQuestions = data;

    // Shuffle questions
    shuffleArray(allQuestions);

    // Also shuffle options inside each question
    allQuestions = allQuestions.map(q => {
      // Copy question object to avoid mutating original
      const questionCopy = { ...q };
      
      // Create array of { option, originalIndex }
      const optionsWithIndex = questionCopy.options.map((opt, idx) => ({ opt, idx }));
      
      // Shuffle options
      shuffleArray(optionsWithIndex);
      
      // Rebuild options array
      questionCopy.options = optionsWithIndex.map(o => o.opt);
      
      // Update answer index to new position of the correct option
      questionCopy.answer = optionsWithIndex.findIndex(o => o.idx === questionCopy.answer);

      return questionCopy;
    });

    questions = [...allQuestions];
    showQuestion();
  })
  .catch(err => console.error("Error loading questions:", err));

function showQuestion() {
  const quizDiv = document.getElementById("quiz");
  const nextBtn = document.getElementById("next-btn");

  quizDiv.innerHTML = "";
  nextBtn.disabled = true;
  selectedAnswer = null;

  if (currentQuestionIndex < questions.length) {
    const q = questions[currentQuestionIndex];

    const progress = document.createElement("div");
    progress.className = "progress";
    progress.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    quizDiv.appendChild(progress);

    const questionElem = document.createElement("h2");
    questionElem.className = "question";
    questionElem.textContent = q.text;
    quizDiv.appendChild(questionElem);

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options";

    q.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.classList.add("option");
      button.disabled = false;

      button.addEventListener("click", () => {
        if (selectedAnswer !== null) return;
        selectedAnswer = index;

        document.querySelectorAll(".option").forEach(btn => btn.disabled = true);

        if (index === q.answer) {
          button.classList.add("correct");
          score++;
          userAnswers.push({ question: q.text, correctAnswer: q.options[q.answer], userAnswer: option, correct: true });
        } else {
          button.classList.add("wrong");
          document.querySelectorAll(".option").forEach((btn, i) => {
            if (i === q.answer) btn.classList.add("correct");
          });
          userAnswers.push({ question: q.text, correctAnswer: q.options[q.answer], userAnswer: option, correct: false });
        }

        nextBtn.disabled = false;
      });

      optionsDiv.appendChild(button);
    });

    quizDiv.appendChild(optionsDiv);

  } else {
    showResult();
  }
}

document.getElementById("next-btn").addEventListener("click", () => {
  if (selectedAnswer !== null) {
    currentQuestionIndex++;
    showQuestion();
  }
});

function showResult() {
  const quizDiv = document.getElementById("quiz");
  const nextBtn = document.getElementById("next-btn");
  nextBtn.style.display = "none";

  quizDiv.innerHTML = `<h2>Your score: ${score} / ${questions.length}</h2>`;

  const mistakes = userAnswers.filter(a => !a.correct);

  if (mistakes.length > 0) {
    const reportTitle = document.createElement("h3");
    reportTitle.textContent = "Review your mistakes:";
    quizDiv.appendChild(reportTitle);

    mistakes.forEach(m => {
      const div = document.createElement("div");
      div.style.marginBottom = "12px";
      div.innerHTML = `
        <strong>Question:</strong> ${m.question} <br/>
        <strong>Your answer:</strong> ${m.userAnswer} <br/>
        <strong>Correct answer:</strong> ${m.correctAnswer}
      `;
      quizDiv.appendChild(div);
    });
  } else {
    const congrats = document.createElement("p");
    congrats.textContent = "Perfect! You got all answers correct!";
    quizDiv.appendChild(congrats);
  }

  // Create buttons for repeating
  const btnContainer = document.createElement("div");
  btnContainer.style.marginTop = "20px";

  // Repeat all button
  const repeatAllBtn = document.createElement("button");
  repeatAllBtn.textContent = "Repeat Test (All Questions)";
  repeatAllBtn.classList.add("option");
  repeatAllBtn.addEventListener("click", () => {
    resetQuiz(allQuestions);
  });
  btnContainer.appendChild(repeatAllBtn);

  // Repeat mistakes button (only if there are mistakes)
  if (mistakes.length > 0) {
    const repeatMistakesBtn = document.createElement("button");
    repeatMistakesBtn.textContent = "Repeat Test (Only Mistakes)";
    repeatMistakesBtn.classList.add("option")
    repeatMistakesBtn.style.marginLeft = "10px";
    repeatMistakesBtn.addEventListener("click", () => {
      // Build question list for mistakes only
      const mistakeQuestions = [];
      mistakes.forEach(mistake => {
        // Find question object matching the question text
        const q = allQuestions.find(q => q.text === mistake.question);
        if (q) mistakeQuestions.push(q);
      });
      resetQuiz(mistakeQuestions);
    });
    btnContainer.appendChild(repeatMistakesBtn);
  }

  quizDiv.appendChild(btnContainer);
}

function resetQuiz(questionSet) {
  // Shuffle questions
  shuffleArray(questionSet);

  // Shuffle answers for each question
  questions = questionSet.map(q => {
    const questionCopy = { ...q };
    const optionsWithIndex = questionCopy.options.map((opt, idx) => ({ opt, idx }));
    shuffleArray(optionsWithIndex);
    questionCopy.options = optionsWithIndex.map(o => o.opt);
    questionCopy.answer = optionsWithIndex.findIndex(o => o.idx === questionCopy.answer);
    return questionCopy;
  });

  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
  document.getElementById("next-btn").style.display = "inline-block";
  document.getElementById("next-btn").disabled = true;
  showQuestion();
}

