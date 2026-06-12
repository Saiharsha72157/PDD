import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../services/ThemeContext';
import { getFavorites } from '../services/researchStorage';
import ResearchVisualAnalytics from '../components/ResearchVisualAnalytics';

import { useTranslation } from '../services/localization';

export default function ResearchDashboardScreen() {
  const { t } = useTranslation();
  const { themeColors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState({ favorites: 0 });
  const [trendData, setTrendData] = useState<{ year: string; count: number }[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoritesList, setFavoritesList] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const favorites = await getFavorites();
      
      setFavoritesList(favorites);
      setStats({
        favorites: favorites.length
      });

      // Calculate trend data based on favorites publication years
      const yearsMap: Record<string, number> = {};
      favorites.forEach(p => {
        if (p.year) {
          yearsMap[p.year] = (yearsMap[p.year] || 0) + 1;
        }
      });
      
      const trends = Object.keys(yearsMap).map(y => ({ year: y, count: yearsMap[y] }));
      trends.sort((a, b) => parseInt(a.year) - parseInt(b.year));
      setTrendData(trends.slice(-5)); // Last 5 years
    };
    
    if (isFocused) {
      loadStats();
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("research_dashboard_title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsRow}>
          <StatCard title="Saved Papers" count={stats.favorites} icon="heart" color="#E91E63" />
        </View>

        <TouchableOpacity 
          style={[styles.listCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 20 }]}
          onPress={() => setShowFavorites(!showFavorites)}
        >
          <View style={styles.listCardLeft}>
            <Ionicons name="heart" size={24} color="#E91E63" />
            <Text style={[styles.listCardTitle, { color: themeColors.text }]}>{t("favorite_papers_title")}</Text>
          </View>
          <Ionicons name={showFavorites ? "chevron-down" : "chevron-forward"} size={20} color={themeColors.subText} />
        </TouchableOpacity>

        {showFavorites && favoritesList.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {favoritesList.map((paper, index) => (
              <TouchableOpacity
                key={paper.paperId || index}
                style={[styles.paperItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                onPress={() => navigation.navigate('PaperIntelligence', { paper })}
              >
                <Text style={[styles.paperTitle, { color: themeColors.text }]} numberOfLines={2}>
                  {paper.title}
                </Text>
                <Text style={[styles.paperAuthors, { color: themeColors.subText }]} numberOfLines={1}>
                  {paper.authors?.map((a: any) => a.name).join(', ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {showFavorites && favoritesList.length === 0 && (
          <View style={{ marginTop: 10, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: themeColors.subText }}>No favorite papers found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, count, icon, color }: { title: string, count: number, icon: any, color: string }) {
  const { themeColors } = useAppTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
      <Ionicons name={icon} size={28} color={color} style={{ marginBottom: 8 }} />
      <Text style={[styles.statCount, { color: themeColors.text }]}>{count}</Text>
      <Text style={[styles.statTitle, { color: themeColors.subText }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  listCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  paperItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paperAuthors: {
    fontSize: 14,
  }
});
