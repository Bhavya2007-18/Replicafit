/**
 * Strivio Social Features Service
 * Community engagement, challenges, and social motivation
 * Friend connections, group workouts, and shared achievements
 */

class SocialFeaturesEngine {
  constructor() {
    this.userProfiles = new Map();
    this.friendships = new Map();
    this.groups = new Map();
    this.challenges = new Map();
    this.activities = new Map();
    this.notifications = new Map();
    this.leaderboards = new Map();
  }

  /**
   * Initialize user social profile
   */
  initializeUserProfile(userId, userProfile) {
    const socialProfile = {
      userId,
      username: userProfile.username || `user_${userId}`,
      displayName: userProfile.displayName || userProfile.username,
      avatar: userProfile.avatar || null,
      bio: userProfile.bio || '',
      location: userProfile.location || '',
      stats: {
        friendsCount: 0,
        groupsCount: 0,
        challengesJoined: 0,
        challengesCompleted: 0,
        workoutsShared: 0,
        achievementsShared: 0
      },
      privacy: {
        profileVisibility: 'friends', // public, friends, private
        workoutSharing: true,
        achievementsSharing: true,
        allowFriendRequests: true
      },
      preferences: {
        notifications: true,
        activityUpdates: true,
        challengeInvites: true,
        friendRequests: true
      },
      friends: [],
      groups: [],
      challenges: [],
      recentActivities: []
    };

    this.userProfiles.set(userId, socialProfile);
    return socialProfile;
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(fromUserId, toUserId) {
    const fromProfile = this.getUserProfile(fromUserId);
    const toProfile = this.getUserProfile(toUserId);

    if (!fromProfile || !toProfile) {
      return { success: false, error: 'User not found' };
    }

    // Check if already friends
    if (fromProfile.friends.includes(toUserId)) {
      return { success: false, error: 'Already friends' };
    }

    // Check if request already sent
    const existingRequest = this.getFriendRequest(fromUserId, toUserId);
    if (existingRequest) {
      return { success: false, error: 'Friend request already sent' };
    }

    // Create friend request
    const friendRequest = {
      id: `req_${fromUserId}_${toUserId}_${Date.now()}`,
      fromUserId,
      toUserId,
      status: 'pending',
      sentAt: new Date().toISOString(),
      message: `${fromProfile.displayName} wants to be your friend!`
    };

    // Store request
    if (!this.friendships.has(toUserId)) {
      this.friendships.set(toUserId, []);
    }
    this.friendships.get(toUserId).push(friendRequest);

    // Create notification
    this.createNotification(toUserId, {
      type: 'friend_request',
      title: 'New Friend Request',
      message: friendRequest.message,
      data: { requestId: friendRequest.id, fromUserId },
      actionRequired: true
    });

    return { success: true, requestId: friendRequest.id };
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId, userId) {
    const userRequests = this.friendships.get(userId) || [];
    const request = userRequests.find(req => req.id === requestId);

    if (!request || request.toUserId !== userId) {
      return { success: false, error: 'Request not found' };
    }

    // Update request status
    request.status = 'accepted';
    request.respondedAt = new Date().toISOString();

    // Add to friends lists
    const fromProfile = this.getUserProfile(request.fromUserId);
    const toProfile = this.getUserProfile(userId);

    if (fromProfile && toProfile) {
      fromProfile.friends.push(userId);
      toProfile.friends.push(request.fromUserId);
      fromProfile.stats.friendsCount++;
      toProfile.stats.friendsCount++;

      // Create mutual notifications
      this.createNotification(request.fromUserId, {
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${toProfile.displayName} accepted your friend request!`,
        data: { friendId: userId }
      });

      this.createNotification(userId, {
        type: 'friend_added',
        title: 'New Friend',
        message: `You are now friends with ${fromProfile.displayName}!`,
        data: { friendId: request.fromUserId }
      });

      // Add to activity feeds
      this.addActivity(userId, {
        type: 'friend_added',
        message: `Made friends with ${fromProfile.displayName}`,
        data: { friendId: request.fromUserId, friendName: fromProfile.displayName }
      });

      this.addActivity(request.fromUserId, {
        type: 'friend_added',
        message: `Made friends with ${toProfile.displayName}`,
        data: { friendId: userId, friendName: toProfile.displayName }
      });
    }

    return { success: true, friendId: request.fromUserId };
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(requestId, userId) {
    const userRequests = this.friendships.get(userId) || [];
    const request = userRequests.find(req => req.id === requestId);

    if (!request || request.toUserId !== userId) {
      return { success: false, error: 'Request not found' };
    }

    request.status = 'declined';
    request.respondedAt = new Date().toISOString();

    return { success: true };
  }

  /**
   * Get friend request
   */
  getFriendRequest(fromUserId, toUserId) {
    const requests = this.friendships.get(toUserId) || [];
    return requests.find(req => req.fromUserId === fromUserId && req.status === 'pending');
  }

  /**
   * Get user's friends
   */
  getUserFriends(userId) {
    const profile = this.getUserProfile(userId);
    if (!profile) return [];

    return profile.friends.map(friendId => {
      const friendProfile = this.getUserProfile(friendId);
      return friendProfile ? {
        userId: friendId,
        username: friendProfile.username,
        displayName: friendProfile.displayName,
        avatar: friendProfile.avatar,
        bio: friendProfile.bio,
        stats: friendProfile.stats
      } : null;
    }).filter(Boolean);
  }

  /**
   * Create workout group
   */
  async createGroup(userId, groupData) {
    const creatorProfile = this.getUserProfile(userId);
    if (!creatorProfile) {
      return { success: false, error: 'User not found' };
    }

    const group = {
      id: `group_${Date.now()}`,
      name: groupData.name,
      description: groupData.description || '',
      type: groupData.type || 'public', // public, private, invite_only
      category: groupData.category || 'general',
      creatorId: userId,
      createdAt: new Date().toISOString(),
      members: [{
        userId,
        role: 'admin',
        joinedAt: new Date().toISOString()
      }],
      settings: {
        allowMemberInvites: groupData.allowMemberInvites !== false,
        requireApproval: groupData.requireApproval || false,
        maxMembers: groupData.maxMembers || 50
      },
      stats: {
        memberCount: 1,
        totalWorkouts: 0,
        activeMembers: 1,
        challengesCompleted: 0
      },
      activity: []
    };

    this.groups.set(group.id, group);
    
    // Add to user's groups
    creatorProfile.groups.push(group.id);
    creatorProfile.stats.groupsCount++;

    // Create activity
    this.addActivity(userId, {
      type: 'group_created',
      message: `Created group "${group.name}"`,
      data: { groupId: group.id, groupName: group.name }
    });

    return { success: true, group };
  }

  /**
   * Join group
   */
  async joinGroup(userId, groupId) {
    const profile = this.getUserProfile(userId);
    const group = this.groups.get(groupId);

    if (!profile || !group) {
      return { success: false, error: 'User or group not found' };
    }

    // Check if already a member
    if (group.members.some(member => member.userId === userId)) {
      return { success: false, error: 'Already a member' };
    }

    // Check if group is full
    if (group.members.length >= group.settings.maxMembers) {
      return { success: false, error: 'Group is full' };
    }

    // Add member
    group.members.push({
      userId,
      role: 'member',
      joinedAt: new Date().toISOString()
    });

    group.stats.memberCount++;
    profile.groups.push(groupId);
    profile.stats.groupsCount++;

    // Create notification for group admin
    const admin = group.members.find(member => member.role === 'admin');
    if (admin && admin.userId !== userId) {
      this.createNotification(admin.userId, {
        type: 'group_joined',
        title: 'New Group Member',
        message: `${profile.displayName} joined your group "${group.name}"`,
        data: { userId, groupId, groupName: group.name }
      });
    }

    // Add activity
    this.addActivity(userId, {
      type: 'group_joined',
      message: `Joined group "${group.name}"`,
      data: { groupId, groupName: group.name }
    });

    return { success: true, group };
  }

  /**
   * Create group challenge
   */
  async createGroupChallenge(userId, groupId, challengeData) {
    const profile = this.getUserProfile(userId);
    const group = this.groups.get(groupId);

    if (!profile || !group) {
      return { success: false, error: 'User or group not found' };
    }

    // Check if user is admin
    const member = group.members.find(m => m.userId === userId);
    if (!member || member.role !== 'admin') {
      return { success: false, error: 'Only admins can create challenges' };
    }

    const challenge = {
      id: `challenge_${Date.now()}`,
      groupId,
      creatorId: userId,
      name: challengeData.name,
      description: challengeData.description,
      type: challengeData.type || 'workout_count', // workout_count, calories, streak, accuracy
      duration: challengeData.duration || 7, // days
      target: challengeData.target,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + (challengeData.duration || 7) * 24 * 60 * 60 * 1000).toISOString(),
      participants: [{
        userId,
        joinedAt: new Date().toISOString(),
        progress: 0,
        completed: false
      }],
      rewards: {
        points: challengeData.points || 100,
        badge: challengeData.badge || null,
        achievement: challengeData.achievement || null
      },
      status: 'active'
    };

    this.challenges.set(challenge.id, challenge);

    // Notify group members
    group.members.forEach(member => {
      if (member.userId !== userId) {
        this.createNotification(member.userId, {
          type: 'group_challenge',
          title: 'New Group Challenge',
          message: `${profile.displayName} created a challenge: "${challenge.name}"`,
          data: { challengeId: challenge.id, groupId, challengeName: challenge.name },
          actionRequired: true
        });
      }
    });

    return { success: true, challenge };
  }

  /**
   * Join group challenge
   */
  async joinGroupChallenge(userId, challengeId) {
    const profile = this.getUserProfile(userId);
    const challenge = this.challenges.get(challengeId);

    if (!profile || !challenge) {
      return { success: false, error: 'User or challenge not found' };
    }

    // Check if already participating
    if (challenge.participants.some(p => p.userId === userId)) {
      return { success: false, error: 'Already participating' };
    }

    // Check if challenge is still active
    if (new Date() > new Date(challenge.endDate)) {
      return { success: false, error: 'Challenge has ended' };
    }

    // Add participant
    challenge.participants.push({
      userId,
      joinedAt: new Date().toISOString(),
      progress: 0,
      completed: false
    });

    profile.stats.challengesJoined++;

    // Create notification
    this.createNotification(challenge.creatorId, {
      type: 'challenge_joined',
      title: 'Challenge Participant',
      message: `${profile.displayName} joined your challenge "${challenge.name}"`,
      data: { userId, challengeId, challengeName: challenge.name }
    });

    return { success: true, challenge };
  }

  /**
   * Share workout to social feed
   */
  async shareWorkout(userId, workoutData) {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      return { success: false, error: 'User not found' };
    }

    const activity = {
      id: `activity_${Date.now()}`,
      userId,
      type: 'workout_shared',
      message: workoutData.message || 'Completed a workout!',
      data: {
        workoutId: workoutData.workoutId,
        exercises: workoutData.exercises?.length || 0,
        duration: workoutData.duration || 0,
        calories: workoutData.calories || 0,
        accuracy: workoutData.avgAccuracy || 0,
        achievements: workoutData.achievements || []
      },
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
      shares: 0
    };

    // Add to user's recent activities
    profile.recentActivities.unshift(activity);
    if (profile.recentActivities.length > 20) {
      profile.recentActivities = profile.recentActivities.slice(0, 20);
    }

    // Add to global activity feed
    this.activities.set(activity.id, activity);

    // Update stats
    profile.stats.workoutsShared++;

    // Notify friends (if enabled)
    if (profile.privacy.workoutSharing) {
      profile.friends.forEach(friendId => {
        const friendProfile = this.getUserProfile(friendId);
        if (friendProfile && friendProfile.preferences.activityUpdates) {
          this.createNotification(friendId, {
            type: 'friend_workout',
            title: 'Friend Workout',
            message: `${profile.displayName} completed a workout!`,
            data: { userId, activityId: activity.id, workoutData },
            actionRequired: false
          });
        }
      });
    }

    return { success: true, activity };
  }

  /**
   * Like activity
   */
  async likeActivity(userId, activityId) {
    const activity = this.activities.get(activityId);
    const profile = this.getUserProfile(userId);

    if (!activity || !profile) {
      return { success: false, error: 'Activity or user not found' };
    }

    // Check if already liked
    if (activity.likes.includes(userId)) {
      return { success: false, error: 'Already liked' };
    }

    // Add like
    activity.likes.push(userId);

    // Create notification for activity owner
    if (activity.userId !== userId) {
      this.createNotification(activity.userId, {
        type: 'activity_liked',
        title: 'Activity Liked',
        message: `${profile.displayName} liked your workout!`,
        data: { userId, activityId },
        actionRequired: false
      });
    }

    return { success: true, likesCount: activity.likes.length };
  }

  /**
   * Comment on activity
   */
  async commentOnActivity(userId, activityId, commentText) {
    const activity = this.activities.get(activityId);
    const profile = this.getUserProfile(userId);

    if (!activity || !profile) {
      return { success: false, error: 'Activity or user not found' };
    }

    const comment = {
      id: `comment_${Date.now()}`,
      userId,
      text: commentText,
      timestamp: new Date().toISOString(),
      likes: []
    };

    if (!activity.comments) {
      activity.comments = [];
    }
    activity.comments.push(comment);

    // Create notification for activity owner
    if (activity.userId !== userId) {
      this.createNotification(activity.userId, {
        type: 'activity_commented',
        title: 'New Comment',
        message: `${profile.displayName} commented on your workout`,
        data: { userId, activityId, commentId: comment.id },
        actionRequired: false
      });
    }

    return { success: true, comment };
  }

  /**
   * Get social feed
   */
  getSocialFeed(userId, limit = 20) {
    const profile = this.getUserProfile(userId);
    if (!profile) return [];

    // Get friends' activities
    const friendIds = profile.friends;
    const allUserIds = [userId, ...friendIds];

    // Get activities from friends and self
    const activities = Array.from(this.activities.values())
      .filter(activity => allUserIds.includes(activity.userId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    // Enrich activities with user data
    return activities.map(activity => {
      const user = this.getUserProfile(activity.userId);
      return {
        ...activity,
        user: user ? {
          userId: activity.userId,
          displayName: user.displayName,
          username: user.username,
          avatar: user.avatar
        } : null
      };
    });
  }

  /**
   * Get community challenges
   */
  getCommunityChallenges(userId, category = 'all') {
    const profile = this.getUserProfile(userId);
    if (!profile) return [];

    // Get challenges from user's groups
    const userGroupIds = profile.groups;
    const groupChallenges = Array.from(this.challenges.values())
      .filter(challenge => 
        userGroupIds.includes(challenge.groupId) && 
        challenge.status === 'active' &&
        new Date() <= new Date(challenge.endDate)
      );

    // Filter by category if specified
    if (category !== 'all') {
      return groupChallenges.filter(challenge => challenge.category === category);
    }

    return groupChallenges;
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(type = 'points', timeframe = 'weekly', limit = 10) {
    const leaderboardId = `${type}_${timeframe}`;
    
    if (!this.leaderboards.has(leaderboardId)) {
      this.updateLeaderboard(type, timeframe);
    }

    const leaderboard = this.leaderboards.get(leaderboardId) || [];
    
    return leaderboard
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
        user: this.getUserProfile(entry.userId)
      }));
  }

  /**
   * Update leaderboard
   */
  updateLeaderboard(type, timeframe) {
    const leaderboardId = `${type}_${timeframe}`;
    const entries = [];

    // Get all users
    this.userProfiles.forEach((profile, userId) => {
      let score = 0;

      switch (type) {
        case 'points':
          // This would integrate with gamification system
          score = profile.points || 0;
          break;
        case 'workouts':
          score = profile.stats?.totalWorkouts || 0;
          break;
        case 'streak':
          score = profile.stats?.streak || 0;
          break;
        case 'accuracy':
          score = profile.stats?.formAccuracy || 0;
          break;
      }

      if (score > 0) {
        entries.push({
          userId,
          score,
          lastUpdated: new Date().toISOString()
        });
      }
    });

    // Sort by score
    entries.sort((a, b) => b.score - a.score);
    this.leaderboards.set(leaderboardId, entries);
  }

  /**
   * Create notification
   */
  createNotification(userId, notification) {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    const fullNotification = {
      id: `notif_${Date.now()}`,
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.get(userId).unshift(fullNotification);

    // Keep only last 50 notifications
    const userNotifications = this.notifications.get(userId);
    if (userNotifications.length > 50) {
      this.notifications.set(userId, userNotifications.slice(0, 50));
    }
  }

  /**
   * Get notifications
   */
  getNotifications(userId, unreadOnly = false) {
    const notifications = this.notifications.get(userId) || [];
    
    if (unreadOnly) {
      return notifications.filter(n => !n.read);
    }
    
    return notifications;
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(userId, notificationId) {
    const notifications = this.notifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      return { success: true };
    }
    
    return { success: false, error: 'Notification not found' };
  }

  /**
   * Add activity to user's feed
   */
  addActivity(userId, activity) {
    const profile = this.getUserProfile(userId);
    if (!profile) return;

    const fullActivity = {
      id: `activity_${Date.now()}`,
      userId,
      ...activity,
      timestamp: new Date().toISOString()
    };

    profile.recentActivities.unshift(fullActivity);
    if (profile.recentActivities.length > 20) {
      profile.recentActivities = profile.recentActivities.slice(0, 20);
    }
  }

  /**
   * Get user profile
   */
  getUserProfile(userId) {
    return this.userProfiles.get(userId);
  }

  /**
   * Update user profile
   */
  updateUserProfile(userId, updates) {
    const profile = this.getUserProfile(userId);
    if (!profile) return { success: false, error: 'User not found' };

    Object.assign(profile, updates);
    return { success: true, profile };
  }

  /**
   * Get user's social stats
   */
  getUserSocialStats(userId) {
    const profile = this.getUserProfile(userId);
    if (!profile) return null;

    return {
      friendsCount: profile.friends.length,
      groupsCount: profile.groups.length,
      challengesJoined: profile.stats.challengesJoined,
      challengesCompleted: profile.stats.challengesCompleted,
      workoutsShared: profile.stats.workoutsShared,
      achievementsShared: profile.stats.achievementsShared,
      recentActivities: profile.recentActivities.length,
      unreadNotifications: this.getNotifications(userId, true).length
    };
  }

  /**
   * Search users
   */
  searchUsers(query, userId) {
    const results = [];
    const searchLower = query.toLowerCase();

    this.userProfiles.forEach((profile, profileId) => {
      // Don't include self
      if (profileId === userId) return;

      // Check privacy settings
      if (profile.privacy.profileVisibility === 'private') return;

      // Search in username, display name, and bio
      const matchesUsername = profile.username.toLowerCase().includes(searchLower);
      const matchesDisplayName = profile.displayName.toLowerCase().includes(searchLower);
      const matchesBio = profile.bio.toLowerCase().includes(searchLower);

      if (matchesUsername || matchesDisplayName || matchesBio) {
        results.push({
          userId: profileId,
          username: profile.username,
          displayName: profile.displayName,
          avatar: profile.avatar,
          bio: profile.bio,
          location: profile.location,
          stats: profile.stats,
          isFriend: profile.friends.includes(userId)
        });
      }
    });

    return results.slice(0, 20); // Limit results
  }

  /**
   * Get trending activities
   */
  getTrendingActivities(limit = 10) {
    const activities = Array.from(this.activities.values());
    
    // Sort by likes count and recency
    const trending = activities
      .sort((a, b) => {
        const aScore = (a.likes?.length || 0) * 2 + (a.comments?.length || 0);
        const bScore = (b.likes?.length || 0) * 2 + (b.comments?.length || 0);
        return bScore - aScore;
      })
      .slice(0, limit);

    // Enrich with user data
    return trending.map(activity => {
      const user = this.getUserProfile(activity.userId);
      return {
        ...activity,
        user: user ? {
          userId: activity.userId,
          displayName: user.displayName,
          username: user.username,
          avatar: user.avatar
        } : null
      };
    });
  }

  /**
   * Get community stats
   */
  getCommunityStats() {
    const totalUsers = this.userProfiles.size;
    const totalGroups = this.groups.size;
    const totalChallenges = this.challenges.size;
    const totalActivities = this.activities.size;

    let totalFriends = 0;
    let totalWorkoutsShared = 0;
    let activeUsersToday = 0;

    const today = new Date().toDateString();

    this.userProfiles.forEach(profile => {
      totalFriends += profile.friends.length;
      totalWorkoutsShared += profile.stats.workoutsShared;
      
      // Check if user was active today (simplified check)
      if (profile.recentActivities.length > 0) {
        const latestActivity = profile.recentActivities[0];
        if (new Date(latestActivity.timestamp).toDateString() === today) {
          activeUsersToday++;
        }
      }
    });

    return {
      totalUsers,
      totalGroups,
      totalChallenges,
      totalActivities,
      totalFriends,
      totalWorkoutsShared,
      activeUsersToday,
      avgFriendsPerUser: totalUsers > 0 ? Math.round(totalFriends / totalUsers) : 0
    };
  }
}

// Export singleton instance
export const socialFeaturesEngine = new SocialFeaturesEngine();

// Export utility functions
export const calculateSocialEngagement = (userId) => {
  const profile = socialFeaturesEngine.getUserProfile(userId);
  if (!profile) return 0;

  const friendsCount = profile.friends.length;
  const groupsCount = profile.groups.length;
  const activitiesCount = profile.recentActivities.length;
  const challengesJoined = profile.stats.challengesJoined;

  // Simple engagement score
  return (friendsCount * 2) + (groupsCount * 3) + (activitiesCount * 1) + (challengesJoined * 2);
};

export const getSocialRecommendations = (userId) => {
  const profile = socialFeaturesEngine.getUserProfile(userId);
  if (!profile) return [];

  const recommendations = [];

  // Recommend friends based on mutual connections
  if (profile.friends.length < 10) {
    const friendsOfFriends = new Set();
    profile.friends.forEach(friendId => {
      const friendProfile = socialFeaturesEngine.getUserProfile(friendId);
      if (friendProfile) {
        friendProfile.friends.forEach(fofId => {
          if (fofId !== userId && !profile.friends.includes(fofId)) {
            friendsOfFriends.add(fofId);
          }
        });
      }
    });

    friendsOfFriends.forEach(fofId => {
      const fofProfile = socialFeaturesEngine.getUserProfile(fofId);
      if (fofProfile) {
        recommendations.push({
          type: 'friend_suggestion',
          user: {
            userId: fofId,
            displayName: fofProfile.displayName,
            username: fofProfile.username,
            avatar: fofProfile.avatar,
            mutualFriends: profile.friends.filter(fId => 
              fofProfile.friends.includes(fId)
            ).length
          }
        });
      }
    });
  }

  // Recommend groups based on interests
  if (profile.groups.length < 5) {
    // This would integrate with user's workout preferences
    recommendations.push({
      type: 'group_suggestion',
      group: {
        name: 'Beginner Fitness Enthusiasts',
        description: 'Perfect for those starting their fitness journey',
        memberCount: 156,
        category: 'beginner'
      }
    });
  }

  return recommendations.slice(0, 5);
};
