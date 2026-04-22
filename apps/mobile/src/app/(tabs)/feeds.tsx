import { View } from 'react-native';
import { useColors } from '../../theme/use-colors';
import { EmptyState } from '../../components/EmptyState';

export default function FeedsScreen() {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <EmptyState
        title="Feeds"
        message="Coming soon"
        colors={colors}
      />
    </View>
  );
}
