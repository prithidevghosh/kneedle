import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { youtubeId } from '../utils/reps';

export default function YouTubePlayer({ url, height = 200, autoplay = false }) {
  const id = youtubeId(url);
  if (!id) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.fallbackTxt}>Video unavailable</Text>
      </View>
    );
  }
  const src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1${autoplay ? '&autoplay=1' : ''}`;
  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>
    <style>
      html,body{margin:0;padding:0;background:#000;height:100%;}
      .wrap{position:relative;width:100%;height:100%;}
      iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}
    </style></head>
    <body><div class="wrap">
      <iframe src="${src}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div></body></html>`;
  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={!autoplay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
  fallback: {
    backgroundColor: '#1a3326', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  fallbackTxt: { color: '#fff', fontSize: 12 },
});
