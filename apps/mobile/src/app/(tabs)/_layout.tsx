import {NativeTabs} from 'expo-router/native-tabs';
import {View} from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import {useColors} from '../../theme/use-colors';
import {ReaderPane} from '../../components/ReaderPane';
import {ReaderPaneProvider, useReaderPane} from '../../services/reader-pane';

export default function TabsLayout() {
  return (
    <ReaderPaneProvider>
      <ReaderShell />
    </ReaderPaneProvider>
  );
}

// Long enough to read as a slide rather than a snap. Reanimated honours the
// system Reduce Motion setting by default, so these collapse to an instant swap
// there.
const SLIDE_MS = 450;
const listResize = LinearTransition.duration(SLIDE_MS).easing(Easing.inOut(Easing.cubic));
const paneEnter = SlideInRight.duration(SLIDE_MS).easing(Easing.out(Easing.cubic));
const paneExit = SlideOutRight.duration(SLIDE_MS).easing(Easing.in(Easing.cubic));

// With a link open in landscape, the tabs are pinned left beside the reader;
// otherwise they fill the window. The tree shape is identical in every mode so
// rotating or folding never remounts the tabs.
function ReaderShell() {
  const colors = useColors();
  const {layout, url, close} = useReaderPane();
  const isSplit = layout.mode === 'split';

  return (
    <View style={{flex: 1, flexDirection: 'row', backgroundColor: colors.bg}}>
      <Animated.View layout={listResize} style={isSplit ? {width: layout.listWidth} : {flex: 1}}>
        <TabsNavigator />
      </Animated.View>
      {/* The wrapper mounts once per open, so it slides only on open and close;
          picking another link swaps the page inside without re-sliding. */}
      {isSplit && url ? (
        <Animated.View entering={paneEnter} exiting={paneExit} style={{flex: 1}}>
          <ReaderPane key={url} url={url} onClose={close} />
        </Animated.View>
      ) : null}
    </View>
  );
}

// Native tabs: UIKit places the bar itself, at the bottom when unfolded and as
// a rail in the right-hand strip of the closed Duo's cover screen.
function TabsNavigator() {
  const colors = useColors();

  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="daily">
        <NativeTabs.Trigger.Label>Daily</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="compendium">
        <NativeTabs.Trigger.Label>Compendium</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="books.vertical" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(queue)">
        <NativeTabs.Trigger.Label>Queue</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tray" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="feeds">
        <NativeTabs.Trigger.Label>RSS</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="dot.radiowaves.up.forward" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="emails">
        <NativeTabs.Trigger.Label>Emails</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="envelope" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
