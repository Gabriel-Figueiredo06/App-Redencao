// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuryZes4w8OTkIZGRpn6QYkcbAqXyB7Xk",
  authDomain: "fazenda-redencao-647ea.firebaseapp.com",
  projectId: "fazenda-redencao-647ea",
  storageBucket: "fazenda-redencao-647ea.appspot.com",
  messagingSenderId: "413754208549",
  appId: "1:413754208549:web:a8fa28e55bd1cba2a7aacc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =======================
// Dados da contagem
// =======================
let boisPorCor = {};
let corSelecionada = "Amarelo";

// =======================
// Progresso local
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
  corSelecionada = cor;
  document.querySelectorAll(".btn-cor").forEach((btn) => {
    btn.classList.remove("selecionado");
    if (btn.value === corSelecionada) {
      btn.classList.add("selecionado");
    }
  });
}

// torne acessível ao onclick do HTML
window.selecionarCor = selecionarCor;

// =======================
// Adicionar boi
// =======================
window.Adicionar_animal = function () {
  const peso = parseFloat(document.getElementById("peso").value);
  const num = document.getElementById("num").value.toUpperCase();
  const obs = document.getElementById("obs").value;

  if (!peso || !corSelecionada) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  if (corSelecionada !== "S/B" && !num) {
    alert("Digite o número do boi.");
    return;
  }

  const novoBoi = {
    peso,
    num: num || "S/B",
    cor: corSelecionada,
    obs
  };

  if (!boisPorCor[corSelecionada]) boisPorCor[corSelecionada] = [];
  boisPorCor[corSelecionada].push(novoBoi);

  document.getElementById("peso").value = "";
  document.getElementById("num").value = "";
  document.getElementById("obs").value = "";

  renderizarBois();
  atualizarTotalBois();
  salvarProgressoLocal();
};

// =======================
// Calcular valor total
// =======================
window.CalculoValorTotal = function () {
  const valorPorKg = parseFloat(document.getElementById("valor_kg").value);
  if (!valorPorKg) return;

  let total = 0;
  for (const cor in boisPorCor) {
    boisPorCor[cor].forEach((boi) => {
      total += (boi.peso / 2) * valorPorKg;
    });
  }

  document.querySelector(".valor_total_receber").innerText = `Valor total: R$ ${total.toFixed(2)}`;
};

// =======================
// Renderizar bois
// =======================
function renderizarBois() {
  const lista = document.querySelector(".lista-bois");
  const corFiltro = document.getElementById("filter_color").value;
  lista.innerHTML = "";

  let pesoTotal = 0;

  for (const cor in boisPorCor) {
    if (corFiltro !== "Todos" && cor !== corFiltro) continue;
    boisPorCor[cor].forEach((boi) => {
      const pesoValido = (boi.peso / 2).toFixed(2);
      const div = document.createElement("div");
      div.className = "boi-item";
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

  const totalBois = Object.values(boisPorCor).flat().filter(b => corFiltro === "Todos" || b.cor === corFiltro);
  const pesoMedio = totalBois.length ? pesoTotal / totalBois.length : 0;

  document.querySelector(".peso_tot").innerText = `Peso total: ${pesoTotal.toFixed(2)} kg — Peso médio: ${pesoMedio.toFixed(2)} kg`;
}

// =======================
// Editar
// =======================
window.editarBoi = function (botao, numero, cor) {
  const div = botao.parentElement;
  const boi = boisPorCor[cor].find((b) => b.num === numero);
  div.innerHTML = `
    <input type="text" class="edit-num" value="${boi.num}" />
    <input type="number" class="edit-peso" value="${boi.peso}" />
    <input type="text" class="edit-obs" value="${boi.obs || ""}" placeholder="Observação" />
    <select class="edit-cor">
      ${["Amarelo","Azul","Branco","Laranja","Preto","Rosa","Verde","Vermelho","S/B"]
        .map(c => `<option ${boi.cor === c ? "selected" : ""}>${c}</option>`)
        .join("")}
    </select>
    <button onclick="salvarEdicao(this, '${boi.num}', '${boi.cor}')">Salvar</button>
    <button onclick="renderizarBois()">Cancelar</button>
  `;
};

window.salvarEdicao = function (botao, numeroAntigo, corAntiga) {
  const div = botao.parentElement;
  const novoNumero = div.querySelector(".edit-num").value.toUpperCase();
  const novoPeso = parseFloat(div.querySelector(".edit-peso").value);
  const novaObs = div.querySelector(".edit-obs").value;
  const novaCor = div.querySelector(".edit-cor").value;

  const index = boisPorCor[corAntiga].findIndex(b => b.num === numeroAntigo);
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
  salvarProgressoLocal();
};

// =======================
// Remover
// =======================
window.removerBoi = function (numero, cor) {
  boisPorCor[cor] = boisPorCor[cor].filter(b => b.num !== numero);
  renderizarBois();
  atualizarTotalBois();
  salvarProgressoLocal();
};

// =======================
// Total
// =======================
function atualizarTotalBois() {
  const total = Object.values(boisPorCor).reduce((sum, arr) => sum + arr.length, 0);
  document.querySelector(".total_bois").innerText = `Total de bois: ${total}`;
}

// =======================
// Salvar contagem final no Firebase
// =======================
window.salvarContagem = async function () {
  if (Object.keys(boisPorCor).length === 0) {
    alert("Nenhum boi foi adicionado para salvar.");
    return;
  }

  const nome = prompt("Digite o nome da contagem:");
  if (!nome) return;

  const data = prompt("Digite a data da contagem (ex: 05/08/2025)") || new Date().toLocaleDateString();

  try {
    await addDoc(collection(db, "contagens"), { nome, data, bois: boisPorCor });
    alert("Contagem salva com sucesso!");

    boisPorCor = {};
    renderizarBois();
    atualizarTotalBois();
    localStorage.removeItem("contagemAtual");
  } catch (error) {
    alert("Erro ao salvar no Firebase");
    console.error(error);
  }
};

// =======================
// Inicialização
// =======================
window.onload = () => {
  atualizarCorSelecionada(corSelecionada);
  restaurarProgressoLocal();

  document.getElementById("filter_color").addEventListener("change", renderizarBois);
};
