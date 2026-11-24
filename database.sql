create database if not exists db_aule_studio;
use db_aule_studio;

describe utenti;

create table if not exists aule(
	id int auto_increment primary key,
    nome varchar(100) not null,
    capienza int not null,
    ubicazione varchar(150) not null
);

create table if not exists prenotazioni(
id int auto_increment primary key,
utente_email varchar(100) not null,
aula_id int not null,
data_prenotazione date not null,
fascia_oraria varchar(50) not null,
foreign key(aula_id) references aule(id) on delete cascade
);

create table if not exists utenti(
id int auto_increment primary key,
nome varchar(100) NOT NULL,
email varchar(100),
pw varchar(255) not null,
ruolo varchar(50) default 'studente'
);

insert into aule (nome, capienza, ubicazione) values 
('Aula Magna Polo Scientifico', 120, 'Piano Terra - Edificio A'),
('Aula Studio Informatica 1', 30, 'Primo Piano - Edificio B'),
('Sala Lettura Biblioteca Centrale', 50, 'Secondo Piano - Polo Centrale');

insert into utenti (nome, email, pw, ruolo)
 VALUES ('Marco Verdi', 'marcoverdi@uni.it', 'password123', 'studente'),
 ('Giovanni Bianchi', 'giovannibianchi@uni.itaule', 'password345', 'studente');	
 

DELETE FROM aule WHERE id > 3;

SELECT * FROM utenti;

INSERT INTO aule (nome, capienza, ubicazione) VALUES
  ('Aula Magna Polo Scientifico', 120, 'Piano Terra - Edificio A'),
  ('Aula Studio Informatica 1', 30, 'Primo Piano - Edificio B'),
  ('Sala Lettura Biblioteca Centrale', 50, 'Secondo Piano - Polo Centrale'),
  ('Aula Gruppi Studio 3', 15, 'Piano Terra - Edificio D');
  
  INSERT INTO aule (nome, capienza, ubicazione)
VALUES ('Aula Gruppi Studio 3', 15, 'Piano Terra - Edificio D');
  
  SELECT * FROM aule;

DELETE FROM aule WHERE id > 4;

  SELECT * FROM prenotazioni;



