# 🎬 Film Recommender met AI Search

Een film database applicatie gebouwd met Payload CMS, Next.js, en AI-powered zoekfunctionaliteit via embeddings.

## 🏗️ Architectuur

### **Frontend Routes**

- `/` - Homepage met navigatie
- `/search` - AI-powered film zoeken
- `/database-admin` - Database beheer interface

### **Payload CMS**

- `/admin` - Payload admin interface
- `/admin/api/imports?pages=X` - Film import via TMDB API
- `/admin/api/embeddings` - AI embeddings genereren

### **Collections**

- **Movies** - Film database met TMDB data
- **Media** - Geüploade afbeeldingen (posters)
- **Users** - Admin gebruikers

## 🔧 Componenten

### **Payload Handlers** (`src/app/handlers/`)

- `importsHandler.ts` - Import films van TMDB API
- `embeddingsHandler.ts` - Genereer AI embeddings voor films

### **Next.js API Routes** (`src/app/api/`)

- `search/route.ts` - AI-powered film zoeken via Qdrant

### **Frontend Pages** (`src/app/(frontend)/`)

- `page.tsx` - Homepage
- `search/page.tsx` - Zoek interface
- `database-admin/page.tsx` - Admin interface

## 🚀 Workflow

### **1. Film Import**

```
TMDB API → Payload Handler → Movies Collection + Media Collection
```

- Haalt populaire films op van The Movie Database
- Download posters automatisch
- Configureerbaar aantal pagina's

### **2. Embeddings Generatie**

```
Movies → OpenAI Embeddings → Qdrant Vector Database
```

- Genereert AI embeddings voor titel, beschrijving, genres
- Slaat op in Qdrant voor similarity search

### **3. AI Search**

```
User Query → OpenAI Embedding → Qdrant Search → Movie Results
```

- Converteert zoekterm naar embedding
- Vindt vergelijkbare films via vector search

## 🛠️ Dependencies

### **Core**

- **Payload CMS** - Content management
- **Next.js 15** - React framework
- **MongoDB** - Database via Mongoose

### **AI & Search**

- **OpenAI** - Text embeddings (text-embedding-3-small)
- **Qdrant** - Vector database voor similarity search

### **External APIs**

- **TMDB API** - Film data en afbeeldingen

## ⚙️ Environment Variables

```env
# Database
DATABASE_URI=mongodb://localhost:27017/recommender
PAYLOAD_SECRET=your-secret-key

# APIs
MOVIE_DB_API_KEY=your-tmdb-api-key
OPEN_AI_API_KEY=your-openai-api-key

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key
```

## 🎯 Features

- ✅ **Film Import** - Bulk import van TMDB met configureerbaar aantal pagina's
- ✅ **AI Embeddings** - Automatische embedding generatie voor alle films
- ✅ **Semantic Search** - Zoek films op betekenis, niet alleen keywords
- ✅ **Poster Management** - Automatische download en opslag van filmposters
- ✅ **Admin Interface** - Eenvoudige beheer interface voor imports
- ✅ **Clean Architecture** - Scheiding tussen Payload CMS en custom logic

## 🔄 Gebruik

1. **Setup Environment** - Configureer alle API keys
2. **Start Services** - MongoDB, Qdrant, Next.js dev server
3. **Import Films** - Ga naar `/database-admin`, kies aantal pagina's, import
4. **Generate Embeddings** - Klik "Embeddings genereren" na import
5. **Search Films** - Ga naar `/search` en zoek met natuurlijke taal

## 📁 Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Frontend routes
│   │   ├── page.tsx         # Homepage
│   │   ├── search/          # AI search interface
│   │   └── database-admin/  # Admin interface
│   ├── (payload)/           # Payload CMS routes
│   ├── api/                 # Next.js API routes
│   │   └── search/          # Search endpoint
│   └── handlers/            # Payload custom handlers
├── collections/             # Payload collections schema
└── payload.config.ts        # Payload configuration
```

## 🧠 AI Search Logic

De AI search werkt via semantic similarity:

1. **Input**: "spannende sci-fi film over ruimte"
2. **Embedding**: OpenAI converteert naar 1536-dimensionale vector
3. **Search**: Qdrant vindt films met vergelijkbare embeddings
4. **Output**: Films gerangschikt op similarity score

Dit maakt zoeken mogelijk op concepten en betekenis in plaats van alleen exacte keywords.
