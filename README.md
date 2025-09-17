# 🎬 Mood-Based Explore

Discover movies by **mood**.
Swipe vertically through titles, give a quick 👍 or 👎, and instantly see your feed evolve. Each choice sharpens your personal **24-mood profile**, shown as live chips at the top. Curious to fine-tune? Open the **Adjust view** and tweak all moods with sliders to generate a fresh, fully personalized set.

👉 Built for the [Qdrant Hackathon 2025](https://try.qdrant.tech/hackathon-2025), this project blends vector search with an intuitive, playful UX.

---

## ✨ Features

- **Vertical exploration**: endless feed of movies to discover.
- **Like / Dislike feedback**: every action reshapes the recommendation feed in real time.
- **Mood chips**: see your dominant moods grow as you swipe.
- **Adjust with sliders**: fine-tune all 24 moods for a complete regenerated result.
- **Powered by Qdrant**: recommendations and mood profiles are vectors in the same space.

---

## 📖 How it Works

1. **Seed movies**: fetch a batch from [The Movie DB](https://www.themoviedb.org/), embed them, and upsert into Qdrant.
2. **Seed moods**: define 24 moods (see `data/moods.json`), embed them, and store them as reference vectors.
3. **User exploration**:
   - Swipe vertically to keep exploring.
   - Like/dislike updates the profile and fetches new recommendations.
   - Chips show the top moods influencing results.
4. **Slider adjustment**: open the Adjust panel to directly edit mood scores and run a full profile-based search.

---

## 🚀 Demo

- Live demo: _still working on this_
- Video walkthrough: [View from Dropbox](https://www.dropbox.com/scl/fi/q3a3y65d6u04zdjbgh13j/moodswipe_roy_schut.mov?rlkey=prfciiyjrca3d2eewgk46thvl&st=ll5s64zq&dl=0)

---

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org) — frontend & API routes
- [Qdrant](https://qdrant.tech) — vector search engine
- [Payload CMS](https://payloadcms.com) — content management
- [MongoDB](https://www.mongodb.com/) — database for Payload

---

## ⚡ Quick Start (Docker)

```bash
git clone https://github.com/royschut/recommender.git
cd mood-explore

cp .env.example .env     # fill in values
docker compose up -d     # starts Qdrant, Payload (Mongo), and the app

```
