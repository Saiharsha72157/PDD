import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../services/ThemeContext';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { openAccess: boolean; yearRange: string; ieeeOnly: boolean }) => void;
}

export default function FilterModal({ visible, onClose, onApply }: FilterModalProps) {
  const { themeColors } = useAppTheme();
  const [openAccess, setOpenAccess] = useState(false);
  const [ieeeOnly, setIeeeOnly] = useState(false);
  const [yearRange, setYearRange] = useState('Since 2020');

  const years = ['All', 'Since 2024', 'Since 2023', 'Since 2020'];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>Advanced Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Sources & Availability</Text>
            
            <TouchableOpacity 
              style={[styles.checkboxContainer, ieeeOnly && { borderColor: themeColors.primary }, { marginBottom: 12 }]}
              onPress={() => setIeeeOnly(!ieeeOnly)}
            >
              <Ionicons 
                name={ieeeOnly ? "checkbox" : "square-outline"} 
                size={24} 
                color={ieeeOnly ? themeColors.primary : themeColors.subText} 
              />
              <Text style={[styles.checkboxLabel, { color: themeColors.text }]}>Prioritize IEEE Papers</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.checkboxContainer, openAccess && { borderColor: themeColors.primary }]}
              onPress={() => setOpenAccess(!openAccess)}
            >
              <Ionicons 
                name={openAccess ? "checkbox" : "square-outline"} 
                size={24} 
                color={openAccess ? themeColors.primary : themeColors.subText} 
              />
              <Text style={[styles.checkboxLabel, { color: themeColors.text }]}>Open Access Only</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 24 }]}>Publication Year</Text>
            <View style={styles.pillContainer}>
              {years.map(y => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.pill,
                    { borderColor: themeColors.border },
                    yearRange === y && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                  ]}
                  onPress={() => setYearRange(y)}
                >
                  <Text style={[
                    styles.pillText,
                    { color: themeColors.text },
                    yearRange === y && { color: '#FFF' }
                  ]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: themeColors.primary }]}
              onPress={() => {
                onApply({ openAccess, yearRange, ieeeOnly });
                onClose();
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  applyButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
