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
  apiKey: "AIzaSyCuryZes4w00TkIZGRpn6QYkcbAqXyB7Xk",
  authDomain: "fazenda-redencao-647ea.firebaseapp.com",
  projectId: "fazenda-redencao-647ea",
  storageBucket: "fazenda-redencao-647ea.appspot.com",
  messagingSenderId: "413754208549",
  appId: "1:413754208549:web:a8fa28e55bd1cba2a7aacc",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =======================
// Autenticação Anônima (com retries e sem alert no boot)
// =======================
const auth = getAuth(app);

function loginAnonRetry(maxTentativas = 5) {
  let tentativa = 0;
  return new Promise((resolve, reject) => {
    const tentar = () => {
      signInAnonymously(auth)
        .then((cred) => {
          console.log("✅ Login anônimo ok:", cred.user.uid);
          resolve(cred.user);
        })
        .catch((err) => {
          tentativa++;
          console.warn(
            `⚠️ Falha no login anônimo (tentativa ${tentativa}/${maxTentativas})`,
            err
          );
          if (tentativa < maxTentativas) {
            const atraso = 500 * Math.pow(2, tentativa - 1);
            setTimeout(tentar, atraso);
          } else {
            reject(err);
          }
        });
    };
    tentar();
  });
}

let authReady = new Promise((resolve, reject) => {
  let resolvido = false;

  onAuthStateChanged(auth, (user) => {
    if (user && !resolvido) {
      resolvido = true;
      console.log("🔥 Auth pronta (onAuthStateChanged):", user.uid);
      resolve(user);
    }
  });

  loginAnonRetry()
    .then((user) => {
      if (!resolvido) {
        resolvido = true;
        resolve(user);
      }
    })
    .catch((err) => {
      console.error(
        "❌ Não foi possível autenticar após várias tentativas:",
        err
      );
      reject(err);
    });
});

authReady
  .then(() => console.log("✅ Autenticação disponível"))
  .catch(() =>
    console.warn("Auth ainda não disponível (continuando em modo offline)…")
  );

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
  // ★ Normaliza "S.B" -> "S/B" para casar com o restante do código
  const val = (botao.value || "").trim();
  corSelecionada = val === "S.B" ? "S/B" : val; // ★

  document.querySelectorAll(".btn-cor").forEach((btn) => {
    btn.classList.remove("selecionado");
    if ((btn.value || "").trim() === val) btn.classList.add("selecionado");
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

  // ★ Só exige número quando NÃO for S/B
  if (corSelecionada !== "S/B" && !num) {
    alert("Digite o número do boi.");
    return;
  }

  const novoBoi = {
    peso,
    num: num || "S/B", // ★ se for S/B e sem número, registra "S/B"
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
        <button onclick="editarBoi(this, '${boi.num}', '${boi.cor}')">Editar</button>
        <button onclick="removerBoi('${boi.num}', '${boi.cor}')">Remover</button>
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
    <input type="text" class="edit-obs" value="${boi.obs || ""}" placeholder="Observação" />
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

// ★ Utilitário para formatar a entrada de data (só números -> DD/MM/AAAA)
function formatarDataEntrada(str) {
  if (!str) return str;
  const d = str.replace(/\D/g, ""); // só dígitos
  if (d.length === 8) return d.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
  return str;
}

window.salvarContagem = async function () {
  await authReady; // Garante que está autenticado

  if (Object.keys(boisPorCor).length === 0) {
    alert("Nenhum boi foi adicionado para salvar.");
    return;
  }

  const nome = prompt("Digite o nome da contagem:");
  if (!nome) return;

  // ★ Prompt já com barras; se digitar só números, eu formato.
  let dataEntrada =
    prompt("Digite a data da contagem (DD/MM/AAAA):", "  /  /    ") || "";
  dataEntrada = formatarDataEntrada(dataEntrada);
  if (!dataEntrada || dataEntrada === "  / / ") {
    dataEntrada = new Date().toLocaleDateString("pt-BR");
  }

  try {
    await addDoc(collection(db, "contagens"), {
      nome,
      data: dataEntrada, //  gravando a data formatada
      bois: boisPorCor,
    });
    alert(" Contagem salva com sucesso!");
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
