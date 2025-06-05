const questionElement = document.getElementById('question');
const optionsElement = document.getElementById('options');
const scoreValue = document.getElementById('score-value');
const highScoreValue = document.getElementById('high-score-value');
const loadingContainer = document.getElementById('loading-container');
const timerElement = document.getElementById('timer-value');

// Modal
const modal = document.createElement('div');
modal.classList.add('modal');
const modalContent = document.createElement('div');
modalContent.classList.add('modal-content');
const modalText = document.createElement('p');
const restartButton = document.createElement('button');
restartButton.textContent = 'Restart Game';
modalContent.appendChild(modalText);
modalContent.appendChild(restartButton);
modal.appendChild(modalContent);
document.body.appendChild(modal);

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreValue.textContent = highScore;
let allDrivers = []; // Global cache for driver data
let timer = 60;
let timerInterval = null;

// Fallback drivers
const fallbackDrivers = [
  { full_name: "Lewis Hamilton", driver_number: 44, date_of_birth: "1985-01-07", team_name: "Mercedes" },
  { full_name: "Max Verstappen", driver_number: 1, date_of_birth: "1997-09-30", team_name: "Red Bull Racing" },
  { full_name: "Charles Leclerc", driver_number: 16, date_of_birth: "1997-10-16", team_name: "Ferrari" },
  { full_name: "Fernando Alonso", driver_number: 14, date_of_birth: "1981-07-29", team_name: "Aston Martin" },
  { full_name: "Sergio Perez", driver_number: 11, date_of_birth: "1990-01-26", team_name: "Red Bull Racing" },
  { full_name: "Carlos Sainz", driver_number: 55, date_of_birth: "1994-09-01", team_name: "Ferrari" }
];

// Fetch and cache driver data once
async function loadDriversOnce() {
  const localData = localStorage.getItem('drivers');
  if (localData) {
    allDrivers = JSON.parse(localData);
    return;
  }

  try {
    const res = await fetch('https://api.openf1.org/v1/drivers?session_key=latest');
    const data = await res.json();
    allDrivers = data.length >= 4 ? data : fallbackDrivers;
    localStorage.setItem('drivers', JSON.stringify(allDrivers));
  } catch (e) {
    allDrivers = fallbackDrivers;
  }
}

function getAge(dob) {
  return Math.floor((new Date() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365));
}

function pickQuestionType() {
  const types = ['highestValue', 'oldest', 'teamMatch', 'shortestLastName'];
  return types[Math.floor(Math.random() * types.length)];
}

function shuffle(array) {
  return array.sort(() => 0.5 - Math.random());
}

async function generateQuestion() {
  loadingContainer.style.display = 'block';

  const options = shuffle(allDrivers).slice(0, 4);
  const selectedTemplate = pickQuestionType();
  optionsElement.innerHTML = '';

  let questionText = '';
  let correct;

  switch (selectedTemplate) {
    case 'highestValue':
      questionText = "Which driver has the highest car number?";
      correct = options.reduce((a, b) => a.driver_number > b.driver_number ? a : b);
      break;

    case 'oldest':
      questionText = "Which driver is the oldest?";
      correct = options.reduce((a, b) => getAge(a.date_of_birth) > getAge(b.date_of_birth) ? a : b);
      break;

    case 'teamMatch':
      const team = options[0].team_name || "Red Bull Racing";
      questionText = `Which driver races for ${team}?`;
      correct = options.find(d => d.team_name === team) || options[0];
      break;

    case 'shortestLastName':
      questionText = "Who has the shortest last name?";
      correct = options.reduce((a, b) => {
        const aLast = a.full_name.split(" ").pop();
        const bLast = b.full_name.split(" ").pop();
        return aLast.length < bLast.length ? a : b;
      });
      break;
  }

  questionElement.textContent = questionText;

  options.forEach(driver => {
    const btn = document.createElement('button');
    btn.textContent = driver.full_name;
    btn.onclick = () => checkAnswer(driver.full_name === correct.full_name);
    optionsElement.appendChild(btn);
  });

  loadingContainer.style.display = 'none';
}

function checkAnswer(isCorrect) {
  if (isCorrect) {
    score++;
    scoreValue.textContent = score;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      highScoreValue.textContent = highScore;
    }
    generateQuestion();
  } else {
    showGameOverPopup();
  }
}

function showGameOverPopup() {
  clearInterval(timerInterval);
  modalText.textContent = `Game Over! Your Score: ${score}`;
  modal.style.display = 'block';
  restartButton.onclick = () => {
    score = 0;
    scoreValue.textContent = score;
    modal.style.display = 'none';
    startGame();
  };
}

function startTimer() {
  timer = 60;
  timerElement.textContent = `${timer}s`;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    timerElement.textContent = `${timer}s`;
    if (timer <= 0) {
      clearInterval(timerInterval);
      showGameOverPopup();
    }
  }, 1000);
}

async function startGame() {
  await loadDriversOnce();
  startTimer();
  generateQuestion();
}

startGame();
