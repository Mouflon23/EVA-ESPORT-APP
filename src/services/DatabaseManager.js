import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

class DatabaseManager {
  static db = null;

  static async init() {
    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      return "web";
    } else {
      // Sur mobile, on utilise SQLite
      if (!this.db) {
        this.db = await SQLite.openDatabaseAsync("eva_ligue_locale.db");
        await this.createTables();
      }
      return this.db;
    }
  }

  static async createTables() {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on initialise AsyncStorage
      return;
    } else {
      // Sur mobile, on crée les tables SQLite
      // Table des équipes
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          captain TEXT NOT NULL,
          division INTEGER NOT NULL,
          playerCount INTEGER NOT NULL,
          players TEXT NOT NULL,
          points INTEGER DEFAULT 0,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL
        );
      `);

      // Table des matchs
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team1Id INTEGER NOT NULL,
          team2Id INTEGER NOT NULL,
          team1 TEXT NOT NULL,
          team2 TEXT NOT NULL,
          score1 INTEGER NOT NULL,
          score2 INTEGER NOT NULL,
          winnerId INTEGER NOT NULL,
          winner TEXT NOT NULL,
          date TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (team1Id) REFERENCES teams (id),
          FOREIGN KEY (team2Id) REFERENCES teams (id),
          FOREIGN KEY (winnerId) REFERENCES teams (id)
        );
      `);

      // Migration pour ajouter les nouvelles colonnes
      try {
        await db.execAsync(
          `ALTER TABLE matches ADD COLUMN team1Division INTEGER DEFAULT 1;`
        );
      } catch (error) {
        // Colonne existe déjà, ignorer l'erreur
      }

      try {
        await db.execAsync(
          `ALTER TABLE matches ADD COLUMN team2Division INTEGER DEFAULT 1;`
        );
      } catch (error) {
        // Colonne existe déjà, ignorer l'erreur
      }

      try {
        await db.execAsync(
          `ALTER TABLE matches ADD COLUMN matchOrder INTEGER DEFAULT 1;`
        );
      } catch (error) {
        // Colonne existe déjà, ignorer l'erreur
      }

      try {
        await db.execAsync(
          `ALTER TABLE matches ADD COLUMN map TEXT DEFAULT '';`
        );
      } catch (error) {
        // Colonne existe déjà, ignorer l'erreur
      }

      // Vérifier si les colonnes existent, sinon recréer la table
      try {
        // Essayer de sélectionner les nouvelles colonnes
        await db.getFirstAsync(
          `SELECT team1Division, team2Division, matchOrder, map FROM matches LIMIT 1`
        );
        console.log("Table matches avec le nouveau schéma détectée");
      } catch (error) {
        console.log("Ancien schéma détecté, recréation de la table matches...");
        await this.recreateMatchesTable();
      }

      // Table des promotions/rétrogradations
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS promotions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          teamId INTEGER NOT NULL,
          teamName TEXT NOT NULL,
          fromDivision INTEGER NOT NULL,
          toDivision INTEGER NOT NULL,
          type TEXT NOT NULL,
          reason TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (teamId) REFERENCES teams (id)
        );
      `);
    }
  }

  // Méthodes pour les équipes
  static async addTeam(teamData) {
    const db = await this.init();
    const { name, captain, division, players } = teamData;
    const playerCount = players.length;
    const createdAt = new Date().toISOString();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const teams = await this.getAllTeams();
      const newTeam = {
        id: Date.now(), // ID temporaire basé sur timestamp
        name,
        captain,
        division,
        playerCount,
        players,
        points: 0,
        wins: 0,
        losses: 0,
        createdAt,
      };
      teams.push(newTeam);
      await AsyncStorage.setItem("teams", JSON.stringify(teams));
      return newTeam.id;
    } else {
      // Sur mobile, on utilise SQLite
      const result = await db.runAsync(
        `INSERT INTO teams (name, captain, division, playerCount, players, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          name,
          captain,
          division,
          playerCount,
          JSON.stringify(players),
          createdAt,
        ]
      );
      return result.lastInsertRowId;
    }
  }

  static async getAllTeams() {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const teamsData = await AsyncStorage.getItem("teams");
      const teams = teamsData ? JSON.parse(teamsData) : [];
      return teams.sort((a, b) => {
        if (a.division !== b.division) return a.division - b.division;
        if (b.points !== a.points) return b.points - a.points;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Sur mobile, on utilise SQLite
      const result = await db.getAllAsync(
        `SELECT * FROM teams ORDER BY division, points DESC, name`
      );
      return result.map((team) => ({
        ...team,
        players: JSON.parse(team.players),
      }));
    }
  }

  static async getTeams() {
    return this.getAllTeams();
  }

  static async getTeamsByDivision(division) {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const teams = await this.getAllTeams();
      return teams.filter((team) => team.division === division);
    } else {
      // Sur mobile, on utilise SQLite
      const result = await db.getAllAsync(
        `SELECT * FROM teams WHERE division = ? ORDER BY points DESC, name`,
        [division]
      );
      return result.map((team) => ({
        ...team,
        players: JSON.parse(team.players),
      }));
    }
  }

  static async getTeamById(id) {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const teams = await this.getAllTeams();
      return teams.find((team) => team.id === id) || null;
    } else {
      // Sur mobile, on utilise SQLite
      const result = await db.getFirstAsync(
        `SELECT * FROM teams WHERE id = ?`,
        [id]
      );

      if (result) {
        return {
          ...result,
          players: JSON.parse(result.players),
        };
      }
      return null;
    }
  }

  static async updateTeam(teamData) {
    const db = await this.init();
    const { id, name, captain, division, playerCount, players } = teamData;

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const teams = await this.getAllTeams();
      const teamIndex = teams.findIndex((team) => team.id === id);
      if (teamIndex !== -1) {
        teams[teamIndex] = {
          ...teams[teamIndex],
          name,
          captain,
          division,
          playerCount,
          players,
        };
        await AsyncStorage.setItem("teams", JSON.stringify(teams));
      }
    } else {
      // Sur mobile, on utilise SQLite
      await db.runAsync(
        `UPDATE teams SET name = ?, captain = ?, division = ?, playerCount = ?, players = ? WHERE id = ?`,
        [name, captain, division, playerCount, JSON.stringify(players), id]
      );
    }
  }

  static async updateTeamStats(teamId, points, wins, losses) {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const teams = await this.getAllTeams();
      const teamIndex = teams.findIndex((team) => team.id === teamId);
      if (teamIndex !== -1) {
        teams[teamIndex].points = points;
        teams[teamIndex].wins = wins;
        teams[teamIndex].losses = losses;
        await AsyncStorage.setItem("teams", JSON.stringify(teams));
      }
    } else {
      // Sur mobile, on utilise SQLite
      await db.runAsync(
        `UPDATE teams SET points = ?, wins = ?, losses = ? WHERE id = ?`,
        [points, wins, losses, teamId]
      );
    }
  }

  static async deleteTeam(id) {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const teams = await this.getAllTeams();
      const filteredTeams = teams.filter((team) => team.id !== id);
      await AsyncStorage.setItem("teams", JSON.stringify(filteredTeams));
    } else {
      // Sur mobile, on utilise SQLite
      await db.runAsync(`DELETE FROM teams WHERE id = ?`, [id]);
    }
  }

  // Méthodes pour les matchs
  static async addMatch(matchData) {
    const db = await this.init();
    const {
      team1Id,
      team2Id,
      team1,
      team2,
      team1Division,
      team2Division,
      matchOrder,
      map,
      score1,
      score2,
      winnerId,
      winner,
      date,
    } = matchData;
    const createdAt = new Date().toISOString();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const matches = await this.getAllMatches();
      const newMatch = {
        id: Date.now(),
        team1Id,
        team2Id,
        team1,
        team2,
        team1Division,
        team2Division,
        matchOrder,
        map,
        score1,
        score2,
        winnerId,
        winner,
        date,
        createdAt,
      };
      matches.push(newMatch);
      await AsyncStorage.setItem("matches", JSON.stringify(matches));
      console.log("Match ajouté dans AsyncStorage:", newMatch.id);
      return newMatch.id;
    } else {
      // Sur mobile, on utilise SQLite
      const result = await db.runAsync(
        `INSERT INTO matches (team1Id, team2Id, team1, team2, team1Division, team2Division, matchOrder, map, score1, score2, winnerId, winner, date, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          team1Id,
          team2Id,
          team1,
          team2,
          team1Division,
          team2Division,
          matchOrder,
          map,
          score1,
          score2,
          winnerId,
          winner,
          date,
          createdAt,
        ]
      );
      console.log("Match ajouté dans SQLite:", result.lastInsertRowId);
      return result.lastInsertRowId;
    }
  }

  static async getAllMatches() {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const matchesData = await AsyncStorage.getItem("matches");
      const matches = matchesData ? JSON.parse(matchesData) : [];
      console.log("Matches chargés depuis AsyncStorage:", matches.length);
      return matches.sort((a, b) => {
        if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      // Sur mobile, on utilise SQLite
      try {
        const result = await db.getAllAsync(
          `SELECT * FROM matches ORDER BY date DESC, createdAt DESC`
        );
        console.log("Matches chargés depuis SQLite:", result.length);
        return result;
      } catch (error) {
        console.error("Erreur lors du chargement des matchs:", error);
        return [];
      }
    }
  }

  static async getMatches() {
    return this.getAllMatches();
  }

  static async getMatchesByTeam(teamId) {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const matches = await this.getAllMatches();
      return matches.filter(
        (match) => match.team1Id === teamId || match.team2Id === teamId
      );
    } else {
      // Sur mobile, on utilise SQLite
      const result = await db.getAllAsync(
        `SELECT * FROM matches WHERE team1Id = ? OR team2Id = ? ORDER BY date DESC`,
        [teamId, teamId]
      );
      return result;
    }
  }

  static async deleteMatch(id) {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const matches = await this.getAllMatches();
      const filteredMatches = matches.filter((match) => match.id !== id);
      await AsyncStorage.setItem("matches", JSON.stringify(filteredMatches));
    } else {
      // Sur mobile, on utilise SQLite
      await db.runAsync(`DELETE FROM matches WHERE id = ?`, [id]);
    }
  }

  static async updateMatch(matchData) {
    const db = await this.init();
    const {
      id,
      team1Id,
      team2Id,
      team1,
      team2,
      team1Division,
      team2Division,
      matchOrder,
      map,
      score1,
      score2,
      winnerId,
      winner,
      date,
    } = matchData;

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const matches = await this.getAllMatches();
      const matchIndex = matches.findIndex((match) => match.id === id);
      if (matchIndex !== -1) {
        matches[matchIndex] = {
          ...matches[matchIndex],
          team1Id,
          team2Id,
          team1,
          team2,
          team1Division,
          team2Division,
          matchOrder,
          map,
          score1,
          score2,
          winnerId,
          winner,
          date,
        };
        await AsyncStorage.setItem("matches", JSON.stringify(matches));
      }
    } else {
      // Sur mobile, on utilise SQLite
      await db.runAsync(
        `UPDATE matches SET
         team1Id = ?, team2Id = ?, team1 = ?, team2 = ?,
         team1Division = ?, team2Division = ?, matchOrder = ?,
         map = ?, score1 = ?, score2 = ?, winnerId = ?,
         winner = ?, date = ?
         WHERE id = ?`,
        [
          team1Id,
          team2Id,
          team1,
          team2,
          team1Division,
          team2Division,
          matchOrder,
          map,
          score1,
          score2,
          winnerId,
          winner,
          date,
          id,
        ]
      );
    }
  }

  // Méthodes pour les promotions
  static async addPromotion(promotionData) {
    const db = await this.init();
    const { teamId, teamName, fromDivision, toDivision, type, reason } =
      promotionData;
    const createdAt = new Date().toISOString();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const promotions = await this.getAllPromotions();
      const newPromotion = {
        id: Date.now(),
        teamId,
        teamName,
        fromDivision,
        toDivision,
        type,
        reason,
        createdAt,
      };
      promotions.push(newPromotion);
      await AsyncStorage.setItem("promotions", JSON.stringify(promotions));
      return newPromotion.id;
    } else {
      // Sur mobile, on utilise SQLite
      const result = await db.runAsync(
        `INSERT INTO promotions (teamId, teamName, fromDivision, toDivision, type, reason, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [teamId, teamName, fromDivision, toDivision, type, reason, createdAt]
      );
      return result.lastInsertRowId;
    }
  }

  static async getAllPromotions() {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const promotionsData = await AsyncStorage.getItem("promotions");
      const promotions = promotionsData ? JSON.parse(promotionsData) : [];
      return promotions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else {
      // Sur mobile, on utilise SQLite
      return await db.getAllAsync(
        `SELECT * FROM promotions ORDER BY createdAt DESC`
      );
    }
  }

  static async deletePromotion(id) {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const promotions = await this.getAllPromotions();
      const filteredPromotions = promotions.filter(
        (promotion) => promotion.id !== id
      );
      await AsyncStorage.setItem(
        "promotions",
        JSON.stringify(filteredPromotions)
      );
    } else {
      // Sur mobile, on utilise SQLite
      await db.runAsync(`DELETE FROM promotions WHERE id = ?`, [id]);
    }
  }

  // Méthodes utilitaires
  static async getStats() {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      const teams = await this.getAllTeams();
      const matches = await this.getAllMatches();

      const divisionsCount = { 1: 0, 2: 0, 3: 0, 4: 0 };
      teams.forEach((team) => {
        divisionsCount[team.division] =
          (divisionsCount[team.division] || 0) + 1;
      });

      return {
        totalTeams: teams.length,
        totalMatches: matches.length,
        divisions: Object.entries(divisionsCount).map(([division, count]) => ({
          division: parseInt(division),
          count,
        })),
      };
    } else {
      // Sur mobile, on utilise SQLite
      const teamsResult = await db.getFirstAsync(
        `SELECT COUNT(*) as totalTeams FROM teams`
      );
      const matchesResult = await db.getFirstAsync(
        `SELECT COUNT(*) as totalMatches FROM matches`
      );

      const divisionsResult = await db.getAllAsync(
        `SELECT division, COUNT(*) as count FROM teams GROUP BY division ORDER BY division`
      );

      return {
        totalTeams: teamsResult.totalTeams,
        totalMatches: matchesResult.totalMatches,
        divisions: divisionsResult,
      };
    }
  }

  static async resetDatabase() {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, on utilise AsyncStorage
      await AsyncStorage.removeItem("teams");
      await AsyncStorage.removeItem("matches");
      await AsyncStorage.removeItem("promotions");
    } else {
      // Sur mobile, on utilise SQLite
      await db.execAsync(`DELETE FROM promotions`);
      await db.execAsync(`DELETE FROM matches`);
      await db.execAsync(`DELETE FROM teams`);
    }
  }

  static async recreateMatchesTable() {
    const db = await this.init();

    if (Platform.OS === "web") {
      // Sur le web, pas besoin de recréer
      return;
    } else {
      // Sur mobile, recréer la table matches avec le nouveau schéma
      await db.execAsync(`DROP TABLE IF EXISTS matches`);
      await db.execAsync(`
        CREATE TABLE matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team1Id INTEGER NOT NULL,
          team2Id INTEGER NOT NULL,
          team1 TEXT NOT NULL,
          team2 TEXT NOT NULL,
          team1Division INTEGER NOT NULL,
          team2Division INTEGER NOT NULL,
          matchOrder INTEGER NOT NULL,
          map TEXT NOT NULL,
          score1 INTEGER NOT NULL,
          score2 INTEGER NOT NULL,
          winnerId INTEGER NOT NULL,
          winner TEXT NOT NULL,
          date TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (team1Id) REFERENCES teams (id),
          FOREIGN KEY (team2Id) REFERENCES teams (id),
          FOREIGN KEY (winnerId) REFERENCES teams (id)
        );
      `);
    }
  }
}

export { DatabaseManager };
export default DatabaseManager;
