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

## 🧭 The Philosophy

Vector search is powerful—but often a **black box**. You feel the results shift, yet you don’t see **how** to steer.
This project uses **textual vectors** (moods) as human handles on that space:

- **Human words as vectors.** Moods are embeddings you can push/pull against—clear, nameable directions inside a multi-dimensional space.
- **Nuance over checkboxes.** Instead of rigid, boolean filters, you can lean toward ideas (_warmer, calmer, weirder_) with **degrees**, not on/off.
- **User-defined “filters.”** Because filters are just vectors, users can mint their own (a phrase, a vibe, a micro-genre) and blend them in.
- **Transparent steering.** Chips, subtle adjustments, and directional swipes expose how your query vector moves—no wizardry, just guided exploration.

Bottom line: keep the raw power of vector search, but give it an **intuitive, linguistic interface** that invites play and precision.

---

## ⚡ Quick Start (Docker)

```bash
git clone https://github.com/royschut/recommender.git
cd recommender

cp .env.example .env     # fill in values
docker compose up -d     # starts Qdrant, Payload (Mongo), and the app
```

---

## 📥 Importing & Data Round-Trip

This repo supports fast, deterministic imports that match the exporters.
Grab the artifacts from the latest GitHub Release and run **three** imports: moods, movies, and the Qdrant snapshot.

```bash
# 1) Download vector and metadata artifacts
curl -L https://github.com/royschut/recommender/releases/latest/download/moods.json  -o data/moods.json
curl -L https://github.com/royschut/recommender/releases/latest/download/movies.json  -o data/movies.json
curl -L https://github.com/royschut/recommender/releases/latest/download/movie-embeddings.snapshot -o data/movie-embeddings.snapshot

# 2) Import into Payload (rebuilds collections from JSON)
curl -X POST http://localhost:3000/api/import/payload-moods
curl -X POST http://localhost:3000/api/import/payload-movies

# 3) Import Qdrant snapshot (streams TAR to Qdrant)
curl -X POST http://localhost:3000/api/import/qdrant \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/data/movie-embeddings.snapshot
```

That’s it. No mounts, no extra env—just download and run the three commands.

## 🚀 Demo

- Live demo: _still working on this_
- Video walkthrough: [View from Dropbox](https://www.dropbox.com/scl/fi/q3a3y65d6u04zdjbgh13j/moodswipe_roy_schut.mov?rlkey=prfciiyjrca3d2eewgk46thvl&st=ll5s64zq&dl=0)

## 📖 How it Works

1. **Seed movies**: fetch a batch from [The Movie DB](https://www.themoviedb.org/), embed them, and upsert into Qdrant.
2. **Seed moods**: define 24 moods (see `data/moods.json`), embed them, and store them as reference vectors.
3. **User exploration**:
   - Swipe vertically to keep exploring.
   - Like/dislike updates the profile and fetches new recommendations.
   - Chips show the top moods influencing results.
4. **Slider adjustment**: open the Adjust panel to directly edit mood scores and run a full profile-based search.

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org) — frontend & API routes
- [Qdrant](https://qdrant.tech) — vector search engine
- [Payload CMS](https://payloadcms.com) — content management
- [MongoDB](https://www.mongodb.com/) — database for Payload

## 🗺️ Roadmap (sketch)

- **Mood Dial (wheel instead of sliders)**
  Radial control that lets you lean toward 2–3 moods at once; tap/hold to reveal close alternatives.
- **User-generated moods & queries**
  Let users add their own labels or paste a sentence (“cozy neon noir, low-tempo”); embed on the fly and blend in.
- **Horizontal swipes for deeper vector navigation**
  Left/right reveals the two strongest mood directions for the current title; swiping shifts your query along that axis.
- **Multi-hop exploration**
  Chain small mood shifts to “walk” the space; show a minimal breadcrumb to step back.
- **Lightweight facts & affordances**
  Tiny icons for practical signals (e.g., duration/decade), only when contextually helpful—never clutter.

```

```
