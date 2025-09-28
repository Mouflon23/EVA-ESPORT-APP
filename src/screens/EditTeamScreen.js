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

export default function EditTeamScreen({ navigation, route }) {
  const { team } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    captain: team.captain,
    division: team.division,
    players: [...team.players],
  });

  const divisions = [
    { value: 1, label: "Division 1" },
    { value: 2, label: "Division 2" },
    { value: 3, label: "Division 3" },
    { value: 4, label: "Division 4" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePlayerChange = (index, value) => {
    const newPlayers = [...formData.players];
    newPlayers[index] = value;
    setFormData((prev) => ({
      ...prev,
      players: newPlayers,
    }));
  };

  const addPlayer = () => {
    if (formData.players.length < 10) {
      setFormData((prev) => ({
        ...prev,
        players: [...prev.players, ""],
      }));
    }
  };

  const removePlayer = (index) => {
    if (formData.players.length > 1) {
      const newPlayers = formData.players.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        players: newPlayers,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Erreur", "Le nom de l'équipe est requis");
      return false;
    }

    if (!formData.captain.trim()) {
      Alert.alert("Erreur", "Le nom du capitaine est requis");
      return false;
    }

    const validPlayers = formData.players.filter(
      (player) => player.trim() !== ""
    );
    if (validPlayers.length < 1) {
      Alert.alert("Erreur", "Au moins un joueur est requis");
      return false;
    }

    if (validPlayers.length > 10) {
      Alert.alert("Erreur", "Maximum 10 joueurs par équipe");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const validPlayers = formData.players.filter(
        (player) => player.trim() !== ""
      );

      const teamData = {
        id: team.id,
        name: formData.name.trim(),
        captain: formData.captain.trim(),
        division: formData.division,
        playerCount: validPlayers.length,
        players: validPlayers,
      };

      // Mettre à jour l'équipe dans la base de données
      await DatabaseManager.updateTeam(teamData);

      navigation.navigate("TeamsList", { refresh: true });
    } catch (error) {
      console.error("Erreur lors de la modification de l'équipe:", error);
      Alert.alert("Erreur", "Impossible de modifier l'équipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Modifier l'équipe</Title>

          <TextInput
            label="Nom de l'équipe *"
            value={formData.name}
            onChangeText={(value) => handleInputChange("name", value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Capitaine *"
            value={formData.captain}
            onChangeText={(value) => handleInputChange("captain", value)}
            style={styles.input}
            mode="outlined"
          />

          <Paragraph style={styles.label}>Division *</Paragraph>
          <View style={styles.chipContainer}>
            {divisions.map((division) => (
              <Chip
                key={division.value}
                selected={formData.division === division.value}
                onPress={() => handleInputChange("division", division.value)}
                style={styles.chip}
              >
                {division.label}
              </Chip>
            ))}
          </View>

          <Paragraph style={styles.label}>Joueurs *</Paragraph>
          {formData.players.map((player, index) => (
            <View key={index} style={styles.playerRow}>
              <TextInput
                label={`Joueur ${index + 1}`}
                value={player}
                onChangeText={(value) => handlePlayerChange(index, value)}
                style={styles.playerInput}
                mode="outlined"
              />
              {formData.players.length > 1 && (
                <Button
                  mode="outlined"
                  onPress={() => removePlayer(index)}
                  style={styles.removeButton}
                  icon="minus"
                >
                  Supprimer
                </Button>
              )}
            </View>
          ))}

          {formData.players.length < 10 && (
            <Button
              mode="outlined"
              onPress={addPlayer}
              style={styles.addButton}
              icon="plus"
            >
              Ajouter un joueur
            </Button>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              Modifier l'équipe
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
    marginBottom: 20,
    color: "#6200ea",
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
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  playerInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    minWidth: 100,
  },
  addButton: {
    marginBottom: 20,
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
