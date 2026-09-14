import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Route, RouteStop, TruckLocation } from '../../types/routeModels';
import { COLORS, FONTS } from '../../config/theme';

export interface RouteMapProps {
  route?: Route | null;
  truckLocation?: TruckLocation | null;
  stops: RouteStop[];
  currentStopId?: string | null;
  onStopPress?: (stop: RouteStop) => void;
}

const isValidCoordinate = (lat?: number, lon?: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
};

export const RouteMap: React.FC<RouteMapProps> = ({
  truckLocation,
  stops,
  currentStopId,
  onStopPress,
}) => {
  // Extract valid ordered coordinates for Polyline
  const routeCoordinates = useMemo(() => {
    if (!stops || stops.length === 0) return [];
    return [...stops]
      .filter((stop) => isValidCoordinate(stop.latitude, stop.longitude))
      .sort((a, b) => a.sequence - b.sequence)
      .map((stop) => ({
        lat: stop.latitude,
        lng: stop.longitude,
      }));
  }, [stops]);

  // Center calculation
  const center = useMemo(() => {
    const validStops = (stops || []).filter((s) => isValidCoordinate(s.latitude, s.longitude));

    if (validStops.length === 0) {
      const defaultLat = isValidCoordinate(truckLocation?.latitude, truckLocation?.longitude)
        ? truckLocation!.latitude
        : 37.7749;
      const defaultLon = isValidCoordinate(truckLocation?.latitude, truckLocation?.longitude)
        ? truckLocation!.longitude
        : -122.4194;
      return { lat: defaultLat, lng: defaultLon };
    }

    const lats = validStops.map((s) => s.latitude);
    const lons = validStops.map((s) => s.longitude);

    if (truckLocation && isValidCoordinate(truckLocation.latitude, truckLocation.longitude)) {
      lats.push(truckLocation.latitude);
      lons.push(truckLocation.longitude);
    }

    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lons) + Math.max(...lons)) / 2,
    };
  }, [stops, truckLocation]);

  // Format stop markers JSON data for Leaflet
  const stopsJson = useMemo(() => {
    return (stops || [])
      .filter((s) => isValidCoordinate(s.latitude, s.longitude))
      .map((stop) => {
        const isCurrent = stop.id === currentStopId || stop.status === 'IN_PROGRESS';
        const isCompleted = stop.status === 'COLLECTED';
        const isSkipped = stop.status === 'SKIPPED';
        return {
          id: stop.id,
          sequence: stop.sequence,
          name: stop.householdName,
          address: stop.address,
          status: stop.status,
          weight: stop.estimatedWeightKg,
          lat: stop.latitude,
          lng: stop.longitude,
          isCurrent,
          isCompleted,
          isSkipped,
        };
      });
  }, [stops, currentStopId]);

  // Format Truck location JSON
  const truckLocationJson = useMemo(() => {
    if (truckLocation && isValidCoordinate(truckLocation.latitude, truckLocation.longitude)) {
      return {
        lat: truckLocation.latitude,
        lng: truckLocation.longitude,
        speed: truckLocation.speedKmH || 0,
      };
    }
    return null;
  }, [truckLocation]);

  // Build Leaflet HTML content with OpenStreetMap tiles
  const htmlContent = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F0FDF4; font-family: sans-serif; }
    .leaflet-container { background: #F0FDF4; }
    .stop-pin {
      width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .current-pin { width: 36px; height: 36px; border-width: 3px; font-size: 13px; transform: scale(1.1); }
    .truck-pin {
      width: 40px; height: 40px; border-radius: 50%; background: #065F46; border: 3px solid #059669;
      display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    try {
      var map = L.map('map', { zoomControl: false }).setView([${center.lat}, ${center.lng}], 15);
      
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      var coordinates = ${JSON.stringify(routeCoordinates.map((c) => [c.lat, c.lng]))};
      if (coordinates.length > 1) {
        var polyline = L.polyline(coordinates, { color: '#059669', weight: 5, opacity: 0.85 }).addTo(map);
        map.fitBounds(polyline.getBounds().pad(0.2));
      }

      var stops = ${JSON.stringify(stopsJson)};
      stops.forEach(function(stop) {
        var color = '#065F46'; // Pending Forest Green
        if (stop.isCompleted) color = '#059669'; // Collected Emerald Green
        if (stop.isSkipped) color = '#EF4444'; // Skipped Red
        if (stop.isCurrent) color = '#F59E0B'; // Current Amber

        var iconHtml = '<div class="stop-pin ' + (stop.isCurrent ? 'current-pin' : '') + '" style="background:' + color + ';">' +
                       (stop.isCompleted ? '✓' : stop.sequence) + '</div>';
        var customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
        var marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map);
        
        var popupContent = '<b>Stop #' + stop.sequence + ' - ' + stop.name + '</b><br/>' +
                           '📍 ' + stop.address + '<br/>' +
                           'Status: ' + stop.status + ' • ' + stop.weight + ' kg';
        marker.bindPopup(popupContent);

        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STOP_PRESS', stopId: stop.id }));
          }
        });
      });

      var truck = ${JSON.stringify(truckLocationJson)};
      if (truck) {
        var truckIcon = L.divIcon({
          html: '<div class="truck-pin">🚚</div>',
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        var truckMarker = L.marker([truck.lat, truck.lng], { icon: truckIcon, zIndexOffset: 1000 }).addTo(map);
        truckMarker.bindPopup('<b>Truck T1 (EcoVolt)</b><br/>Speed: ' + truck.speed + ' km/h');
      }
    } catch(e) {
      console.error(e);
    }
  </script>
</body>
</html>
    `;
  }, [center, routeCoordinates, stopsJson, truckLocationJson]);

  // Handle messages sent from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'STOP_PRESS' && data.stopId && onStopPress) {
        const foundStop = stops.find((s) => s.id === data.stopId);
        if (foundStop) {
          onStopPress(foundStop);
        }
      }
    } catch (e) {
      console.error('WebView message parse error:', e);
    }
  };

  // Web platform fallback via srcDoc iframe
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {/* @ts-ignore - Web iframe embed for OpenStreetMap preview */}
        <iframe
          title="OpenStreetMap View"
          srcDoc={htmlContent}
          style={{ border: 0, width: '100%', height: '100%' }}
        />
        <View style={styles.attributionBadge} pointerEvents="none">
          <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
        </View>
      </View>
    );
  }

  // Mobile platforms (Android & iOS) via react-native-webview
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false}
        scrollEnabled={false}
        overScrollMode="never"
      />
      <View style={styles.attributionBadge} pointerEvents="none">
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F0FDF4',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  attributionBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 999,
  },
  attributionText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: FONTS.weight.medium,
  },
});


