import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Picker,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import DatabaseManager from "../services/DatabaseManager";

export default function AddTeamScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: "",
    captain: "",
    playerCount: 4,
    division: 4,
    players: ["", "", "", ""],
  });
  const [loading, setLoading] = useState(false);

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

  const addPlayerField = () => {
    if (formData.players.length < 7) {
      setFormData((prev) => ({
        ...prev,
        players: [...prev.players, ""],
      }));
    }
  };

  const removePlayerField = (index) => {
    if (formData.players.length > 4) {
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
    if (validPlayers.length < 4) {
      Alert.alert("Erreur", "Au moins 4 joueurs sont requis");
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
        name: formData.name.trim(),
        captain: formData.captain.trim(),
        division: formData.division,
        playerCount: validPlayers.length,
        players: validPlayers,
        points: 0,
        wins: 0,
        losses: 0,
        createdAt: new Date().toISOString(),
      };

      await DatabaseManager.addTeam(teamData);
      navigation.navigate("TeamsList", { refresh: true });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'équipe:", error);
      Alert.alert("Erreur", "Impossible d'ajouter l'équipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Informations de l'équipe</Title>

          <TextInput
            label="Nom de l'équipe *"
            value={formData.name}
            onChangeText={(value) => handleInputChange("name", value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Nom du capitaine *"
            value={formData.captain}
            onChangeText={(value) => handleInputChange("captain", value)}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.divisionContainer}>
            <Paragraph style={styles.label}>Division *</Paragraph>
            <View style={styles.divisionButtons}>
              {[1, 2, 3, 4].map((division) => (
                <Button
                  key={division}
                  mode={
                    formData.division === division ? "contained" : "outlined"
                  }
                  onPress={() => handleInputChange("division", division)}
                  style={styles.divisionButton}
                  compact
                >
                  D{division}
                </Button>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.playersHeader}>
            <Title style={styles.title}>Joueurs</Title>
            <Button
              mode="outlined"
              onPress={addPlayerField}
              disabled={formData.players.length >= 7}
              compact
              icon="plus"
            >
              Ajouter
            </Button>
          </View>

          <Paragraph style={styles.subtitle}>
            Minimum 4 joueurs, maximum 7 joueurs
          </Paragraph>

          {formData.players.map((player, index) => (
            <View key={index} style={styles.playerRow}>
              <TextInput
                label={`Joueur ${index + 1}`}
                value={player}
                onChangeText={(value) => handlePlayerChange(index, value)}
                style={styles.playerInput}
                mode="outlined"
              />
              {formData.players.length > 4 && (
                <Button
                  mode="outlined"
                  onPress={() => removePlayerField(index)}
                  style={styles.removeButton}
                  compact
                  textColor="#ff6b6b"
                >
                  <Ionicons name="trash-outline" size={16} />
                </Button>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Annuler
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Ajouter l'équipe
        </Button>
      </View>
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
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#6200ea",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  divisionContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  divisionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  divisionButton: {
    flex: 1,
  },
  playersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    borderColor: "#ff6b6b",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 32,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});
