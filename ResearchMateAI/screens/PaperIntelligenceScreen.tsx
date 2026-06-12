import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../services/ThemeContext';
import { Paper } from '../services/researchApi';
import { toggleFavorite, isFavorite } from '../services/researchStorage';

import { useTranslation } from '../services/localization';

export default function PaperIntelligenceScreen() {
  const { t } = useTranslation();
  const { themeColors } = useAppTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isFavoriteState, setIsFavoriteState] = useState(false);
  
  const { paper } = route.params as { paper: Paper };

  useEffect(() => {
    if (paper) {
      checkFavorite();
    }
  }, [paper]);

  const checkFavorite = async () => {
    const isFav = await isFavorite(paper.paperId);
    setIsFavoriteState(isFav);
  };

  const handleToggleFavorite = async () => {
    const added = await toggleFavorite(paper);
    setIsFavoriteState(added);
  };

  const handleOpenPdf = () => {
    if (paper.openAccessPdf?.url) {
      Linking.openURL(paper.openAccessPdf.url);
    } else if (paper.url) {
      Linking.openURL(paper.url);
    } else {
      Alert.alert('Not Available', 'PDF URL is not available.');
    }
  };


  if (!paper) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("paper_intelligence_title")}</Text>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Ionicons name={isFavoriteState ? "heart" : "heart-outline"} size={24} color={isFavoriteState ? "red" : themeColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>{paper.title}</Text>
        <Text style={[styles.authors, { color: themeColors.primary }]}>
          {paper.authors.map(a => a.name).join(', ')}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: themeColors.subText }]}>{paper.year || 'N/A'}</Text>
          <Text style={[styles.metaText, { color: themeColors.subText }]}>•</Text>
          <Text style={[styles.metaText, { color: themeColors.subText }]}>{paper.citationCount} Citations</Text>
          <Text style={[styles.metaText, { color: themeColors.subText }]}>•</Text>
          <Text style={[styles.metaText, { color: themeColors.subText }]}>{paper.venue || 'Unknown Venue'}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.pdfButton, { backgroundColor: paper.isOpenAccess ? '#4CAF50' : themeColors.card, borderColor: paper.isOpenAccess ? '#4CAF50' : themeColors.border }]}
          onPress={handleOpenPdf}
        >
          <Ionicons name="document-text" size={20} color={paper.isOpenAccess ? '#FFF' : themeColors.text} />
          <Text style={[styles.pdfButtonText, { color: paper.isOpenAccess ? '#FFF' : themeColors.text }]}>
            {paper.isOpenAccess ? 'Download Open Access PDF' : 'Available on Publisher Website'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.section, { borderTopColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t("abstract_title")}</Text>
          <Text style={[styles.abstract, { color: themeColors.text }]}>
            {paper.abstract || 'No abstract available.'}
          </Text>
        </View>


      </ScrollView>
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  authors: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  metaText: {
    fontSize: 14,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingTop: 20,
    borderTopWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  abstract: {
    fontSize: 15,
    lineHeight: 24,
  }
});
