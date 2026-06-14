import { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { Game } from '../types';
import { calculateRoomPositions } from '../utils/layout';
import { platformGetItem, platformSetItem } from '../utils/platformStorage';
import PlayerSeat from './PlayerSeat';

interface PlayerRoomProps {
  game: Game;
  dragMode: boolean;
  onPlayerPress: (playerId: string) => void;
  onUpdatePosition: (playerId: string, x: number, y: number) => void;
  onLockPosition: (playerId: string) => void;
  onReleasePosition: (playerId: string) => void;
}

export default function PlayerRoom({
  game,
  dragMode,
  onPlayerPress,
  onUpdatePosition,
  onLockPosition,
}: PlayerRoomProps) {
  const { width, height } = useWindowDimensions();
  const seatSize = Math.min(80, Math.min(width, height) * 0.16);
  const [positions, setPositions] = useState<
    Record<
      string,
      {
        x: number;
        y: number;
      }
    >
  >({});
  const initialized = useRef(false);

  // ── Canvas pan offset ──
  const STORAGE_KEY = 'grim-keeper-room-pan';
  const loadPan = (): {
    x: number;
    y: number;
  } => {
    try {
      const raw = platformGetItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      x: -300,
      y: 0,
    };
  };
  const savePan = (pos: { x: number; y: number }) => {
    try {
      platformSetItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {}
  };

  const initialPan = useRef(loadPan());
  const panOffset = useRef({
    ...initialPan.current,
  });
  const [pan, setPan] = useState({
    ...initialPan.current,
  });
  const dragRef = useRef(dragMode);
  dragRef.current = dragMode;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => dragRef.current,
      onMoveShouldSetPanResponder: () => dragRef.current,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gs) => {
        setPan({
          x: panOffset.current.x + gs.dx,
          y: panOffset.current.y + gs.dy,
        });
      },
      onPanResponderRelease: (_, gs) => {
        panOffset.current.x += gs.dx;
        panOffset.current.y += gs.dy;
        savePan(panOffset.current);
        setPan({
          ...panOffset.current,
        });
      },
      onPanResponderTerminate: () => {
        savePan(panOffset.current);
        setPan({
          ...panOffset.current,
        });
      },
    }),
  ).current;

  // Calculate room positions
  useEffect(() => {
    if (game.players.length === 0) return;
    const roomPositions = calculateRoomPositions(
      game.players,
      width,
      height,
      seatSize,
    );
    const newPositions: Record<
      string,
      {
        x: number;
        y: number;
      }
    > = {};
    game.players.forEach((player, i) => {
      newPositions[player.id] = player.positionLocked
        ? player.position
        : roomPositions[i];
    });
    setPositions(newPositions);

    if (!initialized.current) {
      initialized.current = true;
      game.players.forEach((player, i) => {
        if (!player.positionLocked) {
          onUpdatePosition(player.id, roomPositions[i].x, roomPositions[i].y);
        }
      });
    }
  }, [
    game.players.length,
    width,
    height,
    onUpdatePosition,
    seatSize,
    game.players.forEach,
    game.players,
  ]);

  if (game.players.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Add players to the game</Text>
        <Text style={styles.emptySubtext}>
          They'll be seated along the walls
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Pannable content layer */}
      <View
        style={[
          styles.canvas,
          {
            transform: [
              {
                translateX: pan.x,
              },
              {
                translateY: pan.y,
              },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Room walls outline */}
        <View
          style={[
            styles.room,
            {
              left: width / 2 - Math.min(width * 0.35, 300),
              top: height / 2 - Math.min(height * 0.3, 200),
              width: Math.min(width * 0.7, 600),
              height: Math.min(height * 0.6, 400),
            },
          ]}
        >
          <View style={styles.wallTop} />
          <View style={styles.wallBottom} />
          <View style={styles.wallLeft} />
          <View style={styles.wallRight} />
          <Text style={styles.roomLabel}>Room</Text>
        </View>

        {/* Player seats */}
        {game.players.map(player => {
          const pos = positions[player.id] || player.position;
          return (
            <PlayerSeat
              key={player.id}
              player={{
                ...player,
                position: pos,
              }}
              size={seatSize}
              editMode={game.editMode}
              onPress={() => onPlayerPress(player.id)}
              onDragStart={() => {}}
              onDragMove={(x, y) => {
                onUpdatePosition(player.id, x, y);
                setPositions(prev => ({
                  ...prev,
                  [player.id]: {
                    x,
                    y,
                  },
                }));
              }}
              onDragEnd={() => onLockPosition(player.id)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  room: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wallTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  wallBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  wallLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  wallRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 2,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  roomLabel: {
    color: 'rgba(255,255,255,0.1)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 3,
  },
});
