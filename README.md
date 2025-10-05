# 🎵 Crne ploče

Aplikacija za upravljanje ličnom kolekcijom vinila sa automatskim preuzimanjem podataka sa Discogs-a.

## ✨ Karakteristike

- **Automatsko preuzimanje podataka** - Unesite samo Discogs ID ploče, svi podaci se automatski preuzimaju
- **Histogram distribucije** - Vizuelni prikaz zastupljenosti albuma po godinama izdanja
- **Responsive dizajn** - Prilagođen za desktop i mobilne uređaje
- **Detaljan prikaz** - Kompletne informacije o svakoj ploči (izvođači, žanr, tracklista, itd.)
- **Sortiranje po godini** - Ploče su poređane od najstarijih ka najmlađim izdanjima

## 🚀 Instalacija

1. Klonirajte repozitorijum:
```bash
git clone https://github.com/cukovicmilos/crne-ploce.git
cd crne-ploce
```

2. Konfigurišite Discogs API:
   - Registrujte se na [Discogs](https://www.discogs.com)
   - Kreirajte aplikaciju i dobijte API token
   - Dodajte token u `config.php`

3. Pokrenite aplikaciju na web serveru (Apache/Nginx sa PHP podrškom)

## 📖 Kako koristiti

1. **Dodavanje ploče**:
   - Pronađite ploču na Discogs.com
   - Kopirajte ID iz URL-a (npr. za `https://www.discogs.com/release/123456`, ID je `123456`)
   - Unesite ID u polje za pretragu i kliknite "Dodaj Ploču"

2. **Pregled detalja**:
   - Kliknite na bilo koju ploču u kolekciji za detaljan prikaz

3. **Brisanje ploče**:
   - Otvorite detalje ploče i kliknite "Obriši ploču"

## 🛠️ Tehnologije

- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Backend**: PHP
- **Skladištenje podataka**: JSON fajlovi
- **API**: Discogs API
- **Styling**: Custom CSS sa gradijentima i animacijama

## 📊 Histogram

Aplikacija prikazuje histogram u header-u koji pokazuje:
- Distribuciju albuma po godinama
- Trendove u kolekciji
- Periode intenzivnije produkcije

## 🎨 Dizajn

- Tamna tema sa gradijentima
- Kartica za svaku ploču sa cover slikom
- Smooth animacije i hover efekti
- Modalni prikaz za detalje

## 📝 Licenca

MIT License

## 👤 Autor

Miloš Cuković

## 🤝 Doprinos

Pull request-ovi su dobrodošli! Za veće izmene, prvo otvorite issue da diskutujemo šta biste želeli da promenite.
