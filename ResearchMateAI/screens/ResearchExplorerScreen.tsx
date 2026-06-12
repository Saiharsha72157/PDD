import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../services/ThemeContext';
import { useTranslation } from '../services/localization';
import { searchPapers } from '../services/researchApi';
import FilterModal from '../components/FilterModal';

export default function ResearchExplorerScreen() {
  const { themeColors } = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (searchQuery?: string | any) => {
    // If it's an event object, ignore it, use state query
    const q = typeof searchQuery === 'string' ? searchQuery : query;
    if (!q.trim()) return;
    
    navigation.navigate('ResearchResults', { query: q });
  };

  const trendingTopics = [
    'Artificial Intelligence',
    'Machine Learning',
    'Deep Learning',
    'Disaster Management',
    'Cyber Security',
    'Blockchain',
    'IoT',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("research_explorer")}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ResearchDashboard')}>
          <Ionicons name="stats-chart" size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Ionicons name="search" size={20} color={themeColors.subText} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: themeColors.text }]}
            placeholder={t("search_papers_placeholder")}
            placeholderTextColor={themeColors.subText}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleSearch} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-forward-circle" size={24} color={themeColors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {loading && <ActivityIndicator size="small" color={themeColors.primary} style={{ marginTop: 10 }} />}
      </View>

      <View style={styles.trendingSection}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t("trending_topics")}</Text>
        <View style={styles.topicsContainer}>
          {trendingTopics.map((topic, index) => (
            <TouchableOpacity 
              key={index}
              style={[styles.topicBadge, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={() => {
                setQuery(topic);
                handleSearch(topic);
              }}
            >
              <Text style={[styles.topicText, { color: themeColors.text }]}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  trendingSection: {
    padding: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicText: {
    fontSize: 14,
  }
});
