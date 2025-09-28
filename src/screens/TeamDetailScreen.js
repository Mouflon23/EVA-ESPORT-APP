import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Chip,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import DatabaseManager from "../services/DatabaseManager";

export default function TeamDetailScreen({ route, navigation }) {
  const { teamId } = route.params;
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      const teamData = await DatabaseManager.getTeamById(teamId);
      const teamMatches = await DatabaseManager.getMatchesByTeam(teamId);

      setTeam(teamData);
      setMatches(teamMatches);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      Alert.alert("Erreur", "Impossible de charger les données de l'équipe");
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMatch = (match) => {
    const isWinner = match.winnerId === teamId;
    const opponentTeam = match.team1Id === teamId ? match.team2 : match.team1;

    return (
      <Card key={match.id} style={styles.matchCard}>
        <Card.Content>
          <View style={styles.matchHeader}>
            <View style={styles.matchInfo}>
              <Paragraph style={styles.matchDate}>
                {formatDate(match.date)}
              </Paragraph>
              <Title style={styles.matchTitle}>
                {team.name} vs {opponentTeam}
              </Title>
            </View>
            <Chip
              style={[
                styles.resultChip,
                { backgroundColor: isWinner ? "#4caf50" : "#f44336" },
              ]}
              textStyle={styles.resultChipText}
            >
              {isWinner ? "Victoire" : "Défaite"}
            </Chip>
          </View>

          <View style={styles.matchScore}>
            <Paragraph style={styles.scoreText}>
              Score: {match.score1} - {match.score2}
            </Paragraph>
            <Paragraph style={styles.mapText}>
              Map: {match.map || "N/A"}
            </Paragraph>
            <Paragraph style={styles.matchOrderText}>
              Match {match.matchOrder} du Bo3
            </Paragraph>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Title>Chargement...</Title>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.errorContainer}>
        <Title>Équipe non trouvée</Title>
        <Button onPress={() => navigation.goBack()}>Retour</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.teamCard}>
        <Card.Content>
          <View style={styles.teamHeader}>
            <View style={styles.teamInfo}>
              <Title style={styles.teamName}>{team.name}</Title>
              <Paragraph style={styles.captainName}>
                Capitaine: {team.captain}
              </Paragraph>
            </View>
            <View style={styles.headerActions}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate("EditTeam", { team })}
                style={styles.editButton}
                icon="pencil"
              >
                Modifier
              </Button>
              <Chip
                style={[
                  styles.divisionChip,
                  { backgroundColor: getDivisionColor(team.division) },
                ]}
                textStyle={styles.divisionChipText}
              >
                Division {team.division}
              </Chip>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="person" size={20} color="#666" />
              <Paragraph style={styles.statText}>
                {team.playerCount} joueur{team.playerCount > 1 ? "s" : ""}
              </Paragraph>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={20} color="#666" />
              <Paragraph style={styles.statText}>
                {team.points || 0} points
              </Paragraph>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              <Paragraph style={styles.statText}>
                {team.wins || 0} victoire{(team.wins || 0) > 1 ? "s" : ""}
              </Paragraph>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={20} color="#f44336" />
              <Paragraph style={styles.statText}>
                {team.losses || 0} défaite{(team.losses || 0) > 1 ? "s" : ""}
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.playersCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Joueurs</Title>
          {team.players.map((player, index) => (
            <View key={index} style={styles.playerItem}>
              <Ionicons name="person" size={16} color="#666" />
              <Paragraph style={styles.playerName}>
                {player}
                {index === 0 && " (Capitaine)"}
              </Paragraph>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.matchesCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>
            Historique des matchs ({matches.length})
          </Title>
          {matches.length > 0 ? (
            matches.map(renderMatch)
          ) : (
            <View style={styles.emptyMatches}>
              <Ionicons name="trophy-outline" size={48} color="#ccc" />
              <Paragraph style={styles.emptyText}>
                Aucun match joué pour le moment
              </Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  teamCard: {
    margin: 16,
    elevation: 4,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  teamInfo: {
    flex: 1,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  editButton: {
    borderColor: "#6200ea",
  },
  teamName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  captainName: {
    fontSize: 16,
    color: "#666",
  },
  divisionChip: {
    marginLeft: 8,
  },
  divisionChipText: {
    color: "white",
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 8,
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  playersCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#6200ea",
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  playerName: {
    marginLeft: 8,
    fontSize: 16,
  },
  matchesCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  matchCard: {
    marginBottom: 12,
    elevation: 1,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  matchInfo: {
    flex: 1,
  },
  matchDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultChip: {
    marginLeft: 8,
  },
  resultChipText: {
    color: "white",
    fontWeight: "bold",
  },
  matchScore: {
    marginTop: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  mapText: {
    fontSize: 12,
    color: "#666",
  },
  mapResultsContainer: {
    marginTop: 8,
  },
  mapResult: {
    backgroundColor: "#f5f5f5",
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  mapResultText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  matchOrderText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  emptyMatches: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    color: "#999",
    textAlign: "center",
  },
});
