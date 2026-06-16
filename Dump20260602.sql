CREATE DATABASE IF NOT EXISTS `sistema_filmes`
  /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */
  /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sistema_filmes`;

-- ------------------------------------------------------
-- Table structure for table `usuarios`
-- ------------------------------------------------------
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

-- ------------------------------------------------------
-- Table structure for table `avaliacoes`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `avaliacoes`;
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

-- ------------------------------------------------------
-- Table structure for table `filmes`
-- ------------------------------------------------------
DROP TABLE IF EXISTS `filmes`;
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

-- ------------------------------------------------------
-- Optional sample data for initial tests
-- ------------------------------------------------------
INSERT INTO `usuarios` (`nome`, `email`, `senha`) VALUES
  ('Administrador', 'admin@cine.review', '$2a$10$7WHPuh/Iqeu0t5jD1I7sKeS48zUMaXkBgM7DkOYmD9LWvK4v9DMsO');

INSERT INTO `filmes` (`nome`, `sinopse`, `categoria`, `idade`, `imagem`) VALUES
  ('Avatar: O Caminho da Água', 'Uma aventura visual em um mundo alienígena cheio de criaturas e conflitos.', 'Ação', '12', 'https://image.tmdb.org/t/p/w500/8t78hRIBQ3WgQe6uD8rKlDAMA4p.jpg');

INSERT INTO `avaliacoes` (`usuario_id`, `titulo_filme`, `nota`, `comentario`, `imagem`) VALUES
  (1, 'Avatar: O Caminho da Água', 9.0, 'Experiência visual incrível e enredo emocionante.', 'https://image.tmdb.org/t/p/w500/8t78hRIBQ3WgQe6uD8rKlDAMA4p.jpg');
