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

export default function TeamsScreen({ navigation, route }) {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (route?.params?.refresh) {
      loadTeams();
      // Reset the refresh parameter
      navigation.setParams({ refresh: false });
    }
  }, [route?.params?.refresh]);

  useEffect(() => {
    filterTeams();
  }, [teams, searchQuery, selectedDivision]);

  useFocusEffect(
    React.useCallback(() => {
      loadTeams();
    }, [])
  );

  const loadTeams = async () => {
    try {
      const teamsData = await DatabaseManager.getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error("Erreur lors du chargement des équipes:", error);
      Alert.alert("Erreur", "Impossible de charger les équipes");
    } finally {
      setLoading(false);
    }
  };

  const filterTeams = () => {
    let filtered = teams;

    // Filtrage par division
    if (selectedDivision !== "all") {
      filtered = filtered.filter(
        (team) => team.division === parseInt(selectedDivision)
      );
    }

    // Filtrage par recherche
    if (searchQuery) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.captain.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTeams(filtered);
  };

  const deleteTeam = async (teamId) => {
    Alert.alert(
      "Supprimer l'équipe",
      "Êtes-vous sûr de vouloir supprimer cette équipe ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await DatabaseManager.deleteTeam(teamId);
              await loadTeams();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer l'équipe");
            }
          },
        },
      ]
    );
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

  const renderTeam = ({ item }) => (
    <Card style={styles.teamCard}>
      <Card.Content>
        <View style={styles.teamHeader}>
          <View style={styles.teamInfo}>
            <Title style={styles.teamName}>{item.name}</Title>
            <Paragraph style={styles.captainName}>
              Capitaine: {item.captain}
            </Paragraph>
          </View>
          <Chip
            style={[
              styles.divisionChip,
              { backgroundColor: getDivisionColor(item.division) },
            ]}
            textStyle={styles.divisionChipText}
          >
            D{item.division}
          </Chip>
        </View>

        <View style={styles.teamStats}>
          <View style={styles.statItem}>
            <Ionicons name="person" size={16} color="#666" />
            <Paragraph style={styles.statText}>
              {item.playerCount} joueur{item.playerCount > 1 ? "s" : ""}
            </Paragraph>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={16} color="#666" />
            <Paragraph style={styles.statText}>
              {item.points || 0} pts
            </Paragraph>
          </View>
        </View>

        <View style={styles.teamActions}>
          <Button
            mode="outlined"
            onPress={() =>
              navigation.navigate("TeamDetail", { teamId: item.id })
            }
            style={styles.actionButton}
            compact
          >
            Détails
          </Button>
          <Button
            mode="outlined"
            onPress={() => deleteTeam(item.id)}
            style={[styles.actionButton, styles.deleteButton]}
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
        placeholder="Rechercher une équipe..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <DivisionFilter />

      <FlatList
        data={filteredTeams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadTeams}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="person-outline" size={64} color="#ccc" />
              <Title style={styles.emptyTitle}>Aucune équipe trouvée</Title>
              <Paragraph style={styles.emptyText}>
                {searchQuery || selectedDivision !== "all"
                  ? "Aucune équipe ne correspond à vos critères"
                  : "Commencez par ajouter une équipe"}
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("AddTeam")}
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
  teamCard: {
    marginBottom: 12,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  captainName: {
    fontSize: 14,
    color: "#666",
  },
  divisionChip: {
    marginLeft: 8,
  },
  divisionChipText: {
    color: "white",
    fontWeight: "bold",
  },
  teamStats: {
    flexDirection: "row",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  teamActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    borderColor: "#ff6b6b",
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
