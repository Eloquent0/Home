const symbols = ["🍒", "🍋", "🔔", "⭐", "💎"]; 
// placeholders — replace with images later

const slots = [
  document.getElementById("slot1"),
  document.getElementById("slot2"),
  document.getElementById("slot3")
];

const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("result");

function getRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function spinSlots() {
  spinBtn.disabled = true;
  resultText.textContent = "";

  let spins = 15;
  const interval = setInterval(() => {
    slots.forEach(slot => {
      slot.textContent = getRandomSymbol();
    });

    spins--;
    if (spins === 0) {
      clearInterval(interval);
      spinBtn.disabled = false;
      checkWin();
    }
  }, 100);
}

function checkWin() {
  const values = slots.map(slot => slot.textContent);

  if (values[0] === values[1] && values[1] === values[2]) {
    resultText.textContent = "🎉 JACKPOT!";
  } else {
    resultText.textContent = "Try again!";
  }
}

spinBtn.addEventListener("click", spinSlots);
