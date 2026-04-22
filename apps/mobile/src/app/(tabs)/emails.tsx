import { View } from 'react-native';
import { useColors } from '../../theme/use-colors';
import { EmptyState } from '../../components/EmptyState';

export default function EmailsScreen() {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <EmptyState
        title="Emails"
        message="Coming soon"
        colors={colors}
      />
    </View>
  );
}
