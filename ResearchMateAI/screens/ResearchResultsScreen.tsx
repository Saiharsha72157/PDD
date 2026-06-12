import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../services/ThemeContext';
import PaperCard from '../components/PaperCard';
import FilterModal from '../components/FilterModal';
import { searchPapers, Paper } from '../services/researchApi';

export default function ResearchResultsScreen() {
  const { themeColors } = useAppTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const { query } = route.params || { query: '' };
  
  const [papers, setPapers] = React.useState<Paper[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState<{ openAccess?: boolean; yearRange?: string; ieeeOnly?: boolean } | undefined>({ yearRange: 'Since 2020' });

  React.useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchPapers(query, 20, 0, activeFilters);
        setPapers(response.data);
      } catch (err: any) {
        console.error(err);
        Alert.alert("Search Error", err.message || "Failed to load research papers.");
        setError(err.message || 'Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };
    
    if (query) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [query, activeFilters]);

  const handlePaperPress = (paper: Paper) => {
    navigation.navigate('PaperIntelligence', { paper });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
          Results for "{query}"
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
        <Text style={[styles.resultsCount, { color: themeColors.subText }]}>
          {loading ? 'Searching papers...' : error ? `Error: ${error}` : `Found ${papers?.length || 0} papers`}
        </Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={24} color={themeColors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={papers}
        keyExtractor={(item) => item.paperId}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <PaperCard paper={item} onPress={handlePaperPress} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={themeColors.subText} />
            <Text style={[styles.emptyText, { color: themeColors.subText }]}>No papers found.</Text>
          </View>
        }
      />
      )}

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(filters) => setActiveFilters(filters)}
      />
    </SafeAreaView>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  resultsCount: {
    padding: 16,
    paddingBottom: 8,
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
