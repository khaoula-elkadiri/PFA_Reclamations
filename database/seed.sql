USE pfa_reclamations;

INSERT INTO service (nom_service, description)
VALUES
('Transport', 'Gestion des problèmes de transport et livraison'),
('Qualite', 'Gestion des problèmes de qualité produit'),
('Stock', 'Gestion des articles manquants et stock'),
('Preparation', 'Gestion des erreurs de picking et préparation'),
('Service Client', 'Gestion des cas complexes et support client');

INSERT INTO agent (
    id_service,
    nom,
    prenom,
    email,
    role,
    disponible
)
VALUES
(1, 'Karim', 'Yassine', 'yassine.transport@gmail.com', 'agent_transport', TRUE),

(2, 'Amine', 'Salma', 'salma.qualite@gmail.com', 'agent_qualite', TRUE),

(3, 'Nadir', 'Omar', 'omar.stock@gmail.com', 'agent_stock', TRUE),

(4, 'Hassan', 'Meryem', 'meryem.preparation@gmail.com', 'agent_service_client', TRUE),

(5, 'Bennani', 'Sara', 'sara.client@gmail.com', 'responsable_logistique', TRUE);


INSERT INTO client (
    nom,
    prenom,
    telephone,
    email,
    est_prioritaire,
    type_client
)
VALUES
('Alawi', 'Hamid', '0612345678', 'alawi123hamid@gmail.com', TRUE, 'vip'),

('Karimi', 'Sofia', '0623456789', 'sofia.karimi@gmail.com', FALSE, 'normal'),

('Nassiri', 'Youssef', '0634567890', 'youssef.n@gmail.com', TRUE, 'professionnel');


INSERT INTO article (
    nom_article,
    categorie_article,
    est_perissable,
    est_brisable,
    est_fragile
)
VALUES
('Medicaments', 'Sante', TRUE, FALSE, TRUE),

('Produits soin', 'Cosmetique', FALSE, TRUE, TRUE),

('Ordinateur portable', 'Electronique', FALSE, TRUE, TRUE),

('Produits alimentaires', 'Alimentaire', TRUE, FALSE, FALSE);

INSERT INTO commande (
    numero_commande,
    id_client,
    date_commande,
    statut_commande,
    montant_total,
    priorite_commande
)
VALUES
('CMD001', 1, '2026-05-01', 'livree', 1200.00, 'critique'),

('CMD002', 2, '2026-05-03', 'expediee', 300.00, 'moyenne'),

('CMD003', 3, '2026-05-05', 'en_preparation', 5000.00, 'elevee');


INSERT INTO ligne_commande (
    id_commande,
    id_article,
    quantite
)
VALUES
(1, 1, 3),
(1, 2, 2),

(2, 3, 1),

(3, 4, 10);


INSERT INTO livraison (
    id_commande,
    numero_suivi,
    statut_livraison,
    transporteur,
    adresse_livraison,
    date_expedition,
    date_livraison_prevue,
    date_livraison_reelle
)
VALUES
(
    1,
    'TRK001',
    'en_retard',
    'DHL',
    'Casablanca, Maroc',
    '2026-05-02',
    '2026-05-04',
    NULL
),

(
    2,
    'TRK002',
    'en_transit',
    'Amana',
    'Rabat, Maroc',
    '2026-05-04',
    '2026-05-07',
    NULL
),

(
    3,
    'TRK003',
    'en_preparation',
    'Chronopost',
    'Marrakech, Maroc',
    NULL,
    '2026-05-10',
    NULL
);

INSERT INTO reclamation (
    id_commande,
    id_client,
    description,
    statut_reclamation,
    classification_detectee,
    priorite_detectee,
    score_priorite,
    score_confiance,
    est_complexe,
    service_destinataire
)
VALUES

(
    1,
    1,
    'J’ai reçu mes médicaments avec beaucoup de retard et certains produits sont abîmés.',
    'en_analyse',
    'probleme_transport',
    'critique',
    90,
    95.50,
    FALSE,
    'Transport'
),

(
    2,
    2,
    'J’ai reçu un ordinateur différent de celui commandé.',
    'affectee',
    'erreur_picking',
    'elevee',
    75,
    89.00,
    FALSE,
    'Preparation'
),

(
    3,
    3,
    'La commande n’est toujours pas arrivée et je ne comprends pas le suivi.',
    'en_attente',
    'probleme_livraison',
    'moyenne',
    55,
    60.00,
    TRUE,
    'Service Client'
);

INSERT INTO affectation_reclamation (
    id_reclamation,
    id_agent,
    statut_affectation,
    commentaire
)
VALUES

(
    1,
    1,
    'en_cours',
    'Traitement urgent transport'
),

(
    2,
    4,
    'affectee',
    'Erreur de preparation detectee'
),

(
    3,
    5,
    'affectee',
    'Cas complexe a analyser'
);

INSERT INTO notification (
    id_client,
    id_reclamation,
    message,
    type_notification
)
VALUES

(
    1,
    1,
    'Votre réclamation est en cours de traitement prioritaire.',
    'alerte'
),

(
    2,
    2,
    'Votre réclamation a été transférée au service préparation.',
    'mise_a_jour'
),

(
    3,
    3,
    'Votre réclamation nécessite une vérification complémentaire.',
    'information'
);

INSERT INTO historique_statut (
    id_reclamation,
    ancien_statut,
    nouveau_statut,
    commentaire
)
VALUES

(
    1,
    'en_attente',
    'en_analyse',
    'Analyse automatique démarrée'
),

(
    2,
    'en_analyse',
    'affectee',
    'Réclamation envoyée au service préparation'
),

(
    3,
    'en_attente',
    'en_attente',
    'Cas complexe détecté'
);