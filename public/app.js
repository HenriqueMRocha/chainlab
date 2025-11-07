// app.js
// app.js - frontend interactions (English code, Portuguese UI)
// communicates with backend endpoints described in README

const apiBase = ''; // same origin

// elements
const registerBtn = document.getElementById('registerBtn');
const voterIdOut = document.getElementById('voterId');
const voteBtn = document.getElementById('voteBtn');
const inputVoterId = document.getElementById('inputVoterId');
const selectVote = document.getElementById('selectVote');
const voteResult = document.getElementById('voteResult');
const refreshChain = document.getElementById('refreshChain');
const chainOutput = document.getElementById('chainOutput');
const refreshResults = document.getElementById('refreshResults');
const resultsOutput = document.getElementById('resultsOutput');
const themeToggle = document.getElementById('themeToggle');

// helper: send POST
async function postJSON(url, payload) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return res.json();
}


// register voter
registerBtn.addEventListener('click', async () => {
  try {
    const res = await postJSON('/cadastrar_eleitor', {});
  if (res.voterId) {
    voterIdOut.textContent = `Seu eleitor ID: ${res.voterId}`;
    inputVoterId.value = res.voterId;
  } else {
    voterIdOut.textContent = 'Erro ao gerar ID';
  }
  } catch (err) {
    voterIdOut.textContent = 'Erro de rede';
  }
});

// vote
voteBtn.addEventListener('click', async () => {
  const eleitor_id = inputVoterId.value.trim();
  const voto = selectVote.value;
  voteResult.textContent = 'Enviando...';
  try {
    const res = await postJSON('/votar', { eleitor_id, voto });
    if (res.success) {
      voteResult.textContent = `Voto registrado em bloco ${res.block.index}`;
    } else if (res.error) {
      voteResult.textContent = `Erro: ${res.error}`;
    } else {
      voteResult.textContent = 'Resposta inesperada';
    }
  } catch (err) {
    voteResult.textContent = 'Erro de rede';
  }
});

// refresh chain
refreshChain.addEventListener('click', async () => {
  chainOutput.textContent = 'Carregando...';
  try {
    const res = await fetch('/chain');
    const json = await res.json();
    chainOutput.textContent = JSON.stringify(json.chain, null, 2);
  } catch (err) {
    chainOutput.textContent = 'Erro ao carregar a cadeia';
  }
});


// refresh results
refreshResults.addEventListener('click', async () => {
  resultsOutput.textContent = 'Carregando...';
  try {
    const res = await fetch('/resultados');
    const json = await res.json();
    resultsOutput.textContent = JSON.stringify(json.results, null, 2);
  } catch (err) {
    resultsOutput.textContent = 'Erro ao carregar resultados';
  }
});

// theme toggle
const toggleBtn = document.getElementById('themeToggle');
const body = document.body;

toggleBtn.addEventListener('click', () => {
  const isDark = !body.classList.contains('theme--dark');
  setTheme(isDark);
  localStorage.setItem('theme-dark', isDark ? '1' : '0');
});

// init
(function init() {
  const saved = localStorage.getItem('theme-dark');
  setTheme(saved === '1');
})();

function setTheme(isDark) {
  if (isDark) {
    body.classList.add('theme--dark');
    body.classList.remove('theme--light');
  } else {
    body.classList.add('theme--light');
    body.classList.remove('theme--dark');
  }
}