// Lista para armazenar os bois por cor
let boisPorCor = {};
let corSelecionada = "Amarelo"; // Cor padrão

// =======================
// Salvar e restaurar progresso
// =======================
function salvarProgressoLocal() {
  localStorage.setItem("contagemAtual", JSON.stringify(boisPorCor));
}

function restaurarProgressoLocal() {
  const salvo = localStorage.getItem("contagemAtual");
  if (salvo) {
    boisPorCor = JSON.parse(salvo);
    renderizarBois();
    atualizarTotalBois();
  }
}

// =======================
// Seleção de cor
// =======================
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

// =======================
// Adicionar boi
// =======================
function Adicionar_animal() {
  const pesoInput = document.getElementById("peso");
  const numInput = document.getElementById("num");
  const obsInput = document.getElementById("obs");

  const peso = parseFloat(pesoInput.value);
  const num = numInput.value.toUpperCase();
  const obs = obsInput.value;
  const cor = corSelecionada;

  // Peso obrigatório
  if (!peso || !cor) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  // Número obrigatório exceto para S/B
  if (cor !== "S/B" && !num) {
    alert("Digite o número do boi.");
    return;
  }

  // Cria objeto do boi
  const novoBoi = {
    peso,
    num: num || "S/B",
    cor,
    obs
  };

  if (!boisPorCor[cor]) boisPorCor[cor] = [];
  boisPorCor[cor].push(novoBoi);

  // Limpa campos
  pesoInput.value = "";
  numInput.value = "";
  obsInput.value = "";

  renderizarBois();
  atualizarTotalBois();
  salvarProgressoLocal(); // salva o progresso
}

// =======================
// Calcular valor total
// =======================
function CalculoValorTotal() {
  const valorPorKg = parseFloat(document.getElementById("valor_kg").value);
  if (!valorPorKg) return;
  let total = 0;
  for (const cor in boisPorCor) {
    boisPorCor[cor].forEach((boi) => {
      total += (boi.peso / 2) * valorPorKg;
    });
  }
  document.querySelector(
    ".valor_total_receber"
  ).innerText = `Valor total: R$ ${total.toFixed(2)}`;
}

// =======================
// Renderizar lista
// =======================
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
        <span>Peso válido: ${pesoValido}kg</span> - 
        <span>Observação: ${boi.obs || "Nenhuma"}</span>
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

// =======================
// Remover boi
// =======================
function removerBoi(numero, cor) {
  boisPorCor[cor] = boisPorCor[cor].filter((boi) => boi.num !== numero);
  renderizarBois();
  atualizarTotalBois();
  salvarProgressoLocal(); // salva o progresso
}

// =======================
// Editar boi
// =======================
function editarBoi(botao, numero, cor) {
  const div = botao.parentElement;
  const boi = boisPorCor[cor].find((b) => b.num === numero);

  div.innerHTML = `
    <input type="text" class="edit-num" value="${boi.num}" />
    <input type="number" class="edit-peso" value="${boi.peso}" />
    <input type="text" class="edit-obs" value="${boi.obs || ""}" placeholder="Observação" />
    <select class="edit-cor">
      <option ${boi.cor === "Amarelo" ? "selected" : ""}>Amarelo</option>
      <option ${boi.cor === "Azul" ? "selected" : ""}>Azul</option>
      <option ${boi.cor === "Branco" ? "selected" : ""}>Branco</option>
      <option ${boi.cor === "Laranja" ? "selected" : ""}>Laranja</option>
      <option ${boi.cor === "Preto" ? "selected" : ""}>Preto</option>
      <option ${boi.cor === "Rosa" ? "selected" : ""}>Rosa</option>
      <option ${boi.cor === "Verde" ? "selected" : ""}>Verde</option>
      <option ${boi.cor === "Vermelho" ? "selected" : ""}>Vermelho</option>
      <option ${boi.cor === "S/B" ? "selected" : ""}>S/B</option>
    </select>
    <button onclick="salvarEdicao(this, '${boi.num}', '${boi.cor}')">Salvar</button>
    <button onclick="renderizarBois()">Cancelar</button>
  `;
}

function salvarEdicao(botao, numeroAntigo, corAntiga) {
  const div = botao.parentElement;

  const novoNumero = div.querySelector(".edit-num").value.toUpperCase();
  const novoPeso = parseFloat(div.querySelector(".edit-peso").value);
  const novaObs = div.querySelector(".edit-obs").value;
  const novaCor = div.querySelector(".edit-cor").value;

  if (!boisPorCor[corAntiga]) return;
  const index = boisPorCor[corAntiga].findIndex(
    (boi) => boi.num === numeroAntigo
  );
  if (index === -1) return;

  const boi = boisPorCor[corAntiga].splice(index, 1)[0];
  boi.num = novoNumero || "S/B";
  boi.peso = novoPeso;
  boi.obs = novaObs;
  boi.cor = novaCor;

  if (!boisPorCor[novaCor]) boisPorCor[novaCor] = [];
  boisPorCor[novaCor].push(boi);

  renderizarBois();
  atualizarTotalBois();
  salvarProgressoLocal(); // salva o progresso
}

// =======================
// Atualizar total
// =======================
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

// =======================
// Inicialização
// =======================
window.onload = () => {
  atualizarCorSelecionada(corSelecionada);
  restaurarProgressoLocal(); // restaura progresso salvo

  document.getElementById("filter_color").addEventListener("change", () => {
    renderizarBois();
  });
};

// =======================
// Salvar contagem final
// =======================
function salvarContagem() {
  if (Object.keys(boisPorCor).length === 0) {
    alert("Nenhum boi foi adicionado para salvar.");
    return;
  }

  const nome = prompt("Digite o nome da contagem:");
  if (!nome) return;

  const data = prompt("Digite a data da contagem (ex: 05/08/2025)") || new Date().toLocaleDateString();

  const historico = JSON.parse(localStorage.getItem("historicoContagens")) || [];

  historico.push({
    nome,
    data,
    bois: boisPorCor,
  });

  localStorage.setItem("historicoContagens", JSON.stringify(historico));
  localStorage.removeItem("contagemAtual"); // limpa progresso

  alert("Contagem salva com sucesso!");

  boisPorCor = {};
  renderizarBois();
  atualizarTotalBois();
}
