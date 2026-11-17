# DUNDAL® — présentation web

Présentation en ligne du dossier de validation d'entreprise **DUNDAL®** (Rokia Sissoko, Vitalis Naturel, OWLA Cohorte 3) :
*accompagner la continuité de la supplémentation pendant la grossesse, avec des plantes d'Afrique de l'Ouest.*

Site 100 % statique : un fichier HTML, une feuille de style, un script, sans dépendance externe ni étape de compilation.

## Utilisation

| Action | Clavier / geste |
|---|---|
| Diapositive suivante | `→`, `Espace`, `Page suivante`, balayage vers la gauche |
| Diapositive précédente | `←`, `Page précédente`, balayage vers la droite |
| Première / dernière | `Début` / `Fin` |
| Plein écran | `F` |
| Aller à une diapositive | ajouter `#/7` à l'adresse (par exemple) |

La diapositive 2 contient le film de 34 secondes (bouton « Voir le film »). Les diapositives 12 et 13 sont interactives
(cascade d'un pot à l'échelle ou au petit lot ; simulateur du nombre de cures par cliente).

## Structure

```
index.html                  les 21 diapositives
assets/css/deck.css         mise en forme et animations
assets/js/deck.js           navigation, compteurs, graphiques interactifs
assets/img/                 visuel produit, détourages (WebP), affiche du film
assets/media/dundal-film.mp4  film de présentation (1080p, 34 s)
assets/fonts/               police Inter (licence SIL OFL, voir LICENSE-Inter.txt)
```

## Tester en local

```bash
cd dundal
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

## Déployer sur le VPS (nginx)

```bash
# 1. Récupérer le dépôt
sudo mkdir -p /var/www && cd /var/www
sudo git clone https://github.com/msangare-ml/dundal.git
sudo chown -R www-data:www-data /var/www/dundal

# 2. Créer le site nginx
sudo tee /etc/nginx/sites-available/dundal >/dev/null <<'NGINX'
server {
    listen 80;
    server_name dundal.example.com;          # remplacer par votre domaine ou l'IP du VPS
    root /var/www/dundal;
    index index.html;

    location / { try_files $uri $uri/ =404; }
    location ~ /\.git { deny all; }           # ne jamais servir l'historique git

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public";
    }
    location ~* \.mp4$ { mp4; expires 30d; }  # lecture progressive de la vidéo

    gzip on;
    gzip_types text/css application/javascript image/svg+xml;
}
NGINX
sudo ln -s /etc/nginx/sites-available/dundal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. HTTPS (si un domaine pointe vers le VPS)
sudo certbot --nginx -d dundal.example.com
```

Mise à jour après une modification poussée sur GitHub :

```bash
cd /var/www/dundal && sudo -u www-data git pull
```

> Si le module `mp4` n'est pas disponible dans votre build nginx, supprimez la ligne `location ~* \.mp4$` : la vidéo restera lisible.

## Notes

- La musique du film est une composition originale de kora synthétisée, libre de droits. Pour utiliser un autre morceau,
  remplacez `assets/media/dundal-film.mp4` en gardant le même nom, **et seulement si vous en détenez les droits de diffusion** :
  ce dépôt est public.
- Les chiffres proviennent du *Dossier de validation d'entreprise DUNDAL®, version finale du 16 novembre 2026*.
  Les montants sont en FCFA ; les hypothèses non encore vérifiées sont signalées comme telles dans les diapositives.
