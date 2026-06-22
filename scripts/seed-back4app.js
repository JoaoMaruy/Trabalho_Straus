/**
 * Seed idempotente para Back4App.
 * Cria usuarios, filmes e avaliacoes que faltam sem apagar dados existentes.
 */
require("dotenv").config();

const repository = require("../repositories/back4appRepository");

const SQL_USUARIOS = [
  {
    nomeCompleto: "j",
    nomeUsuario: "j",
    email: "j@email",
    senha: "j",
    cpf: "1",
  },
  {
    nomeCompleto: "Administrador",
    nomeUsuario: "admin",
    email: "admin@email.com",
    senha: "123",
    cpf: "00000000000",
  },
  {
    nomeCompleto: "usuario",
    nomeUsuario: "usuario",
    email: "user@email",
    senha: "123",
    cpf: "123",
  },
];

const SQL_AVALIACOES = [
  { nomeUsuario: "j", nome_filme: "Filme Indefinido", nota: 10, comentario: "achei o filme bom, so nao gostei do final pq acabei descobrindo a traicao da minha namorada" },
  { nomeUsuario: "j", nome_filme: "Filme Indefinido", nota: 10, comentario: "filme legal" },
  { nomeUsuario: "j", nome_filme: "Filme Indefinido", nota: 0, comentario: "nao gostei, mas o plot twist e bom" },
  { nomeUsuario: "j", nome_filme: "homem aranha", nota: 9, comentario: "foda" },
];

const SQL_FILMES = [
  {
    nome: "Avatar",
    sinopse: "Ser azul e grande que faz guerra com pessoas que usam robos de guerra",
    categoria: "Acao",
    idade: "16",
    imagem: "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkpT6ROScDdf.jpg",
  },
];

const FILMES_EXTRA = [
  { nome: "O Poderoso Chefao", sinopse: "A saga da familia Corleone em Nova York.", categoria: "Crime / Drama", idade: "16", imagem: "https://image.tmdb.org/t/p/w500/rPdtLWNsZmAtoZl9PK7S2wE3qiS.jpg" },
  { nome: "Pulp Fiction", sinopse: "Historias entrelacadas de assassinos e gangsters em Los Angeles.", categoria: "Crime / Drama", idade: "18", imagem: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" },
  { nome: "O Senhor dos Aneis: A Sociedade do Anel", sinopse: "Um hobbit embarca numa jornada para destruir um anel poderoso.", categoria: "Fantasia", idade: "12", imagem: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBd9a1Zy.jpg" },
  { nome: "Matrix", sinopse: "Um hacker descobre que a realidade e uma simulacao.", categoria: "Ficcao Cientifica", idade: "14", imagem: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9xtpdhQcATePo.jpg" },
  { nome: "Interestelar", sinopse: "Astronautas viajam por um buraco de minhoca em busca de um novo lar.", categoria: "Ficcao Cientifica", idade: "10", imagem: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { nome: "Parasita", sinopse: "Uma familia pobre infiltra-se na vida de uma familia rica.", categoria: "Thriller", idade: "16", imagem: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
  { nome: "Coringa", sinopse: "A origem sombria de Arthur Fleck, o Coringa.", categoria: "Drama", idade: "16", imagem: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg" },
  { nome: "Vingadores: Ultimato", sinopse: "Os Vingadores tentam reverter o estalo de Thanos.", categoria: "Acao", idade: "12", imagem: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg" },
  { nome: "Clube da Luta", sinopse: "Um funcionario insone forma um clube de luta clandestino.", categoria: "Drama", idade: "18", imagem: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
  { nome: "A Lista de Schindler", sinopse: "A historia de Oskar Schindler durante o Holocausto.", categoria: "Drama", idade: "16", imagem: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg" },
  { nome: "Gladiador", sinopse: "Um general romano busca vinganca contra o imperador corrupto.", categoria: "Acao", idade: "16", imagem: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nR29wyvoZ.jpg" },
  { nome: "O Iluminado", sinopse: "Um escritor guarda um hotel isolado onde forcas sobrenaturais agem.", categoria: "Terror", idade: "18", imagem: "https://image.tmdb.org/t/p/w500/xazWoLealQwDEVqWulZ5oE6aPjQ.jpg" },
  { nome: "Titanic", sinopse: "Amor entre Jack e Rose a bordo do navio condenado.", categoria: "Romance", idade: "12", imagem: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aAJCOVd.jpg" },
  { nome: "Homem-Aranha: Sem Volta para Casa", sinopse: "Peter Parker abre o multiverso com ajuda do Doutor Estranho.", categoria: "Acao", idade: "12", imagem: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6kCP0qv.jpg" },
  { nome: "homem aranha", sinopse: "As aventuras do amigao da vizinhanca.", categoria: "Acao", idade: "10", imagem: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6kCP0qv.jpg" },
  { nome: "Duna: Parte Dois", sinopse: "Paul Atreides une-se aos Fremen de Arrakis.", categoria: "Ficcao Cientifica", idade: "14", imagem: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlYj2kX2iK0CDqv.jpg" },
  { nome: "Barbie", sinopse: "Barbie questiona sua existencia e vai ao mundo real.", categoria: "Comedia", idade: "10", imagem: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Fbe3ZjSMa.jpg" },
  { nome: "Oppenheimer", sinopse: "A trajetoria do fisico criador da bomba atomica.", categoria: "Drama", idade: "16", imagem: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { nome: "Batman: O Cavaleiro das Trevas", sinopse: "Batman enfrenta o Coringa em Gotham.", categoria: "Acao", idade: "14", imagem: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { nome: "Forrest Gump", sinopse: "A vida extraordinaria de Forrest Gump.", categoria: "Drama", idade: "12", imagem: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd9TdQb.jpg" },
  { nome: "Whiplash", sinopse: "Um baterista enfrenta um instrutor brutal.", categoria: "Drama", idade: "16", imagem: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2Sx8GhfqkP9N.jpg" },
  { nome: "Filme Indefinido", sinopse: "Um filme misterioso que dividiu opinioes.", categoria: "Drama", idade: "14", imagem: "https://placehold.co/360x540/111827/ffffff?text=Filme+Indefinido" },
];

const AVALIACOES_EXTRA = [
  { nomeUsuario: "admin", nome_filme: "O Poderoso Chefao", nota: 9, comentario: "Um classico absoluto do cinema." },
  { nomeUsuario: "admin", nome_filme: "Pulp Fiction", nota: 9, comentario: "Dialogos geniais e narrativa revolucionaria." },
  { nomeUsuario: "usuario", nome_filme: "Matrix", nota: 8, comentario: "Revolucionou os efeitos visuais nos anos 90." },
  { nomeUsuario: "usuario", nome_filme: "Avatar", nota: 7, comentario: "Visualmente incrivel, historia basica." },
  { nomeUsuario: "admin", nome_filme: "Interestelar", nota: 9, comentario: "Emocionante e intelectualmente desafiador." },
  { nomeUsuario: "usuario", nome_filme: "Parasita", nota: 10, comentario: "Oscar merecido. Obra-prima coreana." },
  { nomeUsuario: "admin", nome_filme: "Batman: O Cavaleiro das Trevas", nota: 10, comentario: "O melhor filme de super-heroi ja feito." },
  { nomeUsuario: "usuario", nome_filme: "Oppenheimer", nota: 9, comentario: "Nolan no auge. Murphy extraordinario." },
];

const seed = async ({ silent = false } = {}) => {
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  log("Sincronizando Back4App (schema sistema_filmes)...");

  const userMap = {};
  for (const u of SQL_USUARIOS) {
    const existingUser = await repository.findUserByLogin(u.nomeUsuario);
    const { id_usuario } = existingUser || (await repository.createUser(u));
    userMap[u.nomeUsuario] = id_usuario;
    log(`  usuarios: ${u.nomeUsuario}${existingUser ? " (ja existe)" : " (criado)"}`);
  }

  const allFilmes = [...SQL_FILMES, ...FILMES_EXTRA];
  const existingFilmes = await repository.getAllFilmes();
  const existingFilmeNames = new Set(existingFilmes.map((filme) => filme.nome));
  let filmesCreated = 0;
  for (const f of allFilmes) {
    if (existingFilmeNames.has(f.nome)) continue;
    await repository.createFilme(f);
    filmesCreated++;
  }
  log(`  filmes sincronizados: ${allFilmes.length} (${filmesCreated} criados)`);

  let reviewCount = 0;
  const existingReviews = await repository.getRecentReviews(1);
  if (existingReviews.length > 0) {
    log("  avaliacoes: banco ja possui registros; seed ignorado");
  } else {
    for (const av of [...SQL_AVALIACOES, ...AVALIACOES_EXTRA]) {
      const userId = userMap[av.nomeUsuario];
      if (!userId) continue;
      await repository.createReview({
        userId,
        nome_filme: av.nome_filme,
        nota: av.nota,
        comentario: av.comentario,
      });
      reviewCount++;
    }
    log(`  avaliacoes criadas: ${reviewCount}`);
  }

  log("\nSeed concluido!");
  log("Logins de teste:");
  log("  admin / 123  (ou admin@email.com)");
  log("  usuario / 123  (ou user@email)");
  log("  j / j  (ou j@email)");

  return { skipped: false, reviewsCreated: reviewCount };
};

if (require.main === module) {
  seed().catch((err) => {
    console.error("Falha no seed:", err.message);
    process.exit(1);
  });
}

module.exports = { seed };
