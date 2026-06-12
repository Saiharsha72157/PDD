import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../services/ThemeContext';
import { generateSummary, generateInsights, generateLiteratureReview, generateCitation } from '../services/researchLlm';
import { Paper } from '../services/researchApi';

export default function ResearchAiAnalysisScreen() {
  const { themeColors } = useAppTheme();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  const { paper, analysisType } = route.params as { paper: Paper, analysisType: string };

  useEffect(() => {
    const runAnalysis = async () => {
      setLoading(true);
      try {
        let res;
        switch (analysisType) {
          case 'summarize':
            res = await generateSummary(paper.abstract || '', 'Detailed');
            break;
          case 'insights':
            res = await generateInsights(paper.abstract || '');
            break;
          case 'review':
            res = await generateLiteratureReview([paper]);
            break;
          case 'citation':
            res = generateCitation(paper, 'IEEE');
            break;
          case 'beginner':
            res = await generateSummary(paper.abstract || '', 'Short');
            break;
          case 'ppt':
            res = '[PPT Generation] This feature requires a backend integration to output .pptx files, but here is the slide outline:\n\nSlide 1: Title\nSlide 2: Introduction\nSlide 3: Methodology\nSlide 4: Results';
            break;
          default:
            res = 'Unknown analysis type.';
        }
        setResult(res);
      } catch (e: any) {
        console.error(e);
        Alert.alert("Analysis Error", e.message || "Failed to generate AI analysis. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    runAnalysis();
  }, [paper, analysisType]);

  const getTitle = () => {
    switch(analysisType) {
      case 'summarize': return 'AI Summary';
      case 'insights': return 'Key Insights';
      case 'review': return 'Literature Review';
      case 'citation': return 'Citation Generator';
      case 'beginner': return 'Beginner Explanation';
      case 'ppt': return 'PPT Outline';
      default: return 'Analysis';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{getTitle()}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.paperInfo, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.paperTitle, { color: themeColors.text }]} numberOfLines={2}>
            {paper.title}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.loadingText, { color: themeColors.subText }]}>Generating Intelligence...</Text>
          </View>
        ) : (
          <View style={[styles.resultBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            {typeof result === 'string' ? (
              <Text style={[styles.resultText, { color: themeColors.text }]}>{result}</Text>
            ) : (
              <View>
                {result?.findings && (
                  <>
                    <Text style={[styles.subTitle, { color: themeColors.text }]}>Key Findings</Text>
                    {result.findings.map((f: string, i: number) => (
                      <Text key={`f-${i}`} style={[styles.listItem, { color: themeColors.text }]}>• {f}</Text>
                    ))}
                  </>
                )}
                {result?.contributions && (
                  <>
                    <Text style={[styles.subTitle, { color: themeColors.text, marginTop: 16 }]}>Contributions</Text>
                    {result.contributions.map((c: string, i: number) => (
                      <Text key={`c-${i}`} style={[styles.listItem, { color: themeColors.text }]}>• {c}</Text>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        )}
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
  paperInfo: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
    paddingLeft: 8,
  }
});
