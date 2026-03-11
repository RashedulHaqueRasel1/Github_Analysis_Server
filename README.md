# GitHub Analysis Server

A Node.js/Express backend service designed to fetch comprehensive GitHub profile data and generate an AI-powered professional summary of a developer's portfolio.

## 🚀 Features

- **GitHub Profile Fetching:** Retrieves user details, followers, and public repository statistics.
- **Contribution Analysis:** Uses GitHub's GraphQL API to fetch daily and yearly contributions.
- **Streak Calculation:** Custom algorithm to determine current and longest contribution streaks.
- **Repository Insights:** Collects data on the user's public repositories including stars, forks, and primary languages.
- **AI-Powered Developer Summary:** Integrates with the [Bytez.js API](https://bytez.com/) (using `openai/gpt-4.1-nano`) to generate a professional, recruiter-ready summary based on the developer's GitHub activity.

## 🛠️ Tech Stack

- **Framework:** Express.js
- **API Requests:** cross-fetch
- **AI Integration:** Bytez.js
- **Other:** CORS, dotenv

## ⚙️ Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd github_analysis_server
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following required variables:

   ```env
   PORT=5000
   BYTEZ_API_KEY=your_bytez_api_key
   GITHUB_TOKEN=your_github_personal_access_token
   ```

   _Note: Generating a GitHub Token requires `read:user` and `repo` access scopes for complete functionality._

4. **Run the server**:
   - For development (with nodemon):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

## 📡 API Endpoints

### `POST /github`

Fetches and analyzes a GitHub user's profile.

**Request Body:**

```json
{
  "username": "octocat"
}
```

**Response (Shortened Example):**

```json
{
  "user": {
    "profile": {
      "name": "The Octocat",
      "username": "octocat"
    },
    ...
  },
  "aiDescription": "Based on the developer data, The Octocat is a consistent and highly active contributor..."
}
```

---

## 🧑‍💻 Author

**Rashedul Haque Rasel**

📧 [rashedulhaquerasel1@gmail.com](mailto:rashedulhaquerasel1@gmail.com) | 🌐 [Portfolio](https://rashedul-haque-rasel.vercel.app/)

_Built with ❤️ using Node.js, Express, and Bytez.js._
