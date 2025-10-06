// =======================
// Firebase Setup
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuryZes4w00TkIZGRpn6QYkcbAqXyB7Xk", // 🔥 substitua por sua nova API Key válida
  authDomain: "fazenda-redencao-647ea.firebaseapp.com",
  projectId: "fazenda-redencao-647ea",
  storageBucket: "fazenda-redencao-647ea.appspot.com",
  messagingSenderId: "413754208549",
  appId: "1:413754208549:web:a8fa28e55bd1cba2a7aacc",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// =======================
// Autenticação Anônima
// =======================
let authReady = new Promise((resolve, reject) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ Usuário autenticado:", user.uid);
      resolve(user);
    } else {
      console.log("🔄 Tentando login anônimo...");
      signInAnonymously(auth)
        .then((result) => {
          console.log("✅ Login anônimo realizado:", result.user.uid);
          resolve(result.user);
        })
        .catch((error) => {
          console.error("❌ Erro ao autenticar:", error);
          alert(
            "Não foi possível autenticar no Firebase.\nVerifique se o login ANÔNIMO está habilitado e se o domínio está autorizado no Firebase."
          );
          reject(error);
        });
    }
  });
});

authReady
  .then(() => console.log("🔥 Autenticação pronta"))
  .catch((err) => console.error("Erro no authReady:", err));

// =======================
// Dados da contagem
// =======================
let boisPorCor = {};
let corSelecionada = "Amarelo";

// =======================
// Progresso Local
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
  corSelecionada = botao.value;
  document.querySelectorAll(".btn-cor").forEach((btn) => {
    btn.classList.remove("selecionado");
    if (btn.value === corSelecionada) btn.classList.add("selecionado");
  });
}
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
    obs,
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
// Calcular Valor Total
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

  document.querySelector(
    ".valor_total_receber"
  ).innerText = `Valor total: R$ ${total.toFixed(2)}`;
};

// =======================
// Renderizar Bois
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
        <strong>Nº ${boi.num}</strong> - ${boi.peso}kg - Cor: ${boi.cor} - 
        <span>Peso válido: ${pesoValido}kg</span><br>
        <span>Observação: ${boi.obs || "Nenhuma"}</span>
        <button onclick="editarBoi(this, '${boi.num}', '${
        boi.cor
      }')">Editar</button>
        <button onclick="removerBoi('${boi.num}', '${
        boi.cor
      }')">Remover</button>
      `;
      lista.appendChild(div);
      pesoTotal += boi.peso;
    });
  }

  const totalBois = Object.values(boisPorCor)
    .flat()
    .filter((b) => corFiltro === "Todos" || b.cor === corFiltro);
  const pesoMedio = totalBois.length ? pesoTotal / totalBois.length : 0;

  document.querySelector(
    ".peso_tot"
  ).innerText = `Peso total: ${pesoTotal.toFixed(
    2
  )} kg — Peso médio: ${pesoMedio.toFixed(2)} kg`;
}

// =======================
// Editar / Salvar / Remover
// =======================
window.editarBoi = function (botao, numero, cor) {
  const div = botao.parentElement;
  const boi = boisPorCor[cor].find((b) => b.num === numero);
  div.innerHTML = `
    <input type="text" class="edit-num" value="${boi.num}" />
    <input type="number" class="edit-peso" value="${boi.peso}" />
    <input type="text" class="edit-obs" value="${
      boi.obs || ""
    }" placeholder="Observação" />
    <select class="edit-cor">
      ${[
        "Amarelo",
        "Azul",
        "Branco",
        "Laranja",
        "Preto",
        "Rosa",
        "Verde",
        "Vermelho",
        "S/B",
      ]
        .map((c) => `<option ${boi.cor === c ? "selected" : ""}>${c}</option>`)
        .join("")}
    </select>
    <button onclick="salvarEdicao(this, '${boi.num}', '${
    boi.cor
  }')">Salvar</button>
    <button onclick="renderizarBois()">Cancelar</button>
  `;
};

window.salvarEdicao = function (botao, numeroAntigo, corAntiga) {
  const div = botao.parentElement;
  const novoNumero = div.querySelector(".edit-num").value.toUpperCase();
  const novoPeso = parseFloat(div.querySelector(".edit-peso").value);
  const novaObs = div.querySelector(".edit-obs").value;
  const novaCor = div.querySelector(".edit-cor").value;

  const index = boisPorCor[corAntiga].findIndex((b) => b.num === numeroAntigo);
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

window.removerBoi = function (numero, cor) {
  boisPorCor[cor] = boisPorCor[cor].filter((b) => b.num !== numero);
  renderizarBois();
  atualizarTotalBois();
  salvarProgressoLocal();
};

// =======================
// Total e Salvamento
// =======================
function atualizarTotalBois() {
  const total = Object.values(boisPorCor).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  document.querySelector(".total_bois").innerText = `Total de bois: ${total}`;
}

window.salvarContagem = async function () {
  await authReady; // ✅ Garante que está autenticado
  if (Object.keys(boisPorCor).length === 0) {
    alert("Nenhum boi foi adicionado para salvar.");
    return;
  }

  const nome = prompt("Digite o nome da contagem:");
  if (!nome) return;

  const data =
    prompt("Digite a data da contagem (ex: 05/08/2025)") ||
    new Date().toLocaleDateString();

  try {
    await addDoc(collection(db, "contagens"), { nome, data, bois: boisPorCor });
    alert("✅ Contagem salva com sucesso!");
    boisPorCor = {};
    renderizarBois();
    atualizarTotalBois();
    localStorage.removeItem("contagemAtual");
  } catch (error) {
    console.error("Erro ao salvar no Firebase:", error);
    alert(" Erro ao salvar no Firebase. Verifique as permissões.");
  }
};

// =======================
// Inicialização
// =======================
window.onload = () => {
  restaurarProgressoLocal();
  document
    .getElementById("filter_color")
    .addEventListener("change", renderizarBois);
};
