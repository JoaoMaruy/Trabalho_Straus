const API_BASE_URL =
  window.location.port === "5500"
    ? "http://localhost:3000"
    : window.location.origin;

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

const getCurrentUser = async () => {
  const data = await apiRequest("/api/usuario");
  return data.usuario || null;
};

const loadHeader = async () => {
  try {
    const user = await getCurrentUser();
    renderNav(user);
    return user;
  } catch (error) {
    renderNav(null);
    return null;
  }
};

const renderNav = (user) => {
  const actions = document.getElementById("user-actions");
  if (!actions) return;

  if (user) {
    actions.innerHTML = `
      <span class="user-label">Olá, <strong>${user.nome}</strong></span>
      <button type="button" class="btn-secondary" id="logout-btn">Sair</button>
    `;
    document
      .getElementById("logout-btn")
      .addEventListener("click", async () => {
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

const renderReviewCards = (reviews, targetId) => {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = reviews
    .map((review) => {
      const poster =
        review.imagem ||
        "https://placehold.co/360x540/111827/ffffff?text=Sem+Capa";
      const rating = Number(review.nota) || 0;
      const author = review.nome || "Anônimo";
      return `
      <article class="movie-card">
        <div class="poster-box">
          <img src="${poster}" alt="Poster de ${review.titulo_filme}" onerror="this.src='https://placehold.co/360x540/111827/ffffff?text=Sem+Capa'" />
          <span class="rating-badge">⭐ ${rating.toFixed(1)}</span>
        </div>
        <div class="movie-card-content">
          <div class="movie-card-header">
            <h3>${review.titulo_filme}</h3>
            <span>${formatDate(review.criado_em)}</span>
          </div>
          <p class="movie-comment">${review.comentario}</p>
          <p class="movie-author">Avaliado por <strong>${author}</strong></p>
        </div>
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
  if (!user) window.location.href = "login.html";
  return user;
};
