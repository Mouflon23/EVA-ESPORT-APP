import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Chip,
  Menu,
  Provider,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { DatabaseManager } from "../services/DatabaseManager";

const MAPS = [
  "Ceres",
  "Silva",
  "Artefact",
  "Polaris",
  "The Cliff",
  "Helios Station",
  "Lunar Outpost",
  "Atlantis",
  "Engine",
  "Outlaw",
  "Horizon",
];

export default function AddMatchScreen({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    team1Id: "",
    team2Id: "",
    matchOrder: 1,
    map: "",
    score1: "",
    score2: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [team1MenuVisible, setTeam1MenuVisible] = useState(false);
  const [team2MenuVisible, setTeam2MenuVisible] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const teamsData = await DatabaseManager.getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error("Erreur lors du chargement des équipes:", error);
      Alert.alert("Erreur", "Impossible de charger les équipes");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTeamSelect = (teamId, isTeam1) => {
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      if (isTeam1) {
        setFormData((prev) => ({ ...prev, team1Id: teamId }));
        setTeam1MenuVisible(false);
        console.log("Équipe 1 sélectionnée:", team.name);
        // Réinitialiser l'équipe 2 si elle n'est pas de la même division
        if (formData.team2Id) {
          const team2 = teams.find((t) => t.id === formData.team2Id);
          if (team2 && team2.division !== team.division) {
            setFormData((prev) => ({ ...prev, team2Id: "" }));
          }
        }
      } else {
        setFormData((prev) => ({ ...prev, team2Id: teamId }));
        setTeam2MenuVisible(false);
        console.log("Équipe 2 sélectionnée:", team.name);
        // Réinitialiser l'équipe 1 si elle n'est pas de la même division
        if (formData.team1Id) {
          const team1 = teams.find((t) => t.id === formData.team1Id);
          if (team1 && team1.division !== team.division) {
            setFormData((prev) => ({ ...prev, team1Id: "" }));
          }
        }
      }
    }
  };

  const getSelectedTeamName = (teamId) => {
    const team = teams.find((t) => t.id === teamId);
    return team
      ? `${team.name} (Div ${team.division})`
      : "Sélectionner une équipe";
  };

  const validateForm = () => {
    if (!formData.team1Id) {
      Alert.alert("Erreur", "Veuillez sélectionner la première équipe");
      return false;
    }
    if (!formData.team2Id) {
      Alert.alert("Erreur", "Veuillez sélectionner la deuxième équipe");
      return false;
    }
    if (formData.team1Id === formData.team2Id) {
      Alert.alert("Erreur", "Les deux équipes doivent être différentes");
      return false;
    }
    if (
      !formData.matchOrder ||
      formData.matchOrder < 1 ||
      formData.matchOrder > 3
    ) {
      Alert.alert("Erreur", "L'ordre du match doit être entre 1 et 3");
      return false;
    }
    if (!formData.map.trim()) {
      Alert.alert("Erreur", "Veuillez sélectionner une map");
      return false;
    }
    if (!formData.score1.trim() || !formData.score2.trim()) {
      Alert.alert("Erreur", "Veuillez saisir les scores des deux équipes");
      return false;
    }
    const score1 = parseInt(formData.score1);
    const score2 = parseInt(formData.score2);
    if (
      isNaN(score1) ||
      isNaN(score2) ||
      score1 < 0 ||
      score1 > 100 ||
      score2 < 0 ||
      score2 > 100
    ) {
      Alert.alert("Erreur", "Les scores doivent être entre 0 et 100");
      return false;
    }
    if (score1 !== 100 && score2 !== 100) {
      Alert.alert(
        "Erreur",
        "Une des deux équipes doit avoir exactement 100 points"
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const team1 = teams.find((t) => t.id === formData.team1Id);
      const team2 = teams.find((t) => t.id === formData.team2Id);

      if (!team1 || !team2) {
        Alert.alert("Erreur", "Équipe non trouvée");
        return;
      }

      const score1 = parseInt(formData.score1);
      const score2 = parseInt(formData.score2);
      let winnerId = null;

      if (score1 > score2) {
        winnerId = formData.team1Id;
      } else if (score2 > score1) {
        winnerId = formData.team2Id;
      } else {
        Alert.alert("Erreur", "Le match ne peut pas être nul");
        return;
      }

      const matchData = {
        team1Id: formData.team1Id,
        team2Id: formData.team2Id,
        team1: team1.name,
        team2: team2.name,
        team1Division: team1.division,
        team2Division: team2.division,
        matchOrder: formData.matchOrder,
        map: formData.map,
        score1: score1,
        score2: score2,
        winnerId: winnerId,
        winner: winnerId === formData.team1Id ? team1.name : team2.name,
        date: new Date(formData.date).toISOString(),
        createdAt: new Date().toISOString(),
      };

      await DatabaseManager.addMatch(matchData);

      // Mettre à jour les statistiques des équipes
      await DatabaseManager.updateTeamStats(
        formData.team1Id,
        formData.team2Id,
        winnerId
      );

      navigation.navigate("MatchesList", { refresh: true });
    } catch (error) {
      console.error("Erreur lors de l'ajout du match:", error);
      Alert.alert("Erreur", "Impossible d'ajouter le match");
    } finally {
      setLoading(false);
    }
  };

  const getDivisionColor = (division) => {
    switch (division) {
      case 1:
        return "#FFD700"; // Gold
      case 2:
        return "#C0C0C0"; // Silver
      case 3:
        return "#CD7F32"; // Bronze
      case 4:
        return "#A9A9A9"; // DarkGray
      default:
        return "#666";
    }
  };

  return (
    <Provider>
      <ScrollView style={styles.container} nestedScrollEnabled={true}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Ajouter un nouveau match</Title>
            <Paragraph style={styles.subtitle}>Format: Best of 3</Paragraph>

            <View style={styles.teamSelectorsContainer}>
              <View style={styles.teamSelector}>
                <Paragraph style={styles.label}>Équipe 1 *</Paragraph>
                <Menu
                  visible={team1MenuVisible}
                  onDismiss={() => setTeam1MenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => {
                        console.log("Bouton Équipe 1 cliqué");
                        setTeam1MenuVisible(true);
                      }}
                      style={styles.teamButton}
                      contentStyle={styles.teamButtonContent}
                    >
                      {getSelectedTeamName(formData.team1Id)}
                    </Button>
                  }
                  contentStyle={styles.menuContent}
                >
                  {teams
                    .filter((team) => {
                      // Exclure l'équipe déjà sélectionnée en équipe 2
                      if (team.id === formData.team2Id) return false;
                      // Si une équipe 2 est sélectionnée, ne montrer que les équipes de la même division
                      if (formData.team2Id) {
                        const team2 = teams.find(
                          (t) => t.id === formData.team2Id
                        );
                        return team.division === team2.division;
                      }
                      return true;
                    })
                    .map((team) => (
                      <Menu.Item
                        key={team.id}
                        onPress={() => handleTeamSelect(team.id, true)}
                        title={`${team.name} (Div ${team.division})`}
                        titleStyle={styles.menuItemTitle}
                      />
                    ))}
                </Menu>
              </View>

              <View style={styles.teamSelector}>
                <Paragraph style={styles.label}>Équipe 2 *</Paragraph>
                <Menu
                  visible={team2MenuVisible}
                  onDismiss={() => setTeam2MenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => {
                        console.log("Bouton Équipe 2 cliqué");
                        setTeam2MenuVisible(true);
                      }}
                      style={styles.teamButton}
                      contentStyle={styles.teamButtonContent}
                    >
                      {getSelectedTeamName(formData.team2Id)}
                    </Button>
                  }
                  contentStyle={styles.menuContent}
                >
                  {teams
                    .filter((team) => {
                      // Exclure l'équipe déjà sélectionnée en équipe 1
                      if (team.id === formData.team1Id) return false;
                      // Si une équipe 1 est sélectionnée, ne montrer que les équipes de la même division
                      if (formData.team1Id) {
                        const team1 = teams.find(
                          (t) => t.id === formData.team1Id
                        );
                        return team.division === team1.division;
                      }
                      return true;
                    })
                    .map((team) => (
                      <Menu.Item
                        key={team.id}
                        onPress={() => handleTeamSelect(team.id, false)}
                        title={`${team.name} (Div ${team.division})`}
                        titleStyle={styles.menuItemTitle}
                      />
                    ))}
                </Menu>
              </View>
            </View>

            <View style={styles.matchOrderContainer}>
              <Paragraph style={styles.label}>Ordre du match *</Paragraph>
              <View style={styles.matchOrderButtons}>
                {[1, 2, 3].map((order) => (
                  <Button
                    key={order}
                    mode={
                      formData.matchOrder === order ? "contained" : "outlined"
                    }
                    onPress={() => handleInputChange("matchOrder", order)}
                    style={styles.matchOrderButton}
                  >
                    {order}
                  </Button>
                ))}
              </View>
            </View>

            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.title}>Map et Scores</Title>
                <Paragraph style={styles.instruction}>
                  Sélectionnez la map jouée et saisissez les scores.
                </Paragraph>

                <Paragraph style={styles.label}>Map *</Paragraph>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.mapSelector}
                >
                  {MAPS.map((mapName) => (
                    <Button
                      key={mapName}
                      mode={formData.map === mapName ? "contained" : "outlined"}
                      onPress={() => handleInputChange("map", mapName)}
                      style={styles.mapButton}
                      compact
                    >
                      {mapName}
                    </Button>
                  ))}
                </ScrollView>

                <View style={styles.scoreContainer}>
                  <TextInput
                    label="Score Équipe 1 *"
                    value={formData.score1}
                    onChangeText={(value) => handleInputChange("score1", value)}
                    style={styles.scoreInput}
                    mode="outlined"
                    keyboardType="numeric"
                    placeholder="0-100"
                  />
                  <Title style={styles.scoreSeparator}>-</Title>
                  <TextInput
                    label="Score Équipe 2 *"
                    value={formData.score2}
                    onChangeText={(value) => handleInputChange("score2", value)}
                    style={styles.scoreInput}
                    mode="outlined"
                    keyboardType="numeric"
                    placeholder="0-100"
                  />
                </View>
              </Card.Content>
            </Card>

            <TextInput
              label="Date du match"
              value={formData.date}
              onChangeText={(value) => handleInputChange("date", value)}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.submitButton}
              >
                Ajouter le match
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.cancelButton}
              >
                Annuler
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    color: "#6200ea",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
    fontStyle: "italic",
  },
  instruction: {
    textAlign: "center",
    marginBottom: 16,
    color: "#666",
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 8,
  },
  teamSelectorsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  teamSelector: {
    flex: 1,
    marginHorizontal: 4,
  },
  teamButton: {
    marginBottom: 8,
    justifyContent: "flex-start",
  },
  teamButtonContent: {
    justifyContent: "flex-start",
  },
  menuItemTitle: {
    fontSize: 16,
  },
  menuContent: {
    marginTop: -8,
    marginLeft: -8,
  },
  mapContainer: {
    marginBottom: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  mapSelector: {
    marginBottom: 12,
  },
  mapButton: {
    marginRight: 8,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  scoreSeparator: {
    marginHorizontal: 8,
    fontSize: 20,
    fontWeight: "bold",
  },
  matchOrderContainer: {
    marginBottom: 16,
  },
  matchOrderButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  matchOrderButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  mapSelector: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    marginBottom: 12,
    backgroundColor: "#6200ea",
  },
  cancelButton: {
    borderColor: "#6200ea",
  },
});
