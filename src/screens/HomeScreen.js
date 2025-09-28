import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Title, Paragraph, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { DatabaseManager } from "../services/DatabaseManager";

export default function HomeScreen({ navigation, route }) {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    divisions: { 1: 0, 2: 0, 3: 0, 4: 0 },
  });

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  useEffect(() => {
    if (route?.params?.refresh) {
      loadStats();
      // Reset the refresh parameter
      navigation.setParams({ refresh: false });
    }
  }, [route?.params?.refresh]);

  const loadStats = async () => {
    try {
      const teams = await DatabaseManager.getTeams();
      const matches = await DatabaseManager.getMatches();

      const divisionsCount = { 1: 0, 2: 0, 3: 0, 4: 0 };
      teams.forEach((team) => {
        if (team.division >= 1 && team.division <= 4) {
          divisionsCount[team.division]++;
        }
      });

      setStats({
        totalTeams: teams.length,
        totalMatches: matches.length,
        divisions: divisionsCount,
      });

      console.log("Stats mises à jour:", {
        totalTeams: teams.length,
        totalMatches: matches.length,
        divisions: divisionsCount,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Card.Content style={styles.statContent}>
        <Ionicons name={icon} size={24} color={color} />
        <View style={styles.statText}>
          <Title style={styles.statValue}>{value}</Title>
          <Paragraph style={styles.statTitle}>{title}</Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Title style={styles.welcomeTitle}>Ligue Locale EVA</Title>
            <Paragraph style={styles.welcomeSubtitle}>
              Gestion des équipes et scores
            </Paragraph>
          </Card.Content>
        </Card>

        <View style={styles.statsContainer}>
          <StatCard
            title="Équipes totales"
            value={stats.totalTeams}
            icon="people"
            color="#6200ea"
          />
          <StatCard
            title="Matchs joués"
            value={stats.totalMatches}
            icon="trophy"
            color="#03dac4"
          />
        </View>

        <Card style={styles.divisionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Répartition par Division</Title>
            {Object.entries(stats.divisions).map(([division, count]) => (
              <View key={division} style={styles.divisionRow}>
                <Paragraph style={styles.divisionText}>
                  Division {division}
                </Paragraph>
                <Paragraph style={styles.divisionCount}>
                  {count} équipe{count > 1 ? "s" : ""}
                </Paragraph>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Actions rapides</Title>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate("Teams")}
                style={styles.actionButton}
                icon="account-group"
              >
                Gérer les équipes
              </Button>
              <Button
                mode="contained"
                onPress={() => navigation.navigate("Matches")}
                style={styles.actionButton}
                icon="trophy"
              >
                Ajouter un match
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeCard: {
    marginBottom: 20,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#6200ea",
  },
  welcomeSubtitle: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  statText: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#666",
  },
  divisionsCard: {
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#6200ea",
  },
  divisionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  divisionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  divisionCount: {
    fontSize: 16,
    color: "#666",
  },
  actionsCard: {
    elevation: 2,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginVertical: 4,
  },
});
