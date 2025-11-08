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

// refresh chain (open modal with blockchain cards)
refreshChain.addEventListener('click', async () => {
  const modal = document.getElementById('chainModal');
  const modalBody = document.getElementById('modalBody');
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  modalBody.innerHTML = '<p>Carregando cadeia...</p>';
  modal.classList.add('modal--active');

  try {
    const res = await fetch('/chain');
    const json = await res.json();
    const chain = json.chain;

    modalBody.innerHTML = '';

    chain.forEach(block => {
      const div = document.createElement('div');
      div.className = 'block-card';
      div.innerHTML = `
        <h3 class="block-card__title">Bloco #${block.index}</h3>
        <p class="block-card__text"><strong>Hash:</strong> ${block.hash.slice(0, 20)}...</p>
        <p class="block-card__text"><strong>Timestamp:</strong> ${block.timestamp}</p>
        <p class="block-card__text"><strong>Transações:</strong></p>
        <pre class="block-card__text">${JSON.stringify(block.transactions, null, 2)}</pre>
      `;
      modalBody.appendChild(div);
    });
  } catch (err) {
    modalBody.innerHTML = '<p>Erro ao carregar a cadeia.</p>';
  }

  // close behavior
  overlay.onclick = closeBtn.onclick = () => {
    modal.classList.remove('modal--active');
  };
});


// refresh results
refreshResults.addEventListener('click', async () => {
  resultsOutput.innerHTML = '<p>Carregando resultados...</p>';
  resultsOutput.style.display = 'block';
  try {
    const res = await fetch('/resultados');
    const json = await res.json();
    const results = json.results;

    // caso não haja votos
    if (!results || Object.keys(results).length === 0) {
      resultsOutput.innerHTML = `
        <div class="results__empty">
          <p>Nenhum voto registrado até o momento.</p>
        </div>
      `;
      return;
    }

    // construir HTML estilizado dos resultados
    let html = `
      <div class="results__card">
        <h3 class="results__title">Resultados da Votação</h3>
        <ul class="results__list">
    `;

    for (const [candidate, votes] of Object.entries(results)) {
      html += `
        <li class="results__item">
          <span class="results__name">${candidate}</span>
          <span class="results__votes">${votes} voto(s)</span>
        </li>
      `;
    }

    html += `
        </ul>
      </div>
    `;

    resultsOutput.innerHTML = html;
    resultsOutput.style.display = 'block';
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