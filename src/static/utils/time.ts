type TimeZoneOption = 'local' | 'utc';

export const formatISOToDateTime = (
  isoString: string,
  timeZone: TimeZoneOption = 'local'
): string => {
  const date = new Date(isoString);

  // 验证日期有效性
  if (isNaN(date.getTime())) {
    throw new Error('Invalid ISO date string');
  }

  // 根据时区选项选择获取方法
  const getYear = timeZone === 'utc' 
    ? (d: Date) => d.getUTCFullYear() 
    : (d: Date) => d.getFullYear();
  
  const getMonth = timeZone === 'utc' 
    ? (d: Date) => String(d.getUTCMonth() + 1).padStart(2, '0') 
    : (d: Date) => String(d.getMonth() + 1).padStart(2, '0');
  
  const getDay = timeZone === 'utc' 
    ? (d: Date) => String(d.getUTCDate()).padStart(2, '0') 
    : (d: Date) => String(d.getDate()).padStart(2, '0');
  
  const getHours = timeZone === 'utc' 
    ? (d: Date) => String(d.getUTCHours()).padStart(2, '0') 
    : (d: Date) => String(d.getHours()).padStart(2, '0');
  
  const getMinutes = timeZone === 'utc' 
    ? (d: Date) => String(d.getUTCMinutes()).padStart(2, '0') 
    : (d: Date) => String(d.getMinutes()).padStart(2, '0');
  
  const getSeconds = timeZone === 'utc' 
    ? (d: Date) => String(d.getUTCSeconds()).padStart(2, '0') 
    : (d: Date) => String(d.getSeconds()).padStart(2, '0');

  return `${getYear(date)}年${getMonth(date)}月${getDay(date)}日 ${getHours(date)}:${getMinutes(date)}:${getSeconds(date)}`;
}

export const formatChatMessage = (content: string | null): string => {
  if (!content) return "暂无消息";
  
  // 正则检测图片链接（支持常见格式和带参数链接）
  const isImageLink = /\.(jpg|jpeg|png|gif|bmp|webp|svg|webp)(\?.*)?$/i.test(content);
  // console.log('isImageLink:', isImageLink, 'content:', content);
  
  return isImageLink ? "IMAGE" : content;
}

// 修改formatChatTime实现智能时间合并
export const formatChatTime = (timestamp: string, referenceTime?: string) => {
  const inputTime = new Date(timestamp);
  const refTime = referenceTime ? new Date(referenceTime) : new Date();
  const diffMs = refTime.getTime() - inputTime.getTime();
  
  // 处理未来时间
  if (diffMs < 0) return '';
  
  // 计算时间差值
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  
  // 根据时间差选择显示格式
  if (diffSeconds < 60) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  
  // 核心优化：同一小时内消息合并显示
  if (diffHours < 24) {
    if (diffMs <= 3600000) return ''; // 1小时内不显示时间
    return `${diffHours}小时前`;
  }
  
  // 检查是否为昨天
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = inputTime.getDate() === yesterday.getDate() &&
                     inputTime.getMonth() === yesterday.getMonth() &&
                     inputTime.getFullYear() === yesterday.getFullYear();
  
  if (isYesterday) return `昨天 ${inputTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  
  // 显示完整日期
  return inputTime.toLocaleString('zh-CN', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};