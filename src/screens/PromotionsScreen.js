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

export default function PromotionsScreen({ navigation }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const promotionsData = await DatabaseManager.getAllPromotions();
      setPromotions(promotionsData);
    } catch (error) {
      console.error("Erreur lors du chargement des promotions:", error);
      Alert.alert("Erreur", "Impossible de charger les promotions");
    } finally {
      setLoading(false);
    }
  };

  const handlePromotion = async (teamId, fromDivision, toDivision, reason) => {
    try {
      // Ajouter la promotion dans l'historique
      await DatabaseManager.addPromotion({
        teamId,
        teamName: "Nom de l'équipe", // À récupérer depuis la base
        fromDivision,
        toDivision,
        type: toDivision < fromDivision ? "promotion" : "retrogradation",
        reason,
      });

      // Mettre à jour la division de l'équipe
      const team = await DatabaseManager.getTeamById(teamId);
      if (team) {
        await DatabaseManager.updateTeam({
          ...team,
          division: toDivision,
        });
      }

      await loadPromotions();
      Alert.alert("Succès", "Promotion/rétrogradation effectuée avec succès");
    } catch (error) {
      console.error("Erreur lors de la promotion:", error);
      Alert.alert("Erreur", "Impossible d'effectuer la promotion");
    }
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

  const getPromotionIcon = (fromDivision, toDivision) => {
    if (toDivision < fromDivision) {
      return "trending-up"; // Promotion
    } else if (toDivision > fromDivision) {
      return "trending-down"; // Rétrogradation
    }
    return "remove"; // Pas de changement
  };

  const getPromotionColor = (fromDivision, toDivision) => {
    if (toDivision < fromDivision) {
      return "#4caf50"; // Vert pour promotion
    } else if (toDivision > fromDivision) {
      return "#f44336"; // Rouge pour rétrogradation
    }
    return "#666"; // Gris pour pas de changement
  };

  const renderPromotion = (promotion) => (
    <Card key={promotion.id} style={styles.promotionCard}>
      <Card.Content>
        <View style={styles.promotionHeader}>
          <View style={styles.promotionInfo}>
            <Title style={styles.teamName}>{promotion.teamName}</Title>
            <Paragraph style={styles.promotionDate}>
              {formatDate(promotion.createdAt)}
            </Paragraph>
          </View>
          <Ionicons
            name={getPromotionIcon(
              promotion.fromDivision,
              promotion.toDivision
            )}
            size={24}
            color={getPromotionColor(
              promotion.fromDivision,
              promotion.toDivision
            )}
          />
        </View>

        <View style={styles.promotionDetails}>
          <View style={styles.divisionChange}>
            <Chip
              style={[styles.divisionChip, { backgroundColor: "#ff6b6b" }]}
              textStyle={styles.divisionChipText}
            >
              D{promotion.fromDivision}
            </Chip>
            <Ionicons name="arrow-forward" size={16} color="#666" />
            <Chip
              style={[styles.divisionChip, { backgroundColor: "#4ecdc4" }]}
              textStyle={styles.divisionChipText}
            >
              D{promotion.toDivision}
            </Chip>
          </View>

          <Paragraph style={styles.reasonText}>
            Raison: {promotion.reason || "Non spécifiée"}
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Title>Chargement des promotions...</Title>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.headerTitle}>Promotions & Rétrogradations</Title>
          <Paragraph style={styles.headerSubtitle}>
            Historique des changements de division
          </Paragraph>
          <Button
            mode="outlined"
            onPress={loadPromotions}
            style={styles.refreshButton}
            icon="refresh"
          >
            Actualiser
          </Button>
        </Card.Content>
      </Card>

      {promotions.length > 0 ? (
        promotions.map(renderPromotion)
      ) : (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Ionicons name="trending-up-outline" size={64} color="#ccc" />
            <Title style={styles.emptyTitle}>Aucune promotion</Title>
            <Paragraph style={styles.emptyText}>
              Les promotions et rétrogradations apparaîtront ici
            </Paragraph>
          </Card.Content>
        </Card>
      )}
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
  refreshButton: {
    alignSelf: "center",
  },
  promotionCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  promotionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  promotionInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  promotionDate: {
    fontSize: 12,
    color: "#666",
  },
  promotionDetails: {
    marginTop: 8,
  },
  divisionChange: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  divisionChip: {
    marginHorizontal: 4,
  },
  divisionChipText: {
    color: "white",
    fontWeight: "bold",
  },
  reasonText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  emptyCard: {
    margin: 16,
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
});
