import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../design-system';
import { ProteinWebView, type ProteinWebViewHandle } from './ProteinWebView';

interface ProteinViewScreenProps {
  code: string;
  raw: string;
  onBack: () => void;
}

export function ProteinViewScreen({ code, raw, onBack }: ProteinViewScreenProps) {
  const webviewRef = useRef<ProteinWebViewHandle>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to ligand list"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>{code}</Text>
        <Pressable
          onPress={() => webviewRef.current?.requestSnapshot()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Share this ligand"
        >
          <Ionicons name="share-outline" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <ProteinWebView ref={webviewRef} code={code} raw={raw} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.subtitle,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
});
