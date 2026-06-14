import { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { Game } from '../types';
import { calculateCirclePositions } from '../utils/layout';
import PlayerSeat from './PlayerSeat';

interface PlayerCircleProps {
  game: Game;
  dragMode: boolean;
  onPlayerPress: (playerId: string) => void;
  onUpdatePosition: (playerId: string, x: number, y: number) => void;
  onLockPosition: (playerId: string) => void;
  onReleasePosition: (playerId: string) => void;
}

// SVG connecting lines — web-only via inline SVG
function ConnectingLines({
  positions,
  playerIds,
  width,
  height,
}: {
  positions: Record<
    string,
    {
      x: number;
      y: number;
    }
  >;
  playerIds: string[];
  width: number;
  height: number;
}) {
  if (playerIds.length < 3 || typeof document === 'undefined') return null;

  const lines: string[] = [];
  for (let i = 0; i < playerIds.length; i++) {
    const j = (i + 1) % playerIds.length;
    const p1 = positions[playerIds[i]];
    const p2 = positions[playerIds[j]];
    if (!p1 || !p2) continue;
    lines.push(
      `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />`,
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
        zIndex: 0,
      }}
      dangerouslySetInnerHTML={{
        __html: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="position:absolute;top:0;left:0;width:${width}px;height:${height}px;pointer-events:none">${lines.join('')}</svg>`,
      }}
    />
  );
}

export default function PlayerCircle({
  game,
  dragMode,
  onPlayerPress,
  onUpdatePosition,
  onLockPosition,
}: PlayerCircleProps) {
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
  const STORAGE_KEY = 'grim-keeper-circle-pan';
  const loadPan = (): {
    x: number;
    y: number;
  } => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      x: 0,
      y: 0,
    };
  };
  const savePan = (pos: { x: number; y: number }) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
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

  useEffect(() => {
    if (game.players.length === 0) return;
    const circlePositions = calculateCirclePositions(
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
        : circlePositions[i];
    });
    setPositions(newPositions);

    if (!initialized.current) {
      initialized.current = true;
      game.players.forEach((player, i) => {
        if (!player.positionLocked) {
          onUpdatePosition(
            player.id,
            circlePositions[i].x,
            circlePositions[i].y,
          );
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
        <Text style={styles.emptySubtext}>They'll be arranged in a circle</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
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
        {/* Connecting lines between players */}
        <ConnectingLines
          positions={positions}
          playerIds={game.players.map(p => p.id)}
          width={width}
          height={height}
        />

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
              panX={pan.x}
              panY={pan.y}
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
});
