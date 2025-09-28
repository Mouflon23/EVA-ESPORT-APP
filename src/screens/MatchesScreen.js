import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  Searchbar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import DatabaseManager from "../services/DatabaseManager";

export default function MatchesScreen({ navigation, route }) {
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (route?.params?.refresh) {
      loadMatches();
      // Reset the refresh parameter
      navigation.setParams({ refresh: false });
    }
  }, [route?.params?.refresh]);

  useEffect(() => {
    filterMatches();
  }, [matches, searchQuery, selectedDivision]);

  useFocusEffect(
    React.useCallback(() => {
      loadMatches();
    }, [])
  );

  const loadMatches = async () => {
    try {
      const matchesData = await DatabaseManager.getMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error("Erreur lors du chargement des matchs:", error);
      Alert.alert("Erreur", "Impossible de charger les matchs");
    } finally {
      setLoading(false);
    }
  };

  const filterMatches = () => {
    let filtered = matches;

    // Filtrage par division
    if (selectedDivision !== "all") {
      filtered = filtered.filter(
        (match) =>
          match.team1Division === parseInt(selectedDivision) ||
          match.team2Division === parseInt(selectedDivision)
      );
    }

    // Filtrage par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (match) =>
          match.team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.team2.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMatches(filtered);
  };

  const deleteMatch = async (matchId) => {
    Alert.alert(
      "Supprimer le match",
      "Êtes-vous sûr de vouloir supprimer ce match ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await DatabaseManager.deleteMatch(matchId);
              await loadMatches();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le match");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const renderMatch = ({ item }) => (
    <Card style={styles.matchCard}>
      <Card.Content>
        <View style={styles.matchHeader}>
          <Paragraph style={styles.matchDate}>
            {formatDate(item.date)}
          </Paragraph>
          <Chip
            style={[
              styles.divisionChip,
              { backgroundColor: getDivisionColor(item.team1Division) },
            ]}
            textStyle={styles.divisionChipText}
          >
            Match {item.matchOrder} - D{item.team1Division}
          </Chip>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.teamContainer}>
            <Paragraph style={styles.teamName}>{item.team1}</Paragraph>
            <Paragraph style={styles.captainName}>
              Div {item.team1Division}
            </Paragraph>
          </View>

          <View style={styles.vsContainer}>
            <Title style={styles.vsText}>VS</Title>
            <Title style={styles.scoreText}>
              {item.score1} - {item.score2}
            </Title>
          </View>

          <View style={styles.teamContainer}>
            <Paragraph style={styles.teamName}>{item.team2}</Paragraph>
            <Paragraph style={styles.captainName}>
              Div {item.team2Division}
            </Paragraph>
          </View>
        </View>

        <View style={styles.matchDetails}>
          <Paragraph style={styles.mapText}>Map: {item.map || "N/A"}</Paragraph>
          <Paragraph style={styles.winnerText}>
            Vainqueur: {item.winner}
          </Paragraph>
        </View>

        <View style={styles.matchActions}>
          <Button
            mode="outlined"
            onPress={() =>
              navigation.navigate("EditMatch", { matchId: item.id })
            }
            style={styles.editButton}
            compact
            textColor="#6200ea"
          >
            Modifier
          </Button>
          <Button
            mode="outlined"
            onPress={() => deleteMatch(item.id)}
            style={styles.deleteButton}
            compact
            textColor="#ff6b6b"
          >
            Supprimer
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const DivisionFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip
          selected={selectedDivision === "all"}
          onPress={() => setSelectedDivision("all")}
          style={styles.filterChip}
        >
          Toutes
        </Chip>
        {[1, 2, 3, 4].map((division) => (
          <Chip
            key={division}
            selected={selectedDivision === division.toString()}
            onPress={() => setSelectedDivision(division.toString())}
            style={styles.filterChip}
          >
            Division {division}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher un match..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <DivisionFilter />

      <FlatList
        data={filteredMatches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadMatches}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="trophy-outline" size={64} color="#ccc" />
              <Title style={styles.emptyTitle}>Aucun match trouvé</Title>
              <Paragraph style={styles.emptyText}>
                {searchQuery || selectedDivision !== "all"
                  ? "Aucun match ne correspond à vos critères"
                  : "Commencez par ajouter un match"}
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddMatch")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  matchCard: {
    marginBottom: 12,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  matchDate: {
    fontSize: 12,
    color: "#666",
  },
  divisionChip: {
    marginLeft: 8,
  },
  divisionChipText: {
    color: "white",
    fontWeight: "bold",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  captainName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  vsContainer: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6200ea",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  matchDetails: {
    marginBottom: 12,
  },
  mapText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4caf50",
  },
  matchActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    borderColor: "#6200ea",
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    borderColor: "#ff6b6b",
    flex: 1,
  },
  emptyCard: {
    marginTop: 50,
    elevation: 2,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#6200ea",
  },
});
