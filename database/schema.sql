CREATE DATABASE IF NOT EXISTS pfa_reclamations;
USE pfa_reclamations;

CREATE TABLE client (
    id_client INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    est_prioritaire BOOLEAN DEFAULT FALSE,
    type_client ENUM('normal', 'vip', 'professionnel') DEFAULT 'normal',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE commande (
    id_commande INT AUTO_INCREMENT PRIMARY KEY,
    numero_commande VARCHAR(50) NOT NULL UNIQUE,
    id_client INT NOT NULL,
    date_commande DATE NOT NULL,
    statut_commande ENUM('en_preparation', 'expediee', 'livree', 'annulee', 'retournee') DEFAULT 'en_preparation',
    montant_total DECIMAL(10,2) DEFAULT 0,
    priorite_commande ENUM('faible', 'moyenne', 'elevee', 'critique') DEFAULT 'faible',

    FOREIGN KEY (id_client) REFERENCES client(id_client)
);

CREATE TABLE article (
    id_article INT AUTO_INCREMENT PRIMARY KEY,
    nom_article VARCHAR(150) NOT NULL,
    categorie_article VARCHAR(100),
    est_perissable BOOLEAN DEFAULT FALSE,
    est_brisable BOOLEAN DEFAULT FALSE,
    est_fragile BOOLEAN DEFAULT FALSE
);

CREATE TABLE ligne_commande (
    id_ligne INT AUTO_INCREMENT PRIMARY KEY,
    id_commande INT NOT NULL,
    id_article INT NOT NULL,
    quantite INT NOT NULL DEFAULT 1,

    FOREIGN KEY (id_commande) REFERENCES commande(id_commande),
    FOREIGN KEY (id_article) REFERENCES article(id_article)
); 

CREATE TABLE livraison (
    id_livraison INT AUTO_INCREMENT PRIMARY KEY,
    id_commande INT NOT NULL,
    numero_suivi VARCHAR(100) UNIQUE NOT NULL,

    statut_livraison ENUM(
        'en_preparation',
        'expediee',
        'en_transit',
        'livree',
        'en_retard',
        'echec_livraison',
        'retournee'
    ) DEFAULT 'en_preparation',

    transporteur VARCHAR(100),
    adresse_livraison TEXT,

    date_expedition DATE,
    date_livraison_prevue DATE,
    date_livraison_reelle DATE,

    FOREIGN KEY (id_commande) REFERENCES commande(id_commande)
);

CREATE TABLE reclamation (
    id_reclamation INT AUTO_INCREMENT PRIMARY KEY,

    id_commande INT NOT NULL,
    id_client INT NOT NULL,

    description TEXT NOT NULL,

    statut_reclamation ENUM(
        'en_attente',
        'en_analyse',
        'affectee',
        'en_traitement',
        'resolue',
        'fermee'
    ) DEFAULT 'en_attente',

    classification_detectee ENUM(
        'probleme_livraison',
        'probleme_transport',
        'probleme_qualite',
        'erreur_picking',
        'article_manquant',
        'produit_brise',
        'autre'
    ) DEFAULT 'autre',

    priorite_detectee ENUM(
        'faible',
        'moyenne',
        'elevee',
        'critique'
    ) DEFAULT 'faible',

    score_priorite INT DEFAULT 0,

    score_confiance DECIMAL(5,2) DEFAULT 0,

    est_complexe BOOLEAN DEFAULT FALSE,

    service_destinataire VARCHAR(100),

    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    date_traitement TIMESTAMP NULL,

    FOREIGN KEY (id_commande) REFERENCES commande(id_commande),

    FOREIGN KEY (id_client) REFERENCES client(id_client)
);

CREATE TABLE service (
    id_service INT AUTO_INCREMENT PRIMARY KEY,

    nom_service VARCHAR(100) NOT NULL,

    description TEXT
);

CREATE TABLE agent (
    id_agent INT AUTO_INCREMENT PRIMARY KEY,

    id_service INT NOT NULL,

    nom VARCHAR(100) NOT NULL,

    prenom VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE,

    role ENUM(
        'agent_service_client',
        'agent_transport',
        'agent_qualite',
        'agent_stock',
        'responsable_logistique'
    ) DEFAULT 'agent_service_client',

    disponible BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (id_service) REFERENCES service(id_service)
);

CREATE TABLE affectation_reclamation (
    id_affectation INT AUTO_INCREMENT PRIMARY KEY,

    id_reclamation INT NOT NULL,

    id_agent INT NOT NULL,

    date_affectation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    statut_affectation ENUM(
        'affectee',
        'en_cours',
        'terminee',
        'transferee'
    ) DEFAULT 'affectee',

    commentaire TEXT,

    FOREIGN KEY (id_reclamation) REFERENCES reclamation(id_reclamation),

    FOREIGN KEY (id_agent) REFERENCES agent(id_agent)
);

CREATE TABLE notification (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,

    id_client INT NOT NULL,

    id_reclamation INT NOT NULL,

    message TEXT NOT NULL,

    type_notification ENUM(
        'information',
        'alerte',
        'mise_a_jour',
        'resolution'
    ) DEFAULT 'information',

    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_client) REFERENCES client(id_client),

    FOREIGN KEY (id_reclamation) REFERENCES reclamation(id_reclamation)
);

CREATE TABLE historique_statut (
    id_historique INT AUTO_INCREMENT PRIMARY KEY,

    id_reclamation INT NOT NULL,

    ancien_statut VARCHAR(100),

    nouveau_statut VARCHAR(100),

    commentaire TEXT,

    date_changement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_reclamation) REFERENCES reclamation(id_reclamation)
);