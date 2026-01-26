import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/colors';
import { RootStackParamList, YouTubeSearchResult } from '../types';
import { Button, Card, Input } from '../components/common';
import { SongCard } from '../components/game';
import { useRoom } from '../hooks/useRoom';
import { useGame } from '../hooks/useGame';
import { useAuth } from '../hooks/useAuth';
import { searchYouTube } from '../services/youtubeService';

type AddSongsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddSongs'>;
  route: RouteProp<RootStackParamList, 'AddSongs'>;
};

export const AddSongsScreen: React.FC<AddSongsScreenProps> = ({
  navigation,
  route,
}) => {
  const { roomId } = route.params;
  const { user } = useAuth();
  const { room, players, isHost, updateStatus, roomDeleted } = useRoom(roomId);
  const {
    songs,
    mySongs,
    requiredSongsCount,
    hasEnoughSongs,
    allPlayersHaveEnoughSongs,
    addSong,
    removeSong,
    startGame,
  } = useGame(roomId);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingSong, setIsAddingSong] = useState(false);

  // Handle room deletion (host left)
  useEffect(() => {
    if (roomDeleted) {
      Alert.alert(
        'Room Closed',
        'The host has closed the room.',
        [{ text: 'OK', onPress: () => navigation.replace('Home') }],
        { cancelable: false }
      );
    }
  }, [roomDeleted, navigation]);

  // Handle room status changes
  useEffect(() => {
    if (room?.status === 'playing') {
      navigation.replace('Game', { roomId });
    }
  }, [room?.status, roomId, navigation]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // Hide keyboard so user can easily tap on results
    Keyboard.dismiss();

    setIsSearching(true);
    try {
      const results = await searchYouTube(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Search Error', 'Failed to search YouTube. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = async (result: YouTubeSearchResult) => {
    if (mySongs.length >= requiredSongsCount) {
      Alert.alert(
        'Limit Reached',
        `You can only add ${requiredSongsCount} songs.`
      );
      return;
    }

    // Validate that the result has required data
    if (!result.videoId) {
      Alert.alert('Error', 'Invalid video. Please try a different song.');
      return;
    }

    setIsAddingSong(true);
    try {
      await addSong(result.videoId, result.title || 'Unknown Song', result.thumbnail || '');
      // Clear from search results
      setSearchResults((prev) =>
        prev.filter((r) => r.videoId !== result.videoId)
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add song. Please try again.');
    } finally {
      setIsAddingSong(false);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    await removeSong(songId);
  };

  const handleStartGame = async () => {
    if (!allPlayersHaveEnoughSongs) {
      Alert.alert(
        'Not Ready',
        'All players must add their songs before starting.'
      );
      return;
    }

    await startGame();
  };

  const renderSearchResult = ({ item }: { item: YouTubeSearchResult }) => {
    const isAlreadyAdded = mySongs.some((s) => s.youtubeId === item.videoId);

    return (
      <TouchableOpacity
        style={styles.searchResult}
        onPress={() => handleAddSong(item)}
        disabled={isAlreadyAdded || isAddingSong || mySongs.length >= requiredSongsCount}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.resultChannel}>{item.channelTitle}</Text>
        </View>
        {isAlreadyAdded ? (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        ) : (
          <Ionicons name="add-circle" size={24} color={colors.neonPink} />
        )}
      </TouchableOpacity>
    );
  };

  // Calculate progress using all songs (not just mySongs)
  const getPlayerProgress = () => {
    return players.map((player) => {
      const playerSongCount = songs.filter(
        (s) => s.addedBy === player.id
      ).length;
      return {
        ...player,
        songCount: playerSongCount,
        isComplete: playerSongCount >= requiredSongsCount,
      };
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Add Songs</Text>
        <View style={styles.progress}>
          <Text style={styles.progressText}>
            {mySongs.length}/{requiredSongsCount}
          </Text>
        </View>
      </View>

      {/* My Songs Section */}
      {mySongs.length > 0 && (
        <View style={styles.mySongsSection}>
          <Text style={styles.sectionTitle}>Your Songs ({mySongs.length}/{requiredSongsCount})</Text>
          <View style={styles.mySongsList}>
            {mySongs.map((song) => (
              <View key={song.id} style={styles.mySongItem}>
                <Image source={{ uri: song.thumbnail }} style={styles.mySongThumbnail} />
                <Text style={styles.mySongTitle} numberOfLines={1}>{song.title}</Text>
                <TouchableOpacity onPress={() => handleRemoveSong(song.id)} style={styles.removeSongButton}>
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Search Section */}
      {!hasEnoughSongs && (
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Input
              placeholder="Search for songs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              icon="search"
              containerStyle={styles.searchInput}
            />
            <Button
              title="Search"
              onPress={handleSearch}
              loading={isSearching}
              disabled={!searchQuery.trim()}
            />
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => item.videoId || `search-${index}`}
              renderItem={renderSearchResult}
              style={styles.searchResults}
              contentContainerStyle={styles.searchResultsContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            />
          )}

          {isSearching && (
            <View style={styles.searchingIndicator}>
              <ActivityIndicator color={colors.neonPink} />
              <Text style={styles.searchingText}>Searching...</Text>
            </View>
          )}
        </View>
      )}

      {/* Completed Message */}
      {hasEnoughSongs && (
        <Card style={styles.completedCard}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.completedTitle}>All songs added!</Text>
          <Text style={styles.completedText}>
            {isHost
              ? 'Waiting for other players to finish...'
              : 'Waiting for the host to start the game...'}
          </Text>
        </Card>
      )}

      {/* Player Progress */}
      <View style={styles.playerProgress}>
        <Text style={styles.sectionTitle}>Player Progress</Text>
        <View style={styles.progressList}>
          {getPlayerProgress().map((player) => (
            <View key={player.id} style={styles.playerProgressItem}>
              <Text style={styles.playerName}>{player.name}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(player.songCount / requiredSongsCount) * 100}%`,
                      backgroundColor: player.isComplete
                        ? colors.success
                        : colors.neonPink,
                    },
                  ]}
                />
              </View>
              {player.isComplete && (
                <Ionicons name="checkmark" size={16} color={colors.success} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Start Button (Host only) */}
      {isHost && (
        <View style={styles.footer}>
          <Button
            title="Start Game"
            onPress={handleStartGame}
            size="large"
            fullWidth
            disabled={!allPlayersHaveEnoughSongs}
            icon={<Ionicons name="play" size={24} color={colors.textPrimary} />}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  progress: {
    backgroundColor: colors.neonPink + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  progressText: {
    color: colors.neonPink,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  mySongsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  mySongsList: {
    gap: spacing.sm,
  },
  mySongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  mySongThumbnail: {
    width: 50,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  mySongTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
  },
  removeSongButton: {
    padding: spacing.xs,
  },
  searchSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchResults: {
    flex: 1,
    marginTop: spacing.md,
  },
  searchResultsContent: {
    gap: spacing.sm,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  thumbnail: {
    width: 80,
    height: 45,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  resultChannel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  searchingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  completedCard: {
    flex: 1,
    margin: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  completedTitle: {
    color: colors.success,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  completedText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  playerProgress: {
    padding: spacing.lg,
  },
  progressList: {
    gap: spacing.sm,
  },
  playerProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    padding: spacing.lg,
  },
});

export default AddSongsScreen;
