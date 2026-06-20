"""
Script de peuplement - PFA Reclamations.
Execution : .\\venv\\Scripts\\python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, timedelta
from passlib.context import CryptContext
from sqlalchemy.orm import sessionmaker

from backend.app.database import engine
from backend.app.models import Client, Article, Commande, LigneCommande, Livraison

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MOT_DE_PASSE = "Client123!"

# ── VALEURS ENUM EXACTES DE LA BD ────────────────────────────────
# commande.priorite_commande : faible | moyenne | elevee | critique
# commande.statut_commande   : en_preparation | expediee | livree | annulee | retournee
# livraison.statut_livraison : en_preparation | expediee | en_transit | livree
#                              | en_retard | echec_livraison | retournee
# client.type_client         : normal | vip | professionnel

def hp(p):
    return pwd_context.hash(p)

def D(n):
    """Retourne date = today - n jours (n negatif = futur)."""
    return date.today() - timedelta(days=n)

def seed():
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # ── 1. ARTICLES ──────────────────────────────────────────────
        print("Ajout des articles...")
        articles_src = [
            # (nom, categorie, perissable, brisable, fragile)
            ("Smartphone Samsung Galaxy A54", "electronique",  False, False, True),   # 0
            ("Laptop Dell XPS 15",            "electronique",  False, False, True),   # 1
            ("Table en bois massif",           "mobilier",     False, True,  False),  # 2
            ("Chaussures Nike Air Max 270",    "vetements",    False, False, False),  # 3
            ("Medicaments Doliprane x30",      "pharmacie",    True,  False, False),  # 4
            ("Velo electrique Urban Pro",      "sport",        False, True,  True),   # 5
            ("Jus de fruit bio lot 6 btl",    "alimentaire",  True,  True,  False),  # 6
            ("Camera GoPro Hero 11",           "electronique", False, False, True),   # 7
            ("Tapis berbere 200x300",          "decoration",   False, False, False),  # 8
            ("Casque Sony WH-1000XM5",        "electronique", False, False, True),   # 9
            ("Imprimante HP LaserJet Pro",    "electronique", False, True,  True),   # 10
            ("Livre Python 3 Edition complete","librairie",    False, False, False),  # 11
        ]

        articles = []
        for nom, cat, peris, bris, frag in articles_src:
            with db.no_autoflush:
                existing = db.query(Article).filter(Article.nom_article == nom).first()
            if existing:
                articles.append(existing)
            else:
                art = Article(
                    nom_article=nom, categorie_article=cat,
                    est_perissable=peris, est_brisable=bris, est_fragile=frag,
                )
                db.add(art)
                articles.append(art)
        db.flush()
        print(f"  => {len(articles)} articles prets")

        # ── 2. CLIENTS ───────────────────────────────────────────────
        print("Ajout des clients...")
        pwd_hash = hp(MOT_DE_PASSE)

        # (nom, prenom, telephone, email, est_prioritaire, type_client)
        clients_src = [
            ("Benzara",  "Karim",   "0612345678", "karim.benzara@gmail.com",  False, "normal"),  # 0
            ("Oualid",   "Fatima",  "0623456789", "fatima.oualid@gmail.com",  True,  "vip"),     # 1
            ("Chrif",    "Youssef", "0634567890", "youssef.chrif@gmail.com",  False, "normal"),  # 2
            ("Lemaire",  "Sara",    "0645678901", "sara.lemaire@gmail.com",   False, "normal"),  # 3
            ("Ait",      "Mohamed", "0656789012", "mohamed.ait@gmail.com",    True,  "vip"),     # 4
        ]

        clients = []
        for nom, prenom, tel, email, prio, type_c in clients_src:
            with db.no_autoflush:
                existing = db.query(Client).filter(Client.email == email).first()
            if existing:
                print(f"  client {email} deja present")
                clients.append(existing)
                continue
            c = Client(
                nom=nom, prenom=prenom, telephone=tel, email=email,
                mot_de_passe_hash=pwd_hash,
                est_inscrit=True,
                est_prioritaire=prio,
                type_client=type_c,
            )
            db.add(c)
            clients.append(c)
        db.flush()
        print(f"  => {len(clients)} clients prets")

        # ── 3. COMMANDES + LIGNES + LIVRAISONS ───────────────────────
        print("Ajout des commandes...")

        # Chaque ligne :
        # (client_idx, num_cmd, delta_date, statut_cmd, montant, priorite_cmd,
        #  [(art_idx, qte),...],
        #  (num_suivi, statut_liv, transporteur, adresse, exp_delta, prev_delta, reelle_delta))
        #
        # statut_cmd  : en_preparation | expediee | livree | annulee | retournee
        # statut_liv  : en_preparation | expediee | en_transit | livree
        #               | en_retard | echec_livraison | retournee
        # priorite_cmd: faible | moyenne | elevee | critique

        commandes_src = [
            # ── KARIM BENZARA ──────────────────────────────────────
            (0, "CMD-KAR-001", 45, "livree",       1249.99, "elevee",
             [(0, 1), (9, 1)],
             ("TRK-KAR-001", "livree",          "DHL",        "15 Rue de la Paix, Alger",
              43, 40, 38)),

            (0, "CMD-KAR-002", 15, "expediee",      799.50, "moyenne",
             [(1, 1)],
             ("TRK-KAR-002", "en_transit",      "Chronopost", "15 Rue de la Paix, Alger",
              10, -2, None)),

            (0, "CMD-KAR-003", 5, "en_preparation",  89.99, "faible",
             [(11, 3)],
             ("TRK-KAR-003", "en_preparation",  "La Poste",   "15 Rue de la Paix, Alger",
              None, -7, None)),

            # ── FATIMA OUALID (VIP) ────────────────────────────────
            (1, "CMD-FAT-001", 30, "expediee",      349.00, "critique",
             [(4, 2), (11, 1)],
             ("TRK-FAT-001", "en_retard",        "FedEx",      "8 Avenue des Oliviers, Oran",
              25, 20, None)),

            (1, "CMD-FAT-002", 60, "livree",       2150.00, "critique",
             [(5, 1)],
             ("TRK-FAT-002", "livree",           "DHL",        "8 Avenue des Oliviers, Oran",
              57, 55, 53)),

            (1, "CMD-FAT-003", 8, "expediee",        74.99, "faible",
             [(6, 2)],
             ("TRK-FAT-003", "expediee",         "Colissimo",  "8 Avenue des Oliviers, Oran",
              6, -1, None)),

            # ── YOUSSEF CHRIF ─────────────────────────────────────
            (2, "CMD-YOU-001", 20, "expediee",      599.00, "moyenne",
             [(7, 1), (3, 2)],
             ("TRK-YOU-001", "echec_livraison",  "Chronopost", "22 Rue Didouche Mourad, Constantine",
              18, 15, None)),

            (2, "CMD-YOU-002", 50, "livree",        320.00, "moyenne",
             [(2, 1)],
             ("TRK-YOU-002", "livree",           "TNT",        "22 Rue Didouche Mourad, Constantine",
              47, 44, 44)),

            (2, "CMD-YOU-003", 3, "en_preparation", 1599.00, "elevee",
             [(1, 1), (9, 1)],
             ("TRK-YOU-003", "en_preparation",   "DHL",        "22 Rue Didouche Mourad, Constantine",
              None, -5, None)),

            # ── SARA LEMAIRE ──────────────────────────────────────
            (3, "CMD-SAR-001", 10, "expediee",      159.90, "faible",
             [(3, 1), (8, 1)],
             ("TRK-SAR-001", "expediee",         "La Poste",   "5 Blvd Zighoud Youcef, Annaba",
              8, -2, None)),

            (3, "CMD-SAR-002", 90, "livree",       2800.00, "critique",
             [(5, 1), (1, 1)],
             ("TRK-SAR-002", "livree",           "FedEx",      "5 Blvd Zighoud Youcef, Annaba",
              87, 83, 82)),

            (3, "CMD-SAR-003", 2, "en_preparation",  44.99, "faible",
             [(4, 1)],
             ("TRK-SAR-003", "en_preparation",   "Colissimo",  "5 Blvd Zighoud Youcef, Annaba",
              None, -6, None)),

            # ── MOHAMED AIT (VIP) ─────────────────────────────────
            (4, "CMD-MOH-001", 35, "expediee",      990.00, "critique",
             [(10, 1)],
             ("TRK-MOH-001", "en_retard",        "DHL",        "12 Rue Ben Badis, Blida",
              30, 26, None)),

            (4, "CMD-MOH-002", 70, "livree",       1100.00, "moyenne",
             [(0, 1), (7, 1)],
             ("TRK-MOH-002", "livree",           "Chronopost", "12 Rue Ben Badis, Blida",
              67, 64, 63)),

            (4, "CMD-MOH-003", 7, "expediee",       249.90, "moyenne",
             [(6, 3), (4, 1)],
             ("TRK-MOH-003", "en_transit",       "TNT",        "12 Rue Ben Badis, Blida",
              5, -1, None)),
        ]

        added = 0
        for row in commandes_src:
            ci, num, delta, stat_c, montant, prio, arts, liv = row
            with db.no_autoflush:
                if db.query(Commande).filter(Commande.numero_commande == num).first():
                    print(f"  commande {num} deja presente, ignoree")
                    continue

            cmd = Commande(
                numero_commande=num,
                id_client=clients[ci].id_client,
                date_commande=D(delta),
                statut_commande=stat_c,
                montant_total=montant,
                priorite_commande=prio,
            )
            db.add(cmd)
            db.flush()

            for art_idx, qte in arts:
                db.add(LigneCommande(
                    id_commande=cmd.id_commande,
                    id_article=articles[art_idx].id_article,
                    quantite=qte,
                ))

            num_s, stat_l, transport, adresse, exp_d, prev_d, reel_d = liv
            db.add(Livraison(
                id_commande=cmd.id_commande,
                numero_suivi=num_s,
                statut_livraison=stat_l,
                transporteur=transport,
                adresse_livraison=adresse,
                date_expedition=D(exp_d) if exp_d is not None else None,
                date_livraison_prevue=D(prev_d) if prev_d is not None else None,
                date_livraison_reelle=D(reel_d) if reel_d is not None else None,
            ))
            added += 1

        db.commit()

        # ── RESUME ───────────────────────────────────────────────────
        sep = "=" * 60
        print("")
        print(sep)
        print(f"SEED TERMINE  -  {added} commandes ajoutees")
        print(sep)
        print(f"Mot de passe commun pour tous les clients : {MOT_DE_PASSE}")
        print("")
        print("Comptes clients :")
        print("-" * 60)
        resume = [
            ("Karim",   "Benzara",  "karim.benzara@gmail.com",   "0612345678", "normal"),
            ("Fatima",  "Oualid",   "fatima.oualid@gmail.com",   "0623456789", "VIP"),
            ("Youssef", "Chrif",    "youssef.chrif@gmail.com",   "0634567890", "normal"),
            ("Sara",    "Lemaire",  "sara.lemaire@gmail.com",    "0645678901", "normal"),
            ("Mohamed", "Ait",      "mohamed.ait@gmail.com",     "0656789012", "VIP"),
        ]
        for prenom, nom, email, tel, tag in resume:
            print(f"  {prenom:10} {nom:10} | {email}")
            print(f"                       | {tel}  [{tag}]  | 3 commandes")
        print("-" * 60)
        print("")
        print("Scenarios de reclamation suggestifs :")
        print("  Fatima Oualid  -> CMD-FAT-001  medicaments en retard de livraison")
        print("  Youssef Chrif  -> CMD-YOU-001  camera + chaussures echec livraison")
        print("  Mohamed Ait    -> CMD-MOH-001  imprimante en retard depuis 10 jours")
        print("  Karim Benzara  -> CMD-KAR-002  laptop en transit depuis 15 jours")
        print("  Sara Lemaire   -> CMD-SAR-001  tapis en expedition (pas de suivi)")
        print(sep)

    except Exception as e:
        db.rollback()
        print(f"\nERREUR : {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
