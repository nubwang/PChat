/**
 * 格式化聊天时间（仿微信逻辑）
 * @param {string|Date} messageTime 消息时间（支持字符串或Date对象）
 * @returns {string} 格式化后的时间字符串
 */
function formatChatTime(messageTime) {
  // console.log(messageTime,'messageTime')
  // 统一转换为Date对象并处理时区
  const msgDate = new Date(messageTime);
  const now = new Date();

  // 处理无效日期
  if (isNaN(msgDate.getTime())) return '无效时间';

  // 归一化时间到00:00:00（便于日期比较）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

  // 1. 今天的时间（显示 HH:MM）
  if (isSameDay(msgDay, today)) {
    return `${msgDate.getHours().toString().padStart(2, '0')}:${msgDate.getMinutes().toString().padStart(2, '0')}`;
  }

  // 2. 昨天的时间（显示"昨天"）
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(msgDay, yesterday)) {
    return '昨天';
  }

  // 3. 本周内的时间（显示星期几）
  const startOfWeek = getStartOfWeek(today);
  if (msgDay >= startOfWeek && msgDay <= today) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[msgDate.getDay()];
  }

  // 4. 今年的时间（显示 MM月DD日）
  if (msgDate.getFullYear() === now.getFullYear()) {
    return `${msgDate.getMonth() + 1}月${msgDate.getDate()}日`;
  }

  // 5. 跨年的时间（显示 YYYY年MM月DD日）
  return `${msgDate.getFullYear()}年${msgDate.getMonth() + 1}月${msgDate.getDate()}日`;
}

// 辅助函数：判断两个日期是否同一天
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// 辅助函数：获取指定日期的周一（ISO周标准）
function getStartOfWeek(date) {
  const dayOfWeek = date.getDay();
  const diff = (dayOfWeek === 0 ? -6 : 1); // 调整周日到周一的偏移量
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - (dayOfWeek - 1 + (dayOfWeek === 0 ? -7 : 0)));
  return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
}

export { formatChatTime };
// 测试用例
// console.log(formatChatTime('2025-09-08T15:29:05')); // 今天 → 15:29
// console.log(formatChatTime('2025-09-07T10:00:00')); // 昨天 → 昨天
// console.log(formatChatTime('2025-09-06T08:30:00')); // 本周 → 周五
// console.log(formatChatTime('2025-08-15T14:00:00')); // 今年 → 8月15日
// console.log(formatChatTime('2024-12-31T23:59:59')); // 去年 → 2024年12月31日
