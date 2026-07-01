// ===== Animated Star Background =====
const starCanvas = document.getElementById('stars-bg');
const ctx = starCanvas.getContext('2d');

let stars = [];
const starColors = ['#ffffff', '#ffd6e0', '#c6f7ff', '#e0d6ff', '#fff3c4'];

function resizeCanvas() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
}

function createStars() {
  const starCount = Math.floor((starCanvas.width * starCanvas.height) / 6000);
  stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * starCanvas.width,
      y: Math.random() * starCanvas.height,
      radius: Math.random() * 1.6 + 0.4,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      speed: Math.random() * 0.3 + 0.05,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);

  stars.forEach(star => {
    star.twinklePhase += star.twinkleSpeed;
    const opacity = 0.5 + Math.sin(star.twinklePhase) * 0.5;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = star.color;
    ctx.globalAlpha = opacity;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Slow downward drift
    star.y += star.speed;
    if (star.y > starCanvas.height) {
      star.y = 0;
      star.x = Math.random() * starCanvas.width;
    }
  });

  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createStars();
});

resizeCanvas();
createStars();
drawStars();

// ===== ALU Simulator Logic =====
// Get elements
const inputA = document.getElementById('inputA');
const inputB = document.getElementById('inputB');
const operation = document.getElementById('operation');
const executeBtn = document.getElementById('executeBtn');
const clearBtn = document.getElementById('clearBtn');
const resultBox = document.getElementById('resultBox');

// Execute ALU operation
executeBtn.addEventListener('click', () => {
  const op = operation.value;
  const aValue = inputA.value.trim();
  const bValue = inputB.value.trim();

  // NOT operation only needs Input A
  if (op === 'not') {
    if (aValue === '') {
      alert('Please enter a valid number for Input A.');
      return;
    }
  } else {
    if (aValue === '' || bValue === '') {
      alert('Please enter valid numbers for both Input A and Input B.');
      return;
    }
  }

  const a = Number(aValue);
  const b = Number(bValue);
  let result;
  let symbol;

  switch (op) {
    case 'add':
      result = a + b;
      symbol = '+';
      break;
    case 'sub':
      result = a - b;
      symbol = '-';
      break;
    case 'and':
      result = a & b;
      symbol = 'AND';
      break;
    case 'or':
      result = a | b;
      symbol = 'OR';
      break;
    case 'xor':
      result = a ^ b;
      symbol = 'XOR';
      break;
    case 'not':
      result = ~a;
      symbol = 'NOT';
      break;
    default:
      result = 'Invalid Operation';
  }

  if (op === 'not') {
    resultBox.textContent = `NOT (${a}) = ${result}`;
  } else {
    resultBox.textContent = `${a} ${symbol} ${b} = ${result}`;
  }
});

// Clear inputs and result
clearBtn.addEventListener('click', () => {
  inputA.value = '';
  inputB.value = '';
  operation.selectedIndex = 0;
  resultBox.textContent = 'Result will appear here';
});
