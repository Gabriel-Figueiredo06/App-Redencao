// Lista para armazenar os bois por cor
let boisPorCor = {};
let corSelecionada = "Amarelo"; // Cor padrão

function selecionarCor(botao) {
  const cor = botao.value;
  atualizarCorSelecionada(cor);
}

function atualizarCorSelecionada(cor) {
  corSelecionada = cor;
  document.querySelectorAll(".btn-cor").forEach((btn) => {
    btn.classList.remove("selecionado");
    if (btn.value === corSelecionada) {
      btn.classList.add("selecionado");
    }
  });
}

function Adicionar_animal() {
  const pesoInput = document.getElementById("peso");
  const numInput = document.getElementById("num");
  const peso = parseFloat(pesoInput.value);
  const num = numInput.value.toUpperCase();
  const cor = corSelecionada;

  if (!peso || !num || !cor) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  const novoBoi = { peso, num, cor };
  if (!boisPorCor[cor]) boisPorCor[cor] = [];
  boisPorCor[cor].push(novoBoi);

  pesoInput.value = "";
  numInput.value = "";

  renderizarBois();
  atualizarTotalBois();
}

function CalculoValorTotal() {
  const valorPorKg = parseFloat(document.getElementById("valor_kg").value);
  if (!valorPorKg) return;
  let total = 0;
  for (const cor in boisPorCor) {
    boisPorCor[cor].forEach((boi) => {
      total += (boi.peso/2) * valorPorKg;
    });
  }
  document.querySelector(
    ".valor_total_receber"
  ).innerText = `Valor total: R$ ${total.toFixed(2)}`;
}

function renderizarBois() {
  const lista = document.querySelector(".lista-bois");
  lista.innerHTML = "";
  const corFiltro = document.getElementById("filter_color").value;
  let pesoTotal = 0;

  for (const cor in boisPorCor) {
    if (corFiltro !== "Todos" && corFiltro !== cor) continue;
    boisPorCor[cor].forEach((boi) => {
      const div = document.createElement("div");
      div.classList.add("boi-item");
      const pesoValido = (boi.peso / 2).toFixed(2);

      div.innerHTML = `
  <strong>${boi.num}</strong> - ${boi.peso}kg - ${boi.cor} - 
  <span>Peso válido: ${pesoValido}kg</span>
  <button onclick="editarBoi(this, '${boi.num}', '${boi.cor}')">Editar</button>
  <button onclick="removerBoi('${boi.num}', '${boi.cor}')">Remover</button>
`;

      lista.appendChild(div);
      pesoTotal += boi.peso;
    });
  }

  const totalBois = Object.values(boisPorCor)
    .flat()
    .filter((boi) => corFiltro === "Todos" || boi.cor === corFiltro);

  const pesoMedio = totalBois.length > 0 ? pesoTotal / totalBois.length : 0;

  document.querySelector(
    ".peso_tot"
  ).innerText = `Peso total: ${pesoTotal.toFixed(
    2
  )} kg — Peso médio: ${pesoMedio.toFixed(2)} kg`;

  atualizarTotalBois();
}

function removerBoi(numero, cor) {
  boisPorCor[cor] = boisPorCor[cor].filter((boi) => boi.num !== numero);
  renderizarBois();
  atualizarTotalBois();
}

function editarBoi(botao, numero, cor) {
  const div = botao.parentElement;
  const boi = boisPorCor[cor].find((b) => b.num === numero);

  div.innerHTML = `
    <input type="text" class="edit-num" value="${boi.num}" />
    <input type="number" class="edit-peso" value="${boi.peso}" />
    <select class="edit-cor">
      <option ${boi.cor === "Amarelo" ? "selected" : ""}>Amarelo</option>
      <option ${boi.cor === "Azul" ? "selected" : ""}>Azul</option>
      <option ${boi.cor === "Branco" ? "selected" : ""}>Branco</option>
      <option ${boi.cor === "Laranja" ? "selected" : ""}>Laranja</option>
      <option ${boi.cor === "Preto" ? "selected" : ""}>Preto</option>
      <option ${boi.cor === "Rosa" ? "selected" : ""}>Rosa</option>
      <option ${boi.cor === "Verde" ? "selected" : ""}>Verde</option>
      <option ${boi.cor === "Vermelho" ? "selected" : ""}>Vermelho</option>
    </select>
    <button onclick="salvarEdicao(this, '${boi.num}', '${
    boi.cor
  }')">Salvar</button>
    <button onclick="renderizarBois()">Cancelar</button>
  `;
}

function salvarEdicao(botao, numeroAntigo, corAntiga) {
  const div = botao.parentElement;

  const novoNumero = div.querySelector(".edit-num").value.toUpperCase();
  const novoPeso = parseFloat(div.querySelector(".edit-peso").value);
  const novaCor = div.querySelector(".edit-cor").value;

  if (!boisPorCor[corAntiga]) return;
  const index = boisPorCor[corAntiga].findIndex(
    (boi) => boi.num === numeroAntigo
  );
  if (index === -1) return;

  const boi = boisPorCor[corAntiga].splice(index, 1)[0];
  boi.num = novoNumero;
  boi.peso = novoPeso;
  boi.cor = novaCor;

  if (!boisPorCor[novaCor]) boisPorCor[novaCor] = [];
  boisPorCor[novaCor].push(boi);

  renderizarBois();
  atualizarTotalBois();
}

function atualizarTotalBois() {
  let total = 0;
  for (const cor in boisPorCor) {
    total += boisPorCor[cor].length;
  }
  const totalDiv = document.querySelector(".total_bois");
  if (totalDiv) {
    totalDiv.innerText = `Total de bois: ${total}`;
  }
}

// Iniciar cor selecionada e renderizar
window.onload = () => {
  atualizarCorSelecionada(corSelecionada);
  renderizarBois();

  // Ativar filtro por cor
  document.getElementById("filter_color").addEventListener("change", () => {
    renderizarBois();
  });
};

function salvarContagem() {
  if (Object.keys(boisPorCor).length === 0) {
    alert("Nenhum boi foi adicionado para salvar.");
    return;
  }

  const nome = prompt("Digite o nome da contagem:");
  if (!nome) return;

  const data = prompt("Digite a data da contagem (ex: 05/08/2025):") || new Date().toLocaleDateString();

  const historico = JSON.parse(localStorage.getItem("historicoContagens")) || [];

  historico.push({
    nome,
    data,
    bois: boisPorCor,
  });

  localStorage.setItem("historicoContagens", JSON.stringify(historico));

  alert("Contagem salva com sucesso!");

  // Limpar a contagem atual após salvar
  boisPorCor = {};
  renderizarBois();
  atualizarTotalBois();
}
