const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");
const Bytez = require("bytez.js");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* -------------------- */
/* AI Setup */
/* -------------------- */

const key = process.env.BYTEZ_API_KEY;

console.log(key)

if (!key) {
  console.error("BYTEZ_API_KEY not found");
  process.exit(1);
}

const sdk = new Bytez(key);
const model = sdk.model("openai/gpt-4.1-nano");

/* -------------------- */
/* Axios Instance */
/* -------------------- */

const githubAPI = axios.create({
  baseURL: "https://api.github.com",
  timeout: 30000,
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "User-Agent": "github-analyzer",
  },
});

/* -------------------- */
/* Streak Calculator */
/* -------------------- */

function calculateStreaks(days) {
  days.sort((a, b) => new Date(a.date) - new Date(b.date));

  let longest = 0;
  let temp = 0;

  days.forEach((day) => {
    if (day.contributions > 0) {
      temp++;
      longest = Math.max(longest, temp);
    } else {
      temp = 0;
    }
  });

  let current = 0;

  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributions > 0) current++;
    else break;
  }

  return {
    longestStreak: longest,
    currentStreak: current,
  };
}

/* -------------------- */
/* GitHub Analyzer API */
/* -------------------- */

app.post("/github", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res
        .status(400)
        .json({ status: false, message: "username required" });
    }

    /* -------------------- */
    /* GitHub Profile */
    /* -------------------- */

    const userRes = await githubAPI.get(`/users/${username}`);
    const userData = userRes.data;

    const startYear = new Date(userData.created_at).getFullYear();
    const currentYear = new Date().getFullYear();

    const yearlyContributions = {};
    const dailyContributions = [];

    /* -------------------- */
    /* Contributions per year */
    /* -------------------- */

    for (let year = startYear; year <= currentYear; year++) {
      const from = `${year}-01-01T00:00:00Z`;
      const to = `${year}-12-31T23:59:59Z`;

      const gqlRes = await githubAPI.post("/graphql", {
        query: `
        query {
          user(login: "${username}") {
            contributionsCollection(from: "${from}", to: "${to}") {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
        `,
      });

      const gqlData = gqlRes.data;

      if (!gqlData?.data?.user?.contributionsCollection) {
        yearlyContributions[year] = 0;
        continue;
      }

      const calendar =
        gqlData.data.user.contributionsCollection.contributionCalendar;

      yearlyContributions[year] = calendar.totalContributions || 0;

      const weeks = calendar.weeks || [];

      weeks.forEach((week) => {
        week.contributionDays.forEach((day) => {
          dailyContributions.push({
            date: day.date,
            contributions: day.contributionCount,
          });
        });
      });
    }

    const streakData = calculateStreaks(dailyContributions);

    /* -------------------- */
    /* Fetch Repositories */
    /* -------------------- */

    const reposRes = await githubAPI.get(
      `/users/${username}/repos?per_page=100&sort=updated`
    );

    const reposData = reposRes.data;

    const repos = reposData.map((repo) => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      repoUrl: repo.html_url,
    }));

    /* -------------------- */
    /* Final User Object */
    /* -------------------- */

    const user = {
      profile: {
        name: userData.name,
        username: userData.login,
        avatar: userData.avatar_url,
        bio: userData.bio,
        location: userData.location,
        company: userData.company,
        website: userData.blog,
        githubProfile: userData.html_url,
      },
      stats: {
        followers: userData.followers,
        following: userData.following,
        publicRepos: userData.public_repos,
        publicGists: userData.public_gists,
        ...yearlyContributions,
        totalContributions: Object.values(yearlyContributions).reduce(
          (a, b) => a + b,
          0
        ),
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
      },
      dailyContributions,
      repos,
    };

    /* -------------------- */
    /* AI Summary */
    /* -------------------- */

    let aiDescription = "";

    try {
      const result = await model.run([
        {
          role: "user",
          content: `
You are a GitHub portfolio analyst.

Analyze this developer data:

Name: ${user.profile.name}
Username: ${user.profile.username}
Bio: ${user.profile.bio}
Followers: ${user.stats.followers}
Public Repos: ${user.stats.publicRepos}
Total Contributions: ${user.stats.totalContributions}
Current Streak: ${user.stats.currentStreak}
Longest Streak: ${user.stats.longestStreak}

Repositories:
${JSON.stringify(repos.slice(0, 20))}

Generate a professional recruiter-ready summary.
`,
        },
      ]);
console.log(result)
      aiDescription =
        result?.output?.content?.trim() ||
        result?.output?.[0]?.content?.trim() ||
        "";
    } catch (err) {
      console.warn("AI error:", err.message);
    }

    res.json({
      status: true,
      user,
      aiDescription,
    });
  } catch (err) {
    console.error("Server error:", err.message);

    res.status(500).json({
      status: false,
      error: err.message,
    });
  }
});

/* -------------------- */

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});