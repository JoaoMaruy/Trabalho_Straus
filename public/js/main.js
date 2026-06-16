const API_PORT = "3000";

const getApiBaseUrl = () => {
  const { protocol, hostname, port } = window.location;
  if (port === API_PORT) return window.location.origin;
  if (protocol === "file:") return `http://localhost:${API_PORT}`;
  return `${protocol}//${hostname}:${API_PORT}`;
};

const API_BASE_URL = getApiBaseUrl();

const PLACEHOLDER_POSTER =
  "https://placehold.co/360x540/111827/ffffff?text=Sem+Capa";
const PLACEHOLDER_AVATAR =
  "https://placehold.co/120x120/1a2540/9aa5c1?text=%3F";

const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const apiRequest = async (url, options = {}) => {
  const fetchOptions = {
    credentials: "include",
    ...options,
  };

  if (options.body && !(options.body instanceof FormData)) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      "Content-Type": "application/json",
    };
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE_URL}${url}`, fetchOptions);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Falha na requisição.");
  }
  return data;
};

const formatDate = (createdAt) =>
  new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const movieUrl = (nome) =>
  `filme.html?nome=${encodeURIComponent(nome)}`;

const userUrl = (id) => `usuario.html?id=${encodeURIComponent(id)}`;

const ratingColor = (nota) => {
  const n = Number(nota);
  if (n >= 8) return "rating-high";
  if (n >= 6) return "rating-mid";
  return "rating-low";
};

const renderStars = (nota) => {
  const n = Number(nota) / 2;
  const full = Math.floor(n);
  const half = n - full >= 0.5;
  let stars = "";
  for (let i = 0; i < 5; i++) {
    if (i < full) stars += "★";
    else if (i === full && half) stars += "½";
    else stars += "☆";
  }
  return stars;
};

const getCurrentUser = async () => {
  const data = await apiRequest("/api/usuario");
  return data.usuario || null;
};

const loadHeader = async () => {
  try {
    const user = await getCurrentUser();
    renderNav(user);
    return user;
  } catch {
    renderNav(null);
    return null;
  }
};

const renderNav = (user) => {
  const actions = document.getElementById("user-actions");
  if (!actions) return;

  if (user) {
    const avatar = user.foto_perfil || PLACEHOLDER_AVATAR;
    actions.innerHTML = `
      <a href="perfil.html" class="nav-user">
        <img src="${escapeHtml(avatar)}" alt="" class="nav-avatar" onerror="this.src='${PLACEHOLDER_AVATAR}'" />
        <span>Olá, <strong>${escapeHtml(user.nomeCompleto)}</strong></span>
      </a>
      <button type="button" class="btn-secondary" id="logout-btn">Sair</button>
    `;
    document.getElementById("logout-btn")?.addEventListener("click", async () => {
      try {
        await apiRequest("/api/logout", { method: "POST" });
      } catch (error) {
        console.error(error);
      }
      window.location.href = "index.html";
    });
  } else {
    actions.innerHTML = `
      <a class="btn-secondary" href="login.html">Entrar</a>
      <a class="btn-primary" href="cadastro.html">Cadastrar</a>
    `;
  }
};

const renderReviewCards = (reviews, targetId, { linkMovie = true } = {}) => {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = reviews
    .map((review) => {
      const poster = review.imagem || PLACEHOLDER_POSTER;
      const rating = Number(review.nota) || 0;
      const author = review.nomeCompleto || "Anônimo";
      const nomeFilme = review.nome_filme;
      const titleLink = linkMovie
        ? `<a href="${movieUrl(nomeFilme)}" class="movie-title-link">${escapeHtml(nomeFilme)}</a>`
        : `<h3>${escapeHtml(nomeFilme)}</h3>`;
      const authorLink = review.id_usuario
        ? `<a href="${userUrl(review.id_usuario)}" class="author-link">${escapeHtml(author)}</a>`
        : `<strong>${escapeHtml(author)}</strong>`;

      return `
      <article class="movie-card" data-review-id="${escapeHtml(review.id_avaliacao)}">
        <a href="${movieUrl(nomeFilme)}" class="poster-link">
          <div class="poster-box">
            <img src="${escapeHtml(poster)}" alt="Poster de ${escapeHtml(nomeFilme)}" loading="lazy" onerror="this.src='${PLACEHOLDER_POSTER}'" />
            <span class="rating-badge ${ratingColor(rating)}">⭐ ${rating}</span>
          </div>
        </a>
        <div class="movie-card-content">
          <div class="movie-card-header">
            ${titleLink}
            <span class="review-date">${formatDate(review.criado_em)}</span>
          </div>
          <p class="movie-comment">${escapeHtml(review.comentario)}</p>
          <p class="movie-author">Avaliado por ${authorLink}</p>
          <a href="${movieUrl(nomeFilme)}" class="btn-link">Ver detalhes do filme →</a>
        </div>
      </article>
    `;
    })
    .join("");
};

const renderMovieGrid = (filmes, targetId) => {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = filmes
    .map((filme) => {
      const poster = filme.imagem || PLACEHOLDER_POSTER;
      const rating = Number(filme.media) || 0;
      return `
      <a href="${movieUrl(filme.nome)}" class="catalog-card">
        <div class="catalog-poster">
          <img src="${escapeHtml(poster)}" alt="${escapeHtml(filme.nome)}" loading="lazy" onerror="this.src='${PLACEHOLDER_POSTER}'" />
          <span class="rating-badge ${ratingColor(rating)}">${rating > 0 ? rating.toFixed(1) : "—"}</span>
        </div>
        <div class="catalog-info">
          <h3>${escapeHtml(filme.nome)}</h3>
          <p class="catalog-meta">${filme.categoria ? escapeHtml(filme.categoria) : ""}${filme.idade ? " · " + escapeHtml(filme.idade) + "+" : ""}</p>
          <p class="catalog-reviews">${filme.total_avaliacoes} avaliação(ões)</p>
        </div>
      </a>
    `;
    })
    .join("");
};

const renderScoreBars = (distribuicao, total) => {
  const labels = { 5: "9-10", 4: "7-8", 3: "5-6", 2: "3-4", 1: "0-2" };
  return [5, 4, 3, 2, 1]
    .map((bucket) => {
      const count = distribuicao[bucket] || 0;
      const pct = total ? Math.round((count / total) * 100) : 0;
      return `
      <div class="score-bar-row">
        <span class="score-bar-label">${labels[bucket]}</span>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${pct}%"></div></div>
        <span class="score-bar-count">${count}</span>
      </div>
    `;
    })
    .join("");
};

const renderReviewList = (reviews, targetId) => {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = reviews
    .map((review) => {
      const avatar = review.usuario_foto || PLACEHOLDER_AVATAR;
      const rating = Number(review.nota) || 0;
      const authorLink = review.id_usuario
        ? `<a href="${userUrl(review.id_usuario)}" class="review-author-block">
            <img src="${escapeHtml(avatar)}" alt="" class="review-avatar" onerror="this.src='${PLACEHOLDER_AVATAR}'" />
            <div>
              <strong>${escapeHtml(review.nomeCompleto)}</strong>
              <span>${formatDate(review.criado_em)}</span>
            </div>
          </a>`
        : `<div class="review-author-block">
            <img src="${PLACEHOLDER_AVATAR}" alt="" class="review-avatar" />
            <div><strong>${escapeHtml(review.nomeCompleto || "Anônimo")}</strong></div>
          </div>`;

      return `
      <article class="review-item">
        <div class="review-item-header">
          ${authorLink}
          <div class="review-score ${ratingColor(rating)}">
            <span class="review-score-num">${rating}</span>
            <span class="review-stars">${renderStars(rating)}</span>
          </div>
        </div>
        <p class="review-item-text">${escapeHtml(review.comentario)}</p>
      </article>
    `;
    })
    .join("");
};

const showMessage = (container, message, type = "info") => {
  if (!container) return;
  container.textContent = message;
  container.className = `form-message ${type}`;
};

const redirectIfAuthenticated = async () => {
  const user = await getCurrentUser();
  if (user) window.location.href = "index.html";
  return user;
};

const redirectIfNotAuthenticated = async () => {
  const user = await getCurrentUser();
  if (!user) {
    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.href = `login.html?return=${returnTo}`;
  }
  return user;
};

const getQueryParam = (key) => new URLSearchParams(window.location.search).get(key);

const submitReview = async (form) => {
  const formData = new FormData(form);
  const res = await fetch(`${API_BASE_URL}/api/avaliar`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Falha ao enviar avaliação.");
  return data;
};
