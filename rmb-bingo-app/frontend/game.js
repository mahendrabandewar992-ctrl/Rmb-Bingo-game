// Dashboard + game logic
// Protect page: ensure session exists
(function(){
  const user = sessionStorage.getItem('rmb_session');
  if(!user){
    // allow but warn
    //window.location.href = 'index.html';
    console.warn('No session found; proceeding as guest.');
  }
})();

function updatePlayersCount(){
  const el = document.getElementById('playersCount');
  let current = parseInt(el.innerText || '1000',10);
  current += Math.floor(Math.random()*11 - 5); // +/-5
  if(current < 500) current = 500;
  el.innerText = current;
}
setInterval(updatePlayersCount, 1500);

// Generate bingo card
function generateBingoCard(){
  const board = document.getElementById('bingoCard');
  board.innerHTML = '';
  const nums = [];
  while(nums.length < 24){
    const n = Math.floor(Math.random()*75)+1;
    if(!nums.includes(n)) nums.push(n);
  }
  for(let i=0;i<25;i++){
    const cell = document.createElement('div');
    if(i===12){ cell.innerText = 'FREE'; cell.classList.add('active'); }
    else { cell.innerText = nums.pop(); cell.addEventListener('click', ()=>cell.classList.toggle('active')); }
    board.appendChild(cell);
  }
}
generateBingoCard();

let drawn = [];
function startDemoRound(){
  drawn = [];
  const maxDraws = 30;
  let draws = 0;
  const all = Array.from({length:75}, (_,i)=>i+1);
  const interval = setInterval(()=>{
    if(draws>=maxDraws){ clearInterval(interval); alert('Demo round ended'); return; }
    const remaining = all.filter(n=>!drawn.includes(n));
    const pick = remaining[Math.floor(Math.random()*remaining.length)];
    drawn.push(pick);
    draws++;
    highlightNumber(pick);
    console.log('Drawn', pick);
  }, 700);
}

function highlightNumber(num){
  // highlight any matching cell
  const cells = document.querySelectorAll('#bingoCard div');
  cells.forEach(c=>{
    if(c.innerText == String(num)) c.classList.add('active');
  });
}

// Payment demo
function buyTicket(method){
  alert('Demo: would open ' + method + ' checkout. Implement server integration for real payments.');
}

// Expose startDemoRound to global
window.startDemoRound = startDemoRound;
window.buyTicket = buyTicket;
