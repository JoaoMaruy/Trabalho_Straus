CREATE DATABASE IF NOT EXISTS `sistema_filmes`;
USE `sistema_filmes`;

DROP TABLE IF EXISTS `avaliacoes`;
DROP TABLE IF EXISTS `filmes`;
DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(150) NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `filmes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `sinopse` TEXT NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `idade` VARCHAR(50) NOT NULL,
  `imagem` VARCHAR(255) DEFAULT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `avaliacoes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT NOT NULL,
  `titulo_filme` VARCHAR(255) NOT NULL,
  `nota` DECIMAL(3,1) NOT NULL,
  `comentario` TEXT NOT NULL,
  `imagem` VARCHAR(255) DEFAULT NULL,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_avaliacoes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `avaliacoes_nota_check` CHECK (`nota` >= 0 AND `nota` <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`nome`, `email`, `senha`) VALUES
  ('Administrador', 'admin@cine.review', '$2a$10$B94W2MSE1QWnFsAcWCmdbOoowIw9j1uKnxwxK1KxGc1OsZys2TtBm');

INSERT INTO `filmes` (`nome`, `sinopse`, `categoria`, `idade`, `imagem`) VALUES
  ('O Poderoso Chefão', 'A complexa história da família Corleone, onde honra e crime se misturam em cada decisão.', 'Crime', '16', 'https://image.tmdb.org/t/p/w500/rPdtLWNsZmAtoZl9PK7S2wE3qiS.jpg'),
  ('Um Sonho de Liberdade', 'Dois homens encontram redenção e amizade dentro de uma prisão implacável.', 'Drama', '14', 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'),
  ('A Origem', 'Um ladrão que invade sonhos enfrenta um último trabalho para plantar uma ideia impossível.', 'Ficção', '12', 'https://image.tmdb.org/t/p/w500/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg'),
  ('Gladiador', 'Um general traído busca justiça e liberdade na arena mais perigosa de Roma.', 'Ação', '14', 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg'),
  ('Interestelar', 'Viagem épica por buracos de minhoca em busca de um novo lar para a humanidade.', 'Ficção', '12', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),
  ('Parasita', 'Uma família pobre invade a vida de uma família rica e desencadeia um caos imprevisível.', 'Suspense', '16', 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),
  ('Mad Max: Estrada da Fúria', 'A corrida alucinante pelo deserto com cenas de ação contínuas e visuais arrebatadores.', 'Ação', '16', 'https://image.tmdb.org/t/p/w500/kqjL17yufvn9OVLyXYpvtyrFfak.jpg'),
  ('Coringa', 'A origem sombria do personagem que corrompe uma sociedade já à beira do abismo.', 'Drama', '18', 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg'),
  ('Casablanca', 'Um romance atemporal entre antiga paixão e escolhas difíceis em meio à guerra.', 'Clássico', '12', 'https://image.tmdb.org/t/p/w500/aJC2F4e8aR4STXh2HxE4tiN6sMw.jpg'),
  ('O Senhor dos Anéis: A Sociedade do Anel', 'Uma jornada fantástica para destruir um anel capaz de condenar o mundo.', 'Fantasia', '12', 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg'),
  ('Pulp Fiction', 'Histórias entrelaçadas de crime, humor e violência em uma Los Angeles estilizada.', 'Crime', '16', 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg'),
  ('Titanic', 'Amor proibido a bordo do navio mais famoso da história, antes do desastre inevitável.', 'Romance', '12', 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg'),
  ('O Silêncio dos Inocentes', 'Um confronto psicológico entre uma agente do FBI e um serial killer manipulado.', 'Suspense', '16', 'https://image.tmdb.org/t/p/w500/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg'),
  ('O Rei Leão', 'Uma fábula emocionantes sobre responsabilidade, perda e o ciclo da vida.', 'Animação', '10', 'https://image.tmdb.org/t/p/w500/2bXbqYdUdNVa8VIWXVfclP2ICtT.jpg'),
  ('Matrix', 'A descoberta de uma realidade simulada muda para sempre o destino de Neo.', 'Ficção', '14', 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'),
  ('A Viagem de Chihiro', 'Uma jovem atravessa um mundo mágico e precisa resgatar seus pais transformados em porcos.', 'Animação', '10', 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'),
  ('Forrest Gump', 'Uma vida extraordinária contada com simplicidade, emoção e um bom humor doce.', 'Drama', '12', 'https://image.tmdb.org/t/p/w500/h5J4W4veyxMXDMJEKNsvzVpZCfy.jpg'),
  ('O Labirinto do Fauno', 'Fantasia sombria e política se entrelaçam na Espanha pós-guerra.', 'Fantasia', '16', 'https://image.tmdb.org/t/p/w500/4VdJzg4c0x6cQ8hK0DxlzWy6QD.jpg'),
  ('De Volta para o Futuro', 'A aventura no tempo que mistura humor, ação e um carro muito famoso.', 'Aventura', '10', 'https://image.tmdb.org/t/p/w500/pTpxQB1N0waaSc3OSn0e9oc8kx9.jpg'),
  ('A Chegada', 'Contato com alienígenas que desafia a linguagem e a própria percepção do tempo.', 'Ficção', '12', 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg');

INSERT INTO `avaliacoes` (`usuario_id`, `titulo_filme`, `nota`, `comentario`, `imagem`) VALUES
  (1, 'O Poderoso Chefão', 9.8, 'Um épico de poder, família e escolhas dolorosas. A direção e o elenco formam um conjunto perfeito.', 'https://image.tmdb.org/t/p/w500/rPdtLWNsZmAtoZl9PK7S2wE3qiS.jpg'),
  (1, 'Um Sonho de Liberdade', 9.7, 'História comovente de esperança e amizade que permanece relevante e inspiradora.', 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'),
  (1, 'A Origem', 9.1, 'A cada camada de sonho a trama cresce em tensão e criatividade. Visualmente impressionante.', 'https://image.tmdb.org/t/p/w500/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg'),
  (1, 'Gladiador', 9.0, 'A batalha pela honra do herói é emocionante e a atmosfera de Roma é grandiosa.', 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg'),
  (1, 'Interestelar', 9.2, 'Uma viagem emocionante que mistura ciência e coração em uma escala épica.', 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),
  (1, 'Parasita', 9.3, 'Suspense social afiado, reviravoltas brilhantes e humor negro de primeira.', 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),
  (1, 'Mad Max: Estrada da Fúria', 8.9, 'Adrenalina pura com cenas de ação ininterruptas e estética impressionante.', 'https://image.tmdb.org/t/p/w500/kqjL17yufvn9OVLyXYpvtyrFfak.jpg'),
  (1, 'Coringa', 8.7, 'Intenso e perturbador, apresenta uma performance central inesquecível.', 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg'),
  (1, 'Casablanca', 9.5, 'Romance clássico com diálogos memoráveis e um final de deixar saudade.', 'https://image.tmdb.org/t/p/w500/aJC2F4e8aR4STXh2HxE4tiN6sMw.jpg'),
  (1, 'O Senhor dos Anéis: A Sociedade do Anel', 9.4, 'A melhor combinação de aventura, emoção e mundo fantástico já vista no cinema.', 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg'),
  (1, 'Pulp Fiction', 9.0, 'Histórias entrelaçadas com ritmo, estilo e diálogos que se tornaram icônicos.', 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg'),
  (1, 'Titanic', 8.8, 'Drama romântico grandioso e emocionante, com um dos desfechos mais conhecidos do cinema.', 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg'),
  (1, 'O Silêncio dos Inocentes', 9.1, 'Tenso e magistral, com uma química perturbadora entre os personagens.', 'https://image.tmdb.org/t/p/w500/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg'),
  (1, 'O Rei Leão', 8.6, 'Um espetáculo emocional que encanta crianças e adultos com sua trilha e personagens.', 'https://image.tmdb.org/t/p/w500/2bXbqYdUdNVa8VIWXVfclP2ICtT.jpg'),
  (1, 'Matrix', 9.0, 'Revolucionário e impactante, definiu uma geração e ainda surpreende hoje.', 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'),
  (1, 'A Viagem de Chihiro', 9.3, 'Encantador, inventivo e com uma sensibilidade rara em animação.', 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'),
  (1, 'Forrest Gump', 9.0, 'Uma narrativa doce, emocional e inesquecível sobre uma vida extraordinária.', 'https://image.tmdb.org/t/p/w500/h5J4W4veyxMXDMJEKNsvzVpZCfy.jpg'),
  (1, 'O Labirinto do Fauno', 8.8, 'Fantasia sombria e bela, com uma atmosfera única e marcante.', 'https://image.tmdb.org/t/p/w500/4VdJzg4c0x6cQ8hK0DxlzWy6QD.jpg'),
  (1, 'De Volta para o Futuro', 8.9, 'Diversão perfeita, com viagem no tempo e personagens carismáticos.', 'https://image.tmdb.org/t/p/w500/pTpxQB1N0waaSc3OSn0e9oc8kx9.jpg'),
  (1, 'A Chegada', 8.7, 'Sensível e inteligente, uma ficção científica que fala sobre comunicação e empatia.', 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg');
