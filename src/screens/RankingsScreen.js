import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Card, Title, Paragraph, Chip, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import DatabaseManager from "../services/DatabaseManager";

export default function RankingsScreen() {
  const [rankings, setRankings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadRankings();
    }, [])
  );

  const loadRankings = async () => {
    try {
      const teams = await DatabaseManager.getTeams();
      const matches = await DatabaseManager.getMatches();

      // Calculer les classements par division
      const divisionRankings = { 1: [], 2: [], 3: [], 4: [] };

      // Grouper les équipes par division
      teams.forEach((team) => {
        if (divisionRankings[team.division]) {
          divisionRankings[team.division].push({
            ...team,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            points: 0,
          });
        }
      });

      // Calculer les statistiques basées sur les matchs
      matches.forEach((match) => {
        const team1 = divisionRankings[match.team1Division]?.find(
          (t) => t.id === match.team1Id
        );
        const team2 = divisionRankings[match.team2Division]?.find(
          (t) => t.id === match.team2Id
        );

        if (team1) {
          team1.matchesPlayed++;
          if (match.winnerId === team1.id) {
            team1.wins++;
          } else {
            team1.losses++;
          }
        }

        if (team2) {
          team2.matchesPlayed++;
          if (match.winnerId === team2.id) {
            team2.wins++;
          } else {
            team2.losses++;
          }
        }
      });

      // Calculer les points selon le règlement
      Object.keys(divisionRankings).forEach((division) => {
        const teamsInDivision = divisionRankings[division];

        // Calculer les points pour chaque équipe selon ses résultats
        teamsInDivision.forEach((team) => {
          // Points de base selon la division
          const basePoints = {
            1: 100, // Division 1
            2: 80, // Division 2
            3: 60, // Division 3
            4: 40, // Division 4
          };

          // Points bonus pour les victoires
          const victoryPoints = team.wins * 10;

          // Points malus pour les défaites
          const defeatPoints = team.losses * 5;

          // Calcul total des points
          team.points = Math.max(
            0,
            basePoints[division] + victoryPoints - defeatPoints
          );
        });

        // Trier par nombre de points, puis par victoires, puis par défaites
        teamsInDivision.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.wins !== a.wins) return b.wins - a.wins;
          return a.losses - b.losses;
        });
      });

      setRankings(divisionRankings);
    } catch (error) {
      console.error("Erreur lors du chargement des classements:", error);
      Alert.alert("Erreur", "Impossible de charger les classements");
    } finally {
      setLoading(false);
    }
  };

  const getDivisionColor = (division) => {
    const colors = {
      1: "#ff6b6b",
      2: "#4ecdc4",
      3: "#45b7d1",
      4: "#96ceb4",
    };
    return colors[division] || "#666";
  };

  const renderTeamRanking = ({ item, index }) => (
    <Card style={styles.teamCard}>
      <Card.Content>
        <View style={styles.teamHeader}>
          <View style={styles.teamPosition}>
            <Title style={styles.positionText}>#{index + 1}</Title>
          </View>
          <View style={styles.teamInfo}>
            <Title style={styles.teamName}>{item.name}</Title>
            <Paragraph style={styles.captainName}>{item.captain}</Paragraph>
          </View>
          <View style={styles.teamStats}>
            <Title style={styles.pointsText}>{item.points}</Title>
            <Paragraph style={styles.pointsLabel}>pts</Paragraph>
          </View>
        </View>

        <View style={styles.matchStats}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
            <Paragraph style={styles.statText}>{item.wins}V</Paragraph>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="close-circle" size={16} color="#f44336" />
            <Paragraph style={styles.statText}>{item.losses}D</Paragraph>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={16} color="#ff9800" />
            <Paragraph style={styles.statText}>{item.matchesPlayed}M</Paragraph>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderDivision = (division, teams) => (
    <View key={division} style={styles.divisionContainer}>
      <View style={styles.divisionHeader}>
        <Chip
          style={[
            styles.divisionChip,
            { backgroundColor: getDivisionColor(division) },
          ]}
          textStyle={styles.divisionChipText}
        >
          Division {division}
        </Chip>
        <Paragraph style={styles.teamCount}>
          {teams.length} équipe{teams.length > 1 ? "s" : ""}
        </Paragraph>
      </View>

      {teams.length > 0 ? (
        <FlatList
          data={teams}
          renderItem={renderTeamRanking}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Ionicons name="person-outline" size={48} color="#ccc" />
            <Paragraph style={styles.emptyText}>
              Aucune équipe dans cette division
            </Paragraph>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Title>Chargement des classements...</Title>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.headerTitle}>Classements Ligue Locale</Title>
          <Paragraph style={styles.headerSubtitle}>
            Mis à jour automatiquement selon les résultats
          </Paragraph>
        </Card.Content>
      </Card>

      <FlatList
        data={Object.entries(rankings)}
        renderItem={({ item }) => renderDivision(item[0], item[1])}
        keyExtractor={(item) => item[0]}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#6200ea",
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  divisionContainer: {
    marginBottom: 24,
  },
  divisionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  divisionChip: {
    marginRight: 8,
  },
  divisionChipText: {
    color: "white",
    fontWeight: "bold",
  },
  teamCount: {
    fontSize: 14,
    color: "#666",
  },
  teamCard: {
    marginBottom: 8,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teamPosition: {
    width: 40,
    alignItems: "center",
  },
  positionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6200ea",
  },
  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  captainName: {
    fontSize: 12,
    color: "#666",
  },
  teamStats: {
    alignItems: "center",
  },
  pointsText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4caf50",
  },
  pointsLabel: {
    fontSize: 10,
    color: "#666",
  },
  matchStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  emptyCard: {
    elevation: 1,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    color: "#999",
    textAlign: "center",
  },
});
