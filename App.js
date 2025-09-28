import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

// Import des écrans
import HomeScreen from "./src/screens/HomeScreen";
import TeamsScreen from "./src/screens/TeamsScreen";
import MatchesScreen from "./src/screens/MatchesScreen";
import RankingsScreen from "./src/screens/RankingsScreen";
import TeamDetailScreen from "./src/screens/TeamDetailScreen";
import AddTeamScreen from "./src/screens/AddTeamScreen";
import EditTeamScreen from "./src/screens/EditTeamScreen";
import AddMatchScreen from "./src/screens/AddMatchScreen";
import EditMatchScreen from "./src/screens/EditMatchScreen";

// Import du thème
import { theme } from "./src/styles/theme";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator pour les équipes
function TeamsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TeamsList"
        component={TeamsScreen}
        options={{ title: "Équipes" }}
      />
      <Stack.Screen
        name="TeamDetail"
        component={TeamDetailScreen}
        options={{ title: "Détails Équipe" }}
      />
      <Stack.Screen
        name="AddTeam"
        component={AddTeamScreen}
        options={{ title: "Ajouter Équipe" }}
      />
      <Stack.Screen
        name="EditTeam"
        component={EditTeamScreen}
        options={{ title: "Modifier Équipe" }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator pour les matchs
function MatchesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MatchesList"
        component={MatchesScreen}
        options={{ title: "Matchs" }}
      />
      <Stack.Screen
        name="AddMatch"
        component={AddMatchScreen}
        options={{ title: "Ajouter Match" }}
      />
      <Stack.Screen
        name="EditMatch"
        component={EditMatchScreen}
        options={{ title: "Modifier Match" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === "Home") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "Teams") {
                iconName = focused ? "people" : "people-outline";
              } else if (route.name === "Matches") {
                iconName = focused ? "football" : "football-outline";
              } else if (route.name === "Rankings") {
                iconName = focused ? "trophy" : "trophy-outline";
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: "gray",
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Accueil" }}
          />
          <Tab.Screen
            name="Teams"
            component={TeamsStack}
            options={{ title: "Équipes", headerShown: false }}
          />
          <Tab.Screen
            name="Matches"
            component={MatchesStack}
            options={{ title: "Matchs", headerShown: false }}
          />
          <Tab.Screen
            name="Rankings"
            component={RankingsScreen}
            options={{ title: "Classements" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
