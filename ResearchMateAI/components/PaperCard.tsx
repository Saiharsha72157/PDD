import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Paper } from '../services/researchApi';
import { useAppTheme } from '../services/ThemeContext';

interface PaperCardProps {
  paper: Paper;
  onPress: (paper: Paper) => void;
}

export default function PaperCard({ paper, onPress }: PaperCardProps) {
  const { themeColors } = useAppTheme();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
      onPress={() => onPress(paper)}
    >
      <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={2}>
        {paper.title}
      </Text>
      
      <Text style={[styles.authors, { color: themeColors.subText }]} numberOfLines={1}>
        {paper.authors.map(a => a.name).join(', ') || 'Unknown Authors'}
      </Text>
      
      <View style={styles.statsRow}>
        {paper.year && (
          <View style={styles.statBadge}>
            <Ionicons name="calendar-outline" size={14} color={themeColors.primary} />
            <Text style={[styles.statText, { color: themeColors.text }]}>{paper.year}</Text>
          </View>
        )}
        <View style={styles.statBadge}>
          <Ionicons name="git-network-outline" size={14} color={themeColors.primary} />
          <Text style={[styles.statText, { color: themeColors.text }]}>{paper.citationCount} Citations</Text>
        </View>
        {paper.isOpenAccess && (
          <View style={[styles.statBadge, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
            <Ionicons name="lock-open-outline" size={14} color="#4CAF50" />
            <Text style={[styles.statText, { color: '#4CAF50' }]}>Open Access</Text>
          </View>
        )}
      </View>
      
      {paper.abstract ? (
        <Text style={[styles.abstract, { color: themeColors.subText }]} numberOfLines={3}>
          {paper.abstract}
        </Text>
      ) : (
        <Text style={[styles.abstract, { color: themeColors.subText, fontStyle: 'italic' }]}>
          No abstract available.
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  authors: {
    fontSize: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  abstract: {
    fontSize: 14,
    lineHeight: 20,
  },
});
