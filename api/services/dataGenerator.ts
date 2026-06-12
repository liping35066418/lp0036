import { db } from '../db/database.js';
import dayjs from 'dayjs';

const PLATFORM_NAMES = ['douyin', 'kuaishou', 'xiaohongshu', 'weixin', 'bilibili', 'weibo'];
const CONTENT_TYPES = ['video', 'image', 'article', 'live'];
const CHANNELS = ['美食', '旅行', '美妆', '科技', '教育', '健身', '游戏', '音乐', '时尚', '萌宠', '财经', '汽车'];
const USERNAME_PREFIXES = ['达人', '博主', '创作者', '官方', '精选', '生活', '美食家', '旅行者', '科技控', '美妆师'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhoneNumber(): string {
  const prefixes = ['138', '139', '158', '159', '188', '189', '135', '136', '150', '151'];
  return randomChoice(prefixes) + Math.random().toString().slice(2, 10);
}

export function generateMockAccounts(count: number = 30) {
  const platforms = db.prepare('SELECT * FROM platforms').all() as any[];
  if (platforms.length === 0) return [];

  const insertAccount = db.prepare(`
    INSERT OR IGNORE INTO accounts (
      platform_id, platform_account_id, username, nickname, avatar,
      description, followers_count, following_count, total_likes, total_plays, verified, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  const createdAccounts: any[] = [];

  const insertMany = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const platform = randomChoice(platforms);
      const prefix = randomChoice(USERNAME_PREFIXES);
      const username = `${prefix}_${randomInt(1000, 9999)}`;
      const followers = randomInt(1000, 5000000);
      const platformAccountId = generatePhoneNumber();

      const result = insertAccount.run(
        platform.id,
        platformAccountId,
        username,
        username,
        '',
        `这是一个${platform.display_name}的优质创作者账号，专注于${randomChoice(CHANNELS)}领域内容创作。`,
        followers,
        randomInt(100, 2000),
        randomInt(10000, followers * 10),
        randomInt(100000, followers * 50),
        Math.random() > 0.7 ? 1 : 0
      );

      if (result.lastInsertRowid) {
        createdAccounts.push({
          id: result.lastInsertRowid,
          platform_id: platform.id,
          username,
          followers_count: followers,
        });
      }
    }
  });

  insertMany();
  return createdAccounts;
}

export function generateMockPosts(accountCount: number = 30, postsPerAccount: number = 20) {
  const accountsList = db.prepare('SELECT * FROM accounts ORDER BY RANDOM() LIMIT ?').all(accountCount) as any[];

  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO posts (
      account_id, platform_id, platform_post_id, title, content, cover_image,
      content_type, publish_time, duration, tags, channel,
      play_count, like_count, comment_count, share_count, collect_count,
      conversion_count, conversion_amount, follower_increase, hot_score, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
  `);

  const insertMetric = db.prepare(`
    INSERT OR IGNORE INTO post_metrics_daily (
      post_id, account_id, platform_id, stat_date,
      play_count, play_increment,
      like_count, like_increment,
      comment_count, comment_increment,
      share_count, share_increment,
      collect_count, collect_increment,
      conversion_count, conversion_increment,
      conversion_amount, conversion_amount_increment,
      follower_increase
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAccountMetric = db.prepare(`
    INSERT OR IGNORE INTO account_metrics_daily (
      account_id, platform_id, stat_date,
      followers_count, follower_increase,
      total_posts, total_plays, play_increment,
      total_likes, like_increment,
      total_comments, comment_increment,
      total_shares, share_increment,
      total_conversions, conversion_increment,
      total_conversion_amount, conversion_amount_increment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdPosts: any[] = [];

  const insertMany = db.transaction(() => {
    for (const account of accountsList) {
      const dailyStats: { [date: string]: any } = {};

      for (let i = 0; i < postsPerAccount; i++) {
        const daysAgo = randomInt(1, 90);
        const publishTime = dayjs().subtract(daysAgo, 'day').toISOString();
        const publishDate = dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD');

        const contentType = randomChoice(['video', 'video', 'video', 'image', 'article']);
        const channel = randomChoice(CHANNELS);

        const basePlays = contentType === 'video' ? randomInt(1000, 100000) : randomInt(500, 30000);
        const likeRatio = randomInt(20, 100) / 1000;
        const commentRatio = randomInt(5, 30) / 1000;
        const shareRatio = randomInt(2, 15) / 1000;
        const collectRatio = randomInt(5, 40) / 1000;
        const conversionRatio = randomInt(1, 10) / 1000;

        const plays = basePlays;
        const likes = Math.floor(plays * likeRatio);
        const comments = Math.floor(plays * commentRatio);
        const shares = Math.floor(plays * shareRatio);
        const collects = Math.floor(plays * collectRatio);
        const conversions = Math.floor(plays * conversionRatio);
        const conversionAmount = conversions * randomInt(50, 500);
        const followerIncrease = Math.floor(plays * 0.001);

        const publishDays = daysAgo;
        const followersCount = account.followers_count;
        const hotScore = calculateHotScore(plays, likes, comments, shares, publishDays, followersCount);

        const platformPostId = `post_${account.platform_id}_${randomInt(100000, 999999)}`;

        const result = insertPost.run(
          account.id,
          account.platform_id,
          platformPostId,
          `这是${channel}领域的精彩${contentType === 'video' ? '视频' : contentType === 'image' ? '图文' : '文章'}内容`,
          `分享${channel}相关的知识和经验，希望大家喜欢。记得点赞收藏哦！`,
          '',
          contentType,
          publishTime,
          contentType === 'video' ? randomInt(15, 600) : 0,
          `#${channel}#好物分享`,
          channel,
          plays,
          likes,
          comments,
          shares,
          collects,
          conversions,
          conversionAmount,
          followerIncrease,
          hotScore
        );

        const postId = result.lastInsertRowid as number;
        createdPosts.push({ id: postId, account_id: account.id, plays, likes });

        const numDays = Math.min(daysAgo, 30);
        let remainingPlays = plays;
        let remainingLikes = likes;
        let remainingComments = comments;
        let remainingShares = shares;
        let remainingCollects = collects;
        let remainingConversions = conversions;
        let remainingConversionAmount = conversionAmount;
        let remainingFollowerIncrease = followerIncrease;

        for (let d = 0; d < numDays; d++) {
          const statDate = dayjs(publishDate).add(d, 'day').format('YYYY-MM-DD');
          const dayFactor = d === 0 ? 0.4 : d === 1 ? 0.25 : d === 2 ? 0.15 : Math.exp(-0.2 * d) * 0.1;

          const dayPlays = d === numDays - 1 ? remainingPlays : Math.floor(plays * dayFactor);
          const dayLikes = d === numDays - 1 ? remainingLikes : Math.floor(likes * dayFactor);
          const dayComments = d === numDays - 1 ? remainingComments : Math.floor(comments * dayFactor);
          const dayShares = d === numDays - 1 ? remainingShares : Math.floor(shares * dayFactor);
          const dayCollects = d === numDays - 1 ? remainingCollects : Math.floor(collects * dayFactor);
          const dayConversions = d === numDays - 1 ? remainingConversions : Math.floor(conversions * dayFactor);
          const dayConversionAmount = d === numDays - 1 ? remainingConversionAmount : Math.floor(conversionAmount * dayFactor);
          const dayFollowerIncrease = d === numDays - 1 ? remainingFollowerIncrease : Math.floor(followerIncrease * dayFactor);

          remainingPlays = Math.max(0, remainingPlays - dayPlays);
          remainingLikes = Math.max(0, remainingLikes - dayLikes);
          remainingComments = Math.max(0, remainingComments - dayComments);
          remainingShares = Math.max(0, remainingShares - dayShares);
          remainingCollects = Math.max(0, remainingCollects - dayCollects);
          remainingConversions = Math.max(0, remainingConversions - dayConversions);
          remainingConversionAmount = Math.max(0, remainingConversionAmount - dayConversionAmount);
          remainingFollowerIncrease = Math.max(0, remainingFollowerIncrease - dayFollowerIncrease);

          insertMetric.run(
            postId,
            account.id,
            account.platform_id,
            statDate,
            Math.floor(plays * (1 - Math.exp(-0.3 * (d + 1)))),
            dayPlays,
            Math.floor(likes * (1 - Math.exp(-0.3 * (d + 1)))),
            dayLikes,
            Math.floor(comments * (1 - Math.exp(-0.3 * (d + 1)))),
            dayComments,
            Math.floor(shares * (1 - Math.exp(-0.3 * (d + 1)))),
            dayShares,
            Math.floor(collects * (1 - Math.exp(-0.3 * (d + 1)))),
            dayCollects,
            Math.floor(conversions * (1 - Math.exp(-0.3 * (d + 1)))),
            dayConversions,
            Math.floor(conversionAmount * (1 - Math.exp(-0.3 * (d + 1)))),
            dayConversionAmount,
            dayFollowerIncrease
          );

          if (!dailyStats[statDate]) {
            dailyStats[statDate] = {
              plays: 0,
              likes: 0,
              comments: 0,
              shares: 0,
              conversions: 0,
              conversionAmount: 0,
              followerIncrease: 0,
              postCount: 0,
            };
          }
          dailyStats[statDate].plays += dayPlays;
          dailyStats[statDate].likes += dayLikes;
          dailyStats[statDate].comments += dayComments;
          dailyStats[statDate].shares += dayShares;
          dailyStats[statDate].conversions += dayConversions;
          dailyStats[statDate].conversionAmount += dayConversionAmount;
          dailyStats[statDate].followerIncrease += dayFollowerIncrease;
          if (d === 0) dailyStats[statDate].postCount += 1;
        }
      }

      let cumulativePlays = account.total_plays - randomInt(0, account.total_plays / 2);
      let cumulativeLikes = account.total_likes - randomInt(0, account.total_likes / 2);
      let cumulativeComments = 0;
      let cumulativeShares = 0;
      let cumulativeConversions = 0;
      let cumulativeConversionAmount = 0;
      let currentFollowers = account.followers_count - randomInt(0, account.followers_count / 3);

      for (let d = 90; d >= 0; d--) {
        const statDate = dayjs().subtract(d, 'day').format('YYYY-MM-DD');
        const stats = dailyStats[statDate] || { plays: 0, likes: 0, comments: 0, shares: 0, conversions: 0, conversionAmount: 0, followerIncrease: 0, postCount: 0 };

        cumulativePlays += stats.plays;
        cumulativeLikes += stats.likes;
        cumulativeComments += stats.comments;
        cumulativeShares += stats.shares;
        cumulativeConversions += stats.conversions;
        cumulativeConversionAmount += stats.conversionAmount;
        currentFollowers += stats.followerIncrease;

        const postCount = Object.values(dailyStats).filter((s: any) => dayjs(s.date).isBefore(dayjs(statDate).add(1, 'day'))).length;

        insertAccountMetric.run(
          account.id,
          account.platform_id,
          statDate,
          Math.floor(currentFollowers),
          stats.followerIncrease,
          stats.postCount || 0,
          Math.floor(cumulativePlays),
          stats.plays,
          Math.floor(cumulativeLikes),
          stats.likes,
          Math.floor(cumulativeComments),
          stats.comments,
          Math.floor(cumulativeShares),
          stats.shares,
          Math.floor(cumulativeConversions),
          stats.conversions,
          cumulativeConversionAmount,
          stats.conversionAmount
        );
      }
    }
  });

  insertMany();
  return createdPosts;
}

function calculateHotScore(
  playCount: number,
  likeCount: number,
  commentCount: number,
  shareCount: number,
  publishDays: number,
  followersCount: number
): number {
  const playWeight = 0.3;
  const likeWeight = 0.25;
  const commentWeight = 0.25;
  const shareWeight = 0.2;

  const normalizedPlays = followersCount > 0 ? playCount / followersCount : playCount / 1000;
  const normalizedLikes = playCount > 0 ? likeCount / playCount : 0;
  const normalizedComments = playCount > 0 ? commentCount / playCount : 0;
  const normalizedShares = playCount > 0 ? shareCount / playCount : 0;

  const baseScore =
    normalizedPlays * playWeight * 1000 +
    normalizedLikes * likeWeight * 100 +
    normalizedComments * commentWeight * 100 +
    normalizedShares * shareWeight * 100;

  const decayFactor = Math.exp(-0.05 * publishDays);

  return Math.round(baseScore * decayFactor * 100) / 100;
}

export function generateMockLiveRooms(count: number = 20) {
  const accounts = db.prepare('SELECT * FROM accounts ORDER BY RANDOM() LIMIT ?').all(count) as any[];

  const insertLive = db.prepare(`
    INSERT OR IGNORE INTO live_rooms (
      account_id, platform_id, platform_live_id, title, cover_image,
      start_time, end_time, duration, status,
      max_viewers, total_viewers, new_followers,
      like_count, comment_count, share_count,
      gift_count, gift_amount, product_count, sales_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (const account of accounts) {
      const daysAgo = randomInt(0, 30);
      const startTime = dayjs().subtract(daysAgo, 'day').hour(randomInt(18, 22)).minute(randomInt(0, 59)).toISOString();
      const duration = randomInt(30, 240);
      const endTime = dayjs(startTime).add(duration, 'minute').toISOString();

      const maxViewers = randomInt(100, 50000);
      const totalViewers = maxViewers * randomInt(2, 10);
      const newFollowers = Math.floor(totalViewers * 0.01);
      const likeCount = Math.floor(totalViewers * randomInt(5, 20) / 100);
      const commentCount = Math.floor(totalViewers * randomInt(2, 10) / 100);
      const shareCount = Math.floor(totalViewers * randomInt(1, 5) / 100);
      const giftCount = Math.floor(totalViewers * randomInt(5, 30) / 100);
      const giftAmount = giftCount * randomInt(5, 100);
      const productCount = randomInt(5, 50);
      const salesAmount = randomInt(1000, 200000);

      insertLive.run(
        account.id,
        account.platform_id,
        `live_${account.platform_id}_${randomInt(100000, 999999)}`,
        `直播${randomChoice(CHANNELS)}好物分享`,
        '',
        startTime,
        endTime,
        duration,
        daysAgo === 0 && dayjs().isBefore(dayjs(endTime)) ? 'living' : 'ended',
        maxViewers,
        totalViewers,
        newFollowers,
        likeCount,
        commentCount,
        shareCount,
        giftCount,
        giftAmount,
        productCount,
        salesAmount
      );
    }
  });

  insertMany();
}

export function initMockData() {
  const accountCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };

  let accounts: any[] = [];
  if (accountCount.count < 10) {
    accounts = generateMockAccounts(30);
    console.log(`Generated ${accounts.length} mock accounts`);
  }

  if (postCount.count < 50) {
    const totalAccounts = accountCount.count || 30;
    const posts = generateMockPosts(totalAccounts, 20);
    console.log(`Generated ${posts.length} mock posts for ${totalAccounts} accounts`);
  }

  const liveCount = db.prepare('SELECT COUNT(*) as count FROM live_rooms').get() as { count: number };
  if (liveCount.count < 10) {
    const totalAccounts = accountCount.count || 30;
    generateMockLiveRooms(totalAccounts);
    console.log(`Generated mock live rooms for ${totalAccounts} accounts`);
  }

  const defaultDashboard = db.prepare('SELECT COUNT(*) as count FROM dashboards WHERE is_default = 1').get() as { count: number };
  if (defaultDashboard.count === 0) {
    initDefaultDashboard();
  }
}

function initDefaultDashboard() {
  const insertDashboard = db.prepare(`
    INSERT INTO dashboards (name, description, is_default)
    VALUES (?, ?, 1)
  `);
  const result = insertDashboard.run('默认看板', '系统默认数据看板');
  const dashboardId = result.lastInsertRowid as number;

  const widgets = [
    { widget_type: 'metric_cards', title: '核心指标概览', position_x: 0, position_y: 0, width: 12, height: 2 },
    { widget_type: 'trend_chart', title: '数据趋势图', position_x: 0, position_y: 2, width: 8, height: 4 },
    { widget_type: 'platform_pie', title: '平台分布', position_x: 8, position_y: 2, width: 4, height: 4 },
    { widget_type: 'content_type_pie', title: '内容类型分布', position_x: 0, position_y: 6, width: 4, height: 4 },
    { widget_type: 'top_posts', title: '热门作品排行', position_x: 4, position_y: 6, width: 8, height: 4 },
    { widget_type: 'account_ranking', title: '账号排行榜', position_x: 0, position_y: 10, width: 6, height: 4 },
    { widget_type: 'channel_distribution', title: '流量渠道分布', position_x: 6, position_y: 10, width: 6, height: 4 },
  ];

  const insertWidget = db.prepare(`
    INSERT INTO dashboard_widgets (dashboard_id, widget_type, title, position_x, position_y, width, height)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const widget of widgets) {
    insertWidget.run(dashboardId, widget.widget_type, widget.title, widget.position_x, widget.position_y, widget.width, widget.height);
  }
}

export default {
  generateMockAccounts,
  generateMockPosts,
  generateMockLiveRooms,
  initMockData,
};
